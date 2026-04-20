import { app, BrowserWindow, Notification, dialog, ipcMain, shell, Menu, MenuItem, globalShortcut } from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
import ytdl from '@distube/ytdl-core'
import ytSearch from 'yt-search'
import ffmpegPath from 'ffmpeg-static'
import { YoutubeTranscript } from 'youtube-transcript/dist/youtube-transcript.esm.js'
import pkgUpdater from 'electron-updater'
const { autoUpdater } = pkgUpdater
import { 
  initDatabase, getNotes, saveNotes, 
  getLibrary, saveLibrary, 
  getLibraryPage, getCollectionStats, saveVocabItem, deleteVocabItem,
  getCollections, saveCollections, migrateCollection, disbandCollection,
  getSearchLog, addSearchLog, deleteSearchLog, clearSearchLog,
  searchLibraryFTS
} from './database.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const isDev = !app.isPackaged

// Shield Persistence: Atomic Save Protocol
function atomicWriteJsonSync(filePath, data) {
  const tempPath = `${filePath}.tmp`
  try {
    // Snapshot Engine: Multi-point recovery
    if (fs.existsSync(filePath)) {
      const snapshotDir = path.join(path.dirname(filePath), '.snapshots')
      if (!fs.existsSync(snapshotDir)) fs.mkdirSync(snapshotDir, { recursive: true })
      const stamp = new Date().toISOString().replace(/[:.]/g, '-')
      fs.copyFileSync(filePath, path.join(snapshotDir, `${path.basename(filePath)}.${stamp}.bak`))
    }
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf8')
    fs.renameSync(tempPath, filePath)
    console.log(`[SENTRY] Snapshot & Atomic write successful: ${path.basename(filePath)}`)
    return true
  } catch (err) {
    console.error(`[CRITICAL] Atomic write failed: ${path.basename(filePath)}`, err)
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath)
    return false
  }
}

// Remove the native menu bar immediately
Menu.setApplicationMenu(null)
const APP_ID = 'com.studytube.app'

app.whenReady().then(() => {
  initDatabase()
  try {
    const stats = getCollectionStats()
    console.log('[ARCHIVE AUDIT] Initial Density:', JSON.stringify(stats))
  } catch (e) {
    console.error('[ARCHIVE AUDIT] Initial Audit Failed', e)
  }
})
if (process.platform === 'win32') app.setAppUserModelId(APP_ID)

const activeDownloads = new Map()
const DEFAULT_QUALITY_OPTIONS = [
  { label: '1080p', value: 'video:1080' },
  { label: '720p', value: 'video:720' },
  { label: '480p', value: 'video:480' },
  { label: '360p', value: 'video:360' },
  { label: 'MP3 (192kbps)', value: 'audio:mp3' },
]

// ─── State ──────────────────────────────────────────────────────────────────
function getStateFilePath() { return path.join(app.getPath('userData'), 'app-state.json') }
function readAppState() { try { return JSON.parse(fs.readFileSync(getStateFilePath(), 'utf-8')) } catch { return {} } }
function writeAppState(patch) {
  const next = { ...readAppState(), ...patch }
  fs.mkdirSync(path.dirname(getStateFilePath()), { recursive: true })
  fs.writeFileSync(getStateFilePath(), JSON.stringify(next, null, 2))
  return next
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function sanitizeFileName(name) { return name.replace(/[<>:"/\\|?*\u0000-\u001F]/g, '').trim().slice(0, 200) || 'video' }
function canonicalize(url) {
  const s = String(url || '').trim()
  try { if (ytdl.validateURL(s)) return `https://www.youtube.com/watch?v=${ytdl.getURLVideoID(s)}` } catch {}
  return s
}
function sendToRenderer(wc, channel, data) { if (!wc.isDestroyed()) wc.send(channel, data) }
function buildQualityOptions(heights) {
  const opts = [...new Set(heights)].filter(Boolean).sort((a, b) => b - a).slice(0, 6).map(h => ({ label: `${h}p`, value: `video:${h}` }))
  opts.push({ label: 'MP3 (192kbps)', value: 'audio:mp3' })
  return opts
}

// ─── Metadata (ytdl-core) ────────────────────────────────────────────────────
async function fetchMetadata(url) {
  const info = await ytdl.getInfo(url)
  const details = info.videoDetails
  const heights = info.formats.map(f => Number(f.height)).filter(h => Number.isFinite(h) && h > 0)
  const thumbnail = [...(details.thumbnails ?? [])].sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0]?.url || ''
  const rawTitle = details.title || ''
  const cleanTitle = (rawTitle === 'YouTube Video' || rawTitle === 'youtube video') ? '' : rawTitle

  return {
    id: details.videoId,
    title: cleanTitle,
    duration: Number(details.lengthSeconds) || 0,
    thumbnail,
    url,
    author: details.author?.name || '',
    views: Number(details.viewCount) || 0,
    description: details.description || '',
    qualityOptions: heights.length ? buildQualityOptions(heights) : DEFAULT_QUALITY_OPTIONS,
  }
}

// ─── Download ───────────────────────────────────────────
async function downloadVideo({ webContents, taskId, url, format, savePath, safeTitle }) {
  const isAudio = format === 'audio:mp3'
  const targetH = Number(format.split(':')[1])
  const stem = isAudio ? safeTitle : `${safeTitle}-${Number.isFinite(targetH) ? targetH : 'best'}p`
  const outPath = path.join(savePath, `${stem}.${isAudio ? 'mp3' : 'mp4'}`)

  let aborted = false
  let activeStream1 = null
  let activeStream2 = null
  let activeProc = null

  activeDownloads.set(taskId, {
    abort() {
      aborted = true
      try { activeStream1?.destroy() } catch {}
      try { activeStream2?.destroy() } catch {}
      try { activeProc?.kill('SIGTERM') } catch {}
    }
  })

  const checkAbort = () => { if (aborted) throw new Error('CANCELLED') }
  const agent = ytdl.createAgent()
  const info = await ytdl.getInfo(url)
  checkAbort()

  if (isAudio) {
    const audioFmt = ytdl.chooseFormat(info.formats, { quality: 'highestaudio', filter: 'audioonly' })
    const audioTmp = path.join(savePath, `${safeTitle}_a_${taskId.slice(0, 8)}.tmp`)
    const total = Number(audioFmt.contentLength) || 0
    let downloaded = 0

    await new Promise((resolve, reject) => {
      const stream = ytdl.downloadFromInfo(info, { format: audioFmt, agent })
      activeStream1 = stream
      stream.on('data', chunk => {
        downloaded += chunk.length
        if (aborted) return stream.destroy()
        if (total > 0) {
          const pct = Math.min(90, Math.round((downloaded / total) * 90))
          sendToRenderer(webContents, 'download:progress', { taskId, percent: pct, status: `Downloading ${pct}%` })
        }
      })
      stream.on('error', reject)
      const file = fs.createWriteStream(audioTmp)
      stream.pipe(file)
      file.on('finish', resolve)
      file.on('error', reject)
    })

    checkAbort()
    sendToRenderer(webContents, 'download:progress', { taskId, percent: 92, status: 'Converting to MP3…' })

    await new Promise((resolve, reject) => {
      const proc = spawn(ffmpegPath, ['-i', audioTmp, '-codec:a', 'libmp3lame', '-q:a', '0', '-y', outPath])
      activeProc = proc
      proc.on('close', code => {
        try { fs.unlinkSync(audioTmp) } catch {}
        activeDownloads.delete(taskId)
        code === 0 ? resolve() : reject(new Error(`ffmpeg exited with code ${code}`))
      })
      proc.on('error', err => { try { fs.unlinkSync(audioTmp) } catch {}; reject(err) })
    })

    return outPath
  }

  let videoFormats = info.formats.filter(f => f.hasVideo && !f.hasAudio)
  if (Number.isFinite(targetH)) {
    const below = videoFormats.filter(f => (f.height ?? 0) <= targetH)
    if (below.length) videoFormats = below
  }
  videoFormats.sort((a, b) => (b.height ?? 0) - (a.height ?? 0))
  const videoFmt = videoFormats[0]
  if (!videoFmt) throw new Error('No video format found')

  const audioFmt = ytdl.chooseFormat(info.formats, { quality: 'highestaudio', filter: 'audioonly' })
  const videoTmp = path.join(savePath, `${safeTitle}_v_${taskId.slice(0, 8)}.tmp`)
  const audioTmp = path.join(savePath, `${safeTitle}_a_${taskId.slice(0, 8)}.tmp`)
  const totalSize = (Number(videoFmt.contentLength) || 0) + (Number(audioFmt?.contentLength) || 0)
  let downloaded = 0

  await new Promise((resolve, reject) => {
    const stream = ytdl.downloadFromInfo(info, { format: videoFmt, agent })
    activeStream1 = stream
    stream.on('data', chunk => {
      downloaded += chunk.length
      if (aborted) return stream.destroy()
      const pct = totalSize > 0 ? Math.min(55, Math.round((downloaded / totalSize) * 80)) : 0
      sendToRenderer(webContents, 'download:progress', { taskId, percent: pct, status: `Downloading video…` })
    })
    stream.on('error', reject)
    const file = fs.createWriteStream(videoTmp)
    stream.pipe(file)
    file.on('finish', resolve)
    file.on('error', reject)
  })

  checkAbort()

  await new Promise((resolve, reject) => {
    const stream = ytdl.downloadFromInfo(info, { format: audioFmt, agent })
    activeStream2 = stream
    stream.on('data', chunk => {
      downloaded += chunk.length
      if (aborted) return stream.destroy()
      const pct = totalSize > 0 ? Math.min(85, Math.round((downloaded / totalSize) * 80)) : 60
      sendToRenderer(webContents, 'download:progress', { taskId, percent: pct, status: `Downloading audio…` })
    })
    stream.on('error', reject)
    const file = fs.createWriteStream(audioTmp)
    stream.pipe(file)
    file.on('finish', resolve)
    file.on('error', reject)
  })

  checkAbort()
  sendToRenderer(webContents, 'download:progress', { taskId, percent: 90, status: 'Merging streams…' })

  await new Promise((resolve, reject) => {
    const proc = spawn(ffmpegPath, ['-i', videoTmp, '-i', audioTmp, '-c:v', 'copy', '-c:a', 'aac', '-y', outPath])
    activeProc = proc
    proc.on('close', code => {
      try { fs.unlinkSync(videoTmp); fs.unlinkSync(audioTmp) } catch {}
      activeDownloads.delete(taskId)
      code === 0 ? resolve() : reject(new Error(`ffmpeg merge failed`))
    })
    proc.on('error', err => { try { fs.unlinkSync(videoTmp); fs.unlinkSync(audioTmp) } catch {}; reject(err) })
  })

  return outPath
}

// ─── IPC Handlers ────────────────────────────────────────────────────────────
function registerIpcHandlers() {
  const safeHandle = (channel, fn) => {
    try {
      ipcMain.removeHandler(channel)
      ipcMain.handle(channel, async (...args) => {
        try { return await fn(...args) } 
        catch (e) { console.error(`[IPC FAIL] ${channel}:`, e.message); throw e }
      })
    } catch (e) { console.error(`[IPC REG FAIL] ${channel}:`, e.message) }
  }

  safeHandle('search:get-log', async () => {
    console.log('[IPC] Fetching Search Log...');
    return getSearchLog();
  })
  safeHandle('search:add-log', async (event, query) => {
    console.log(`[IPC] Received Query to Save: "${query}"`);
    return addSearchLog(query);
  })
  safeHandle('search:delete-log', async (event, query) => {
    console.log(`[IPC] Requested Deletion of: "${query}"`);
    return deleteSearchLog(query);
  })
  safeHandle('search:clear-log', async () => {
    console.log('[IPC] Purging All Search Logs...');
    return clearSearchLog();
  })

  safeHandle('library:search-fts', async (event, query) => {
    return searchLibraryFTS(query);
  })

  safeHandle('library:export-dossier', async (event, { name, items }) => {
    try {
      const { canceled, filePath } = await dialog.showSaveDialog({
        title: `Export Research Dossier: ${name}`,
        defaultPath: `Research_Dossier_${String(name || 'Export').replace(/\s+/g, '_')}.md`,
        filters: [{ name: 'Markdown Documents', extensions: ['md'] }]
      });
      if (canceled || !filePath) return { success: false, message: 'CANCELLED' };
      let markdown = `# Research Dossier: ${name || 'General Archive'}\n\n`;
      markdown += `*Generated by StudyTube Research Studio on ${new Date().toLocaleDateString()}*\n`;
      markdown += `*Total Units: ${items?.length || 0}*\n\n---\n\n`;
      items.forEach((item, index) => {
        markdown += `## ${index + 1}. ${item.text.toUpperCase()}\n`;
        markdown += `**Source:** ${item.videoTitle || 'Universal Knowledge'}\n`;
        markdown += `**Captured:** ${new Date(item.date).toLocaleString()}\n\n`;
        if (item.summary) markdown += `### [Neural Synthesis]\n> ${item.summary.replace(/\n/g, '\n> ')}\n\n`;
        markdown += `### [Analysis Stream]\n${item.definition}\n\n`;
        if (item.synonyms) markdown += `**Synonyms:** ${item.synonyms}\n\n`;
        if (item.examples && item.examples.length > 0) {
          markdown += `**Linguistic Examples:**\n`;
          item.examples.forEach(ex => markdown += `- *${ex}*\n`);
          markdown += `\n`;
        }
        markdown += `---\n\n`;
      });
      fs.writeFileSync(filePath, markdown, 'utf8');
      return { success: true, filePath };
    } catch (err) {
      console.error('Dossier Export Failure:', err);
      throw err;
    }
  });

  safeHandle('youtube:search', async (_e, query) => {
    if (!query?.trim()) return []
    try {
      const r = await ytSearch(query)
      return r.videos.slice(0, 15).map(v => ({
        id: v.videoId, title: v.title, duration: v.timestamp,
        thumbnail: v.thumbnail, url: v.url,
        author: v.author?.name ?? '', views: v.views, ago: v.ago,
      }))
    } catch (e) { console.error('[search]', e.message); return [] }
  })

  ipcMain.handle('youtube:metadata', async (_e, url) => {
    const canonical = canonicalize(url)
    if (!ytdl.validateURL(canonical)) throw new Error('Invalid YouTube URL')
    try { return await fetchMetadata(canonical) } catch (e) {
      console.error('[metadata]', e.message)
      const videoId = ytdl.getURLVideoID(canonical)
      return { id: videoId, title: '', duration: 0, thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`, url: canonical, author: '', views: 0, qualityOptions: DEFAULT_QUALITY_OPTIONS, metaError: e.message }
    }
  })

  ipcMain.handle('download:start', async (event, payload) => {
    const { taskId, url, format, savePath, title } = payload
    const wc = event.sender
    const canonical = canonicalize(url)
    const safeTitle = sanitizeFileName(title || 'video')
    fs.mkdirSync(savePath, { recursive: true })
    try {
      const filePath = await downloadVideo({ webContents: wc, taskId, url: canonical, format, savePath, safeTitle })
      sendToRenderer(wc, 'download:done', { taskId, filePath })
      try { new Notification({ title: 'Download complete', body: path.basename(filePath) }).show() } catch {}
      return { taskId, filePath }
    } catch (e) {
      activeDownloads.delete(taskId)
      if (e.message === 'CANCELLED') { sendToRenderer(wc, 'download:cancelled', { taskId }); return { taskId, cancelled: true } }
      throw new Error(e.message)
    }
  })

  ipcMain.handle('download:cancel', (_e, taskId) => {
    const entry = activeDownloads.get(taskId)
    if (entry) { entry.abort(); activeDownloads.delete(taskId); return true }
    return false
  })

  ipcMain.handle('youtube:getStreamUrl', async (_e, url) => {
    const canonical = canonicalize(url)
    try {
      const info = await ytdl.getInfo(canonical)
      // Prioritize combined formats (progressive) for direct <video> tag playback
      const format = ytdl.chooseFormat(info.formats, { 
        quality: 'highest', 
        filter: f => f.hasVideo && f.hasAudio && f.container === 'mp4' 
      })
      return format?.url || null
    } catch (e) { 
      console.error('[getStreamUrl]', e.message)
      // Fallback: try any format that has video and audio
      try {
        const info = await ytdl.getInfo(canonical)
        const format = ytdl.chooseFormat(info.formats, { quality: 'highest', filter: 'audioandvideo' })
        return format?.url || null
      } catch (inner) {
        return null 
      }
    }
  })

  ipcMain.handle('youtube:getTranscript', async (_e, videoId) => {
    try { return await YoutubeTranscript.fetchTranscript(videoId) } catch (e) { console.error('[getTranscript]', e.message); return null }
  })

  // ─── AI Operations ─────────────────────────────────────────────────────────
  let aiAbortController = null
  ipcMain.handle('ai:stop', () => {
    if (aiAbortController) { aiAbortController.abort(); aiAbortController = null; return true }
    return false
  })


  safeHandle('ai:reconstruct-transcript', async (_e, text) => {
    const apiKey = readAppState().aiApiKey
    if (!apiKey) throw new Error('API Key found missing.')
    try {
      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ 
            role: 'system', 
            content: 'You are a script editor. Take the raw transcript and add proper punctuation and sensible paragraph breaks. IMPORTANT: Return the exact same text, just punctuated. Do not add summaries or intros.' 
          }, { role: 'user', content: text }],
          temperature: 0.3
        })
      })
      const data = await response.json()
      return data.choices?.[0]?.message?.content || text
    } catch (e) { throw new Error(`Reconstruction failed: ${e.message}`) }
  })

  safeHandle('ai:refine', async (_e, { blocks }) => {
    const apiKey = readAppState().aiApiKey
    if (!apiKey) throw new Error('API Key missing.')
    
    // Concatenate text for analysis while keeping track of indices
    const textToRefine = blocks.map((b, i) => `[ID:${i}] ${b.data.text || b.data.caption || ''}`).join('\n\n')

    try {
      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { 
              role: 'system', 
              content: 'Professional research editor. Correct grammar/flow. Keep [ID:n] tags. Return only: [ID:n] Corrected text.' 
            },
            { role: 'user', content: textToRefine }
          ],
          temperature: 0.3
        })
      })
      const data = await response.json()
      const content = data.choices?.[0]?.message?.content || ''
      
      const refinedBlocks = JSON.parse(JSON.stringify(blocks))
      const lines = content.split('\n')
      
      lines.forEach(line => {
        const match = line.match(/\[ID:(\d+)\]\s*(.*)/i)
        if (match) {
          const idx = parseInt(match[1])
          const text = match[2].trim()
          if (refinedBlocks[idx]) {
            if (refinedBlocks[idx].data.text !== undefined) refinedBlocks[idx].data.text = text
            else if (refinedBlocks[idx].data.caption !== undefined) refinedBlocks[idx].data.caption = text
          }
        }
      })
      return refinedBlocks
    } catch (e) { throw e }
  })

  ipcMain.handle('ai:processTranscript', async (_e, { text, prompt }) => {
    const apiKey = readAppState().aiApiKey
    if (!apiKey) throw new Error('API Key found missing.')
    try {
      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'system', content: 'English teacher. Analyze transcript.' }, { role: 'user', content: `${prompt}\n\nTranscript:\n${text}` }],
          temperature: 0.7
        })
      })
      const data = await response.json()
      return data.choices?.[0]?.message?.content || 'No response from AI.'
    } catch (e) { console.error('[processTranscript]', e.message); throw new Error(`AI Analysis failed: ${e.message}`) }
  })

  ipcMain.handle('ai:chat', async (_e, { messages, context }) => {
    const apiKey = readAppState().aiApiKey
    if (!apiKey) throw new Error('API Key missing.')
    if (aiAbortController) aiAbortController.abort()
    aiAbortController = new AbortController()

    try {
      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        signal: aiAbortController.signal,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'system', content: `Friendly English Tutor. Context: ${context}` }, ...messages],
          temperature: 0.7
        })
      })
      const data = await response.json()
      aiAbortController = null
      return data.choices?.[0]?.message?.content || 'No response.'
    } catch (e) {
      if (e.name === 'AbortError') return null
      console.error('[ai:chat]', e.message)
      throw new Error(`AI Tutor offline: ${e.message}`)
    }
  })

  // ─── Data Persistence (SQLite3 Powered) ──────────────────────────────────
  ipcMain.handle('vocab:load', () => {
    try { return getLibrary() } catch (e) { console.error('DB Load vocab fail', e); return [] }
  })

  ipcMain.handle('vocab:load-page', (_e, criteria) => {
    try { return getLibraryPage(criteria) } catch (e) { console.error('DB Load vocab page fail', e); return [] }
  })

  ipcMain.handle('vocab:get-stats', () => {
    try { return getCollectionStats() } catch (e) { console.error('DB Get stats fail', e); return {} }
  })

  ipcMain.handle('vocab:save', (_e, list) => { 
    try { saveLibrary(list); return true } catch (e) { console.error('DB Save vocab fail', e); return false }
  })

  ipcMain.handle('vocab:save-item', (_e, item) => {
    try { saveVocabItem(item); return true } catch (e) { console.error('DB Save item fail', e); return false }
  })

  ipcMain.handle('vocab:delete-item', (_e, id) => {
    try { deleteVocabItem(id); return true } catch (e) { console.error('DB Delete item fail', e); return false }
  })

  ipcMain.handle('collections:load', () => {
    try { return getCollections() } catch (e) { console.error('DB Load collections fail', e); return [] }
  })

  ipcMain.handle('collections:save', (_e, list) => { 
    try { saveCollections(list); return true } catch (e) { console.error('DB Save collections fail', e); return false }
  })

  ipcMain.handle('collections:migrate', (_e, oldName, newName) => {
    try { migrateCollection(oldName, newName); return true } catch (e) { console.error('DB Migrate collections fail', e); return false }
  })

  ipcMain.handle('collections:disband', (_e, name) => {
    try { disbandCollection(name); return true } catch (e) { console.error('DB Disband collections fail', e); return false }
  })

  safeHandle('notes:load', () => {
    try { return getNotes() } catch (e) { console.error('DB Load notes fail', e); return { blocks: [] } }
  })

  safeHandle('notes:save', (_e, data) => { 
    try { saveNotes(data); return true } catch (e) { console.error('DB Save notes fail', e); return false }
  })

  ipcMain.handle('ai:explain', async (_e, { text, videoTitle }) => {
    const apiKey = readAppState().aiApiKey
    if (!apiKey) return { text, definition: 'No API Key' }
    const ctrl = new AbortController()
    const timeout = setTimeout(() => ctrl.abort(), 20000)
    try {
      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        signal: ctrl.signal,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: `Dictionary. 1-8 Format. Plain Text.` },
            { role: 'user', content: text }
          ]
        })
      })
      clearTimeout(timeout)
      const data = await response.json()
      const content = data.choices?.[0]?.message?.content || ''
      const getSection = (n) => {
        const r = new RegExp(`(?:\\d\\.\\s*)?${n}:?\\s*([\\s\\S]*?)(?=\\s*\\d\\.|\\n\\d\\.|$|Classification|Definition)`, 'i')
        return (content.match(r)?.[1] || '').replace(/\*\*|__|\"|`|\[|\]/g, '').trim()
      }
      return {
        text: text.replace(/[**__"\[\]`]/g, '').trim(),
        videoTitle,
        type: getSection('Classification').split(/[.,]/)[0].substring(0, 15),
        pronunciation: getSection('Pronunciation'),
        definition: getSection('Definition'),
        grammar: getSection('Grammar'),
        usage: getSection('Usage'),
        synonyms: getSection('Synonyms'),
        antonyms: getSection('Antonyms_Acronyms'),
        examples: getSection('Examples').split('\n').map(s => s.replace(/•|\*|-|\[|\]|\"/g, '').trim()).filter(Boolean).slice(0,3),
        date: new Date().toISOString()
      }
    } catch (e) { clearTimeout(timeout); return { text, videoTitle, definition: 'AI analysis timed out. Retry.', date: new Date().toISOString() } }
  })

  ipcMain.handle('fs:pickSavePath', async () => {
    const r = await dialog.showOpenDialog({ title: 'Select Folder', properties: ['openDirectory', 'createDirectory'] })
    if (r.canceled || !r.filePaths.length) return null
    writeAppState({ savePath: r.filePaths[0] })
    return r.filePaths[0]
  })

  ipcMain.handle('settings:getSavePath', () => readAppState().savePath || app.getPath('downloads'))
  safeHandle('settings:getAiKey', () => readAppState().aiApiKey || '')
  safeHandle('settings:setAiKey', (_e, key) => { writeAppState({ aiApiKey: key }); return key })
  safeHandle('settings:getTheme', () => readAppState().theme || 'dark')
  safeHandle('settings:setTheme', (_e, theme) => { writeAppState({ theme }); return theme })
  safeHandle('shell:openPath', (_e, p) => shell.showItemInFolder(p))
  safeHandle('app:getVersion', () => app.getVersion())

  // ─── Auto-Updater ──────────────────────────────────────────────────────────
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true
  autoUpdater.logger = console

  // IMPORTANT: For Private Repos, we MUST send a token in the headers
  // You should use a RESTRICTED (read-only) token here.
  autoUpdater.requestHeaders = {
    'Authorization': 'token INSERT_READ_ONLY_TOKEN_HERE'
  }

  const sendUStatus = (status, info = null) => {
    if (mainWindow) sendToRenderer(mainWindow.webContents, 'update:status', { status, info })
  }

  autoUpdater.on('checking-for-update', () => sendUStatus('checking'))
  autoUpdater.on('update-available', (info) => sendUStatus('available', info))
  autoUpdater.on('update-not-available', (info) => sendUStatus('not-available', info))
  autoUpdater.on('error', (err) => sendUStatus('error', err.message))
  autoUpdater.on('download-progress', (p) => sendUStatus('downloading', p))
  autoUpdater.on('update-downloaded', (info) => sendUStatus('downloaded', info))

  ipcMain.handle('updater:check', () => {
    if (isDev) {
      sendUStatus('not-available', { version: app.getVersion() })
      return { success: false, message: 'Dev Mode' }
    }
    autoUpdater.checkForUpdates().catch(e => sendUStatus('error', e.message))
    return { success: true }
  })

  ipcMain.handle('updater:install', () => {
    autoUpdater.quitAndInstall()
    return true
  })
}

let mainWindow = null
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280, height: 820, minWidth: 900, minHeight: 600,
    backgroundColor: '#0f0f0f', autoHideMenuBar: true,
    icon: path.join(__dirname, 'assets/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      devTools: !app.isPackaged,
      webSecurity: false
    },
  })

  // Smart DevTool Protocol: Disable shortcuts in production
  if (app.isPackaged) {
    mainWindow.removeMenu() 
    mainWindow.webContents.on('devtools-opened', () => {
      mainWindow.webContents.closeDevTools()
    })
    mainWindow.webContents.on('before-input-event', (event, input) => {
      if ((input.control || input.meta) && input.shift && input.key.toLowerCase() === 'i') {
        event.preventDefault()
      }
      if (input.key === 'F12') {
        event.preventDefault()
      }
    })
  }

  if (isDev) mainWindow.loadURL('http://localhost:5173')
  else mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))

  mainWindow.on('closed', () => { mainWindow = null })
}

// ─── Global Context Menu & Offline Spellcheck ───────────────────────────────
app.on('web-contents-created', (event, contents) => {
  contents.on('context-menu', (event, params) => {
    const menu = new Menu()

    // Add spelling suggestions (Offline)
    if (params.misspelledWord) {
      for (const suggestion of params.dictionarySuggestions) {
        menu.append(new MenuItem({
          label: suggestion,
          click: () => contents.replaceMisspelling(suggestion)
        }))
      }
      menu.append(new MenuItem({ type: 'separator' }))
    }

    // Standard Research Operations
    if (params.editFlags.canCopy) menu.append(new MenuItem({ label: 'Copy Protocol', role: 'copy' }))
    if (params.editFlags.canPaste) menu.append(new MenuItem({ label: 'Paste Data', role: 'paste' }))
    if (params.editFlags.canCut) menu.append(new MenuItem({ label: 'Cut Block', role: 'cut' }))
    
    if (params.editFlags.canSelectAll) {
      menu.append(new MenuItem({ type: 'separator' }))
      menu.append(new MenuItem({ label: 'Select All Nodes', role: 'selectAll' }))
    }

    // Neural Polish (Shortcut to UI)
    if (params.isEditable) {
      menu.append(new MenuItem({ type: 'separator' }))
      menu.append(new MenuItem({ label: 'Neural Forge: Polish Draft', click: () => {
        sendToRenderer(contents, 'editor:refine-trigger')
      }}))
    }

    menu.popup()
  })
})

app.whenReady().then(() => {
  try {
    console.log('[SYSTEM] Initializing Neural Database (SQLite3 + FTS5)...')
    initDatabase()
    console.log('[SYSTEM] Initializing Neural Sentry Handlers...')
    registerIpcHandlers()
    console.log('[SYSTEM] Launching Research Studio...')
    createWindow()
    
    const toggleDevTools = () => {
      const win = BrowserWindow.getFocusedWindow()
      if (win) win.webContents.toggleDevTools()
    }
    globalShortcut.register('F12', toggleDevTools)
    globalShortcut.register('CommandOrControl+Shift+I', toggleDevTools)
  } catch (err) {
    console.error('[CRITICAL STARTUP FAILURE]', err)
  }
})

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
