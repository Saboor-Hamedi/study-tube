import { app, BrowserWindow, Notification, dialog, ipcMain, shell, Menu, globalShortcut } from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
import ytdl from '@distube/ytdl-core'
import ytSearch from 'yt-search'
import ffmpegPath from 'ffmpeg-static'
import { YoutubeTranscript } from 'youtube-transcript/dist/youtube-transcript.esm.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const isDev = !app.isPackaged

// Remove the native menu bar immediately
Menu.setApplicationMenu(null)

// taskId -> { abort() } — for cancel support
const activeDownloads = new Map()

const DEFAULT_QUALITY_OPTIONS = [
  { label: '1080p', value: 'video:1080' },
  { label: '720p', value: 'video:720' },
  { label: '480p', value: 'video:480' },
  { label: '360p', value: 'video:360' },
  { label: 'MP3 (192kbps)', value: 'audio:mp3' },
]

// ─── State ──────────────────────────────────────────────────────────────────
function getStateFilePath() {
  return path.join(app.getPath('userData'), 'app-state.json')
}
function readAppState() {
  try { return JSON.parse(fs.readFileSync(getStateFilePath(), 'utf-8')) } catch { return {} }
}
function writeAppState(patch) {
  const next = { ...readAppState(), ...patch }
  fs.mkdirSync(path.dirname(getStateFilePath()), { recursive: true })
  fs.writeFileSync(getStateFilePath(), JSON.stringify(next, null, 2))
  return next
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function sanitizeFileName(name) {
  return name.replace(/[<>:"/\\|?*\u0000-\u001F]/g, '').trim().slice(0, 200) || 'video'
}
function canonicalize(url) {
  const s = String(url || '').trim()
  try {
    if (ytdl.validateURL(s)) return `https://www.youtube.com/watch?v=${ytdl.getURLVideoID(s)}`
  } catch {}
  return s
}
function sendToRenderer(wc, channel, data) {
  if (!wc.isDestroyed()) wc.send(channel, data)
}
function buildQualityOptions(heights) {
  const opts = [...new Set(heights)].filter(Boolean).sort((a, b) => b - a).slice(0, 6)
    .map(h => ({ label: `${h}p`, value: `video:${h}` }))
  opts.push({ label: 'MP3 (192kbps)', value: 'audio:mp3' })
  return opts
}

// ─── Metadata (ytdl-core) ────────────────────────────────────────────────────
async function fetchMetadata(url) {
  const info = await ytdl.getInfo(url)
  const details = info.videoDetails

  const heights = info.formats
    .map(f => Number(f.height))
    .filter(h => Number.isFinite(h) && h > 0)

  const thumbnail =
    [...(details.thumbnails ?? [])].sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0]?.url || ''

  return {
    id: details.videoId,
    title: details.title || 'YouTube Video',
    duration: Number(details.lengthSeconds) || 0,
    thumbnail,
    url,
    author: details.author?.name || '',
    views: Number(details.viewCount) || 0,
    qualityOptions: heights.length ? buildQualityOptions(heights) : DEFAULT_QUALITY_OPTIONS,
  }
}

// ─── Download (ytdl-core + ffmpeg) ───────────────────────────────────────────
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

  const checkAbort = () => {
    if (aborted) throw new Error('CANCELLED')
  }

  const agent = ytdl.createAgent()
  const info = await ytdl.getInfo(url)
  checkAbort()

  // ── Audio-only (MP3) ────────────────────────────────────────────────────
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
      proc.on('error', err => {
        try { fs.unlinkSync(audioTmp) } catch {}
        reject(err)
      })
    })

    return outPath
  }

  // ── Video + Audio ────────────────────────────────────────────────────────
  let videoFormats = info.formats.filter(f => f.hasVideo && !f.hasAudio)
  if (Number.isFinite(targetH)) {
    const below = videoFormats.filter(f => (f.height ?? 0) <= targetH)
    if (below.length) videoFormats = below
  }
  videoFormats.sort((a, b) => (b.height ?? 0) - (a.height ?? 0))
  const videoFmt = videoFormats[0]
  if (!videoFmt) throw new Error('No video format found for this quality.')

  const audioFmt = ytdl.chooseFormat(info.formats, { quality: 'highestaudio', filter: 'audioonly' })

  const videoTmp = path.join(savePath, `${safeTitle}_v_${taskId.slice(0, 8)}.tmp`)
  const audioTmp = path.join(savePath, `${safeTitle}_a_${taskId.slice(0, 8)}.tmp`)
  const totalSize = (Number(videoFmt.contentLength) || 0) + (Number(audioFmt?.contentLength) || 0)
  let downloaded = 0

  const cleanup = () => {
    try { fs.unlinkSync(videoTmp) } catch {}
    try { fs.unlinkSync(audioTmp) } catch {}
  }

  // Download video stream
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

  // Download audio stream
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

  // Merge with ffmpeg
  await new Promise((resolve, reject) => {
    const proc = spawn(ffmpegPath, [
      '-i', videoTmp,
      '-i', audioTmp,
      '-c:v', 'copy',
      '-c:a', 'aac',
      '-y',
      outPath,
    ])
    activeProc = proc
    proc.stderr?.on('data', d => {
      const line = d.toString()
      const m = line.match(/time=(\d+:\d+:\d+)/)
      if (m) sendToRenderer(webContents, 'download:progress', { taskId, percent: 95, status: 'Merging…' })
    })
    proc.on('close', code => {
      cleanup()
      activeDownloads.delete(taskId)
      code === 0 ? resolve() : reject(new Error(`ffmpeg merge failed (code ${code})`))
    })
    proc.on('error', err => { cleanup(); reject(err) })
  })

  return outPath
}

// ─── IPC Handlers ────────────────────────────────────────────────────────────
function registerIpcHandlers() {
  ipcMain.handle('youtube:search', async (_e, query) => {
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
    try {
      return await fetchMetadata(canonical)
    } catch (e) {
      console.error('[metadata]', e.message)
      try {
        const videoId = ytdl.getURLVideoID(canonical)
        return {
          id: videoId, title: 'YouTube Video', duration: 0,
          thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
          url: canonical, author: '', views: 0,
          qualityOptions: DEFAULT_QUALITY_OPTIONS,
          metaError: e.message,
        }
      } catch { throw new Error('Could not load video. Check the URL.') }
    }
  })

  ipcMain.handle('download:start', async (event, payload) => {
    const { taskId, url, format, savePath, title } = payload
    if (!taskId || !url || !format || !savePath) throw new Error('Missing parameters.')
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
      if (e.message === 'CANCELLED') {
        sendToRenderer(wc, 'download:cancelled', { taskId })
        return { taskId, cancelled: true }
      }
      console.error('[download:start]', e.message)
      throw new Error(e.message)
    }
  })

  ipcMain.handle('download:cancel', (_e, taskId) => {
    const entry = activeDownloads.get(taskId)
    if (entry) {
      entry.abort()
      activeDownloads.delete(taskId)
      return true
    }
    return false
  })

  ipcMain.handle('youtube:getStreamUrl', async (_e, url) => {
    const canonical = canonicalize(url)
    try {
      const info = await ytdl.getInfo(canonical)
      const fmts = info.formats.filter(f => f.hasVideo && f.hasAudio && f.container === 'mp4')
        .sort((a, b) => (b.height ?? 0) - (a.height ?? 0))
      const best = fmts.find(f => (f.height ?? 0) <= 720) || fmts[0]
      return best?.url || null
    } catch (e) {
      console.error('[getStreamUrl]', e.message)
      return null
    }
  })

  ipcMain.handle('youtube:getTranscript', async (_e, videoId) => {
    try {
      const transcript = await YoutubeTranscript.fetchTranscript(videoId)
      return transcript // Returns [{text, start, duration}]
    } catch (e) {
      console.error('[getTranscript]', e.message)
      return null
    }
  })

  ipcMain.handle('settings:getAiKey', () => readAppState().aiApiKey || '')
  ipcMain.handle('settings:setAiKey', (_e, key) => writeAppState({ aiApiKey: key }))

  ipcMain.handle('ai:processTranscript', async (_e, { text, prompt }) => {
    const state = readAppState()
    const apiKey = state.aiApiKey
    if (!apiKey) throw new Error('No AI API Key found in settings.')
    
    console.log('[DeepSeek] Processing transcript summary...')
    try {
      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: 'You are an English teacher. Analyze the transcript for a language learner.' },
            { role: 'user', content: `${prompt}\n\nTranscript:\n${text}` }
          ],
          temperature: 0.7
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`[DeepSeek] API Error: ${response.status} - ${errorText}`)
        throw new Error(`AI Provider reported an error: ${response.status}`)
      }

      const data = await response.json()
      return data.choices?.[0]?.message?.content || 'No response from AI.'
    } catch (e) {
      console.error('[deepseek]', e.message)
      throw new Error(`AI Analysis failed: ${e.message}`)
    }
  })

  let aiAbortController = null

  ipcMain.handle('ai:stop', () => {
    if (aiAbortController) {
      aiAbortController.abort()
      aiAbortController = null
      return true
    }
    return false
  })

  ipcMain.handle('ai:chat', async (_e, { messages, context }) => {
    const state = readAppState()
    const apiKey = state.aiApiKey
    if (!apiKey) throw new Error('No AI API Key found in settings. Click the Gear icon to add it.')
    
    if (aiAbortController) aiAbortController.abort()
    aiAbortController = new AbortController()

    console.log(`[DeepSeek] Chat request with ${messages.length} messages...`)
    try {
      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        signal: aiAbortController.signal,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: `You are a friendly English Tutor. Help the user learn English through this video. Transcript Context: ${context}. Use Markdown (bold, lists, etc.) to make your explanations clear and educational.` },
            ...messages
          ],
          temperature: 0.7
        })
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error(`[DeepSeek] API Error: ${response.status} - ${errorText}`)
        throw new Error(`AI Provider reported an error: ${response.status}`)
      }

      const data = await response.json()
      aiAbortController = null
      return data.choices?.[0]?.message?.content || 'No response from AI.'
    } catch (e) {
      if (e.name === 'AbortError') {
        console.log('[DeepSeek] AI Request aborted by user.')
        return null // Return null to signify intentional cancel
      }
      console.error('[deepseek-chat]', e.message)
      throw new Error(`AI Tutor is offline: ${e.message}`)
    }
  })

  // ─── Vocabulary Persistence & AI Explanation ────────────────────────────────
  const dataDir = path.join(app.getAppPath(), 'data')
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
  const vocabPath = path.join(dataDir, 'library.json')

  ipcMain.handle('vocab:load', () => {
    try {
      if (fs.existsSync(vocabPath)) return JSON.parse(fs.readFileSync(vocabPath, 'utf8'))
    } catch (e) { console.error('Failed to load vocab', e) }
    return []
  })

  ipcMain.handle('vocab:save', (_e, list) => {
    try {
      fs.writeFileSync(vocabPath, JSON.stringify(list, null, 2))
      return true
    } catch (e) { console.error('Failed to save vocab', e); return false }
  })

  ipcMain.handle('ai:explain', async (_e, { text, videoTitle }) => {
    const state = readAppState()
    const apiKey = state.aiApiKey
    if (!apiKey) return { text, definition: 'No API Key', example: '' }

    console.log(`[DeepSeek] Explaining: "${text}"`)
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)

    try {
      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { 
              role: 'system', 
              content: `You are an expert English Professor. For the provided phrase, return a deep analysis. 
              STRICT RULE: DO NOT use markdown like **bold**, __italic__, or codes. Use PLAIN TEXT ONLY.
              1. Classification: [Noun/Verb/Adj/Adv/Phrase/etc.]
              2. Pronunciation: [Simple phonetic guide, e.g., /su-perb/]
              3. Definition: [Deep explanation]
              4. Grammar: [Tense and structural notes]
              5. Usage: [Formal/Informal/Colloquial context]
              6. Synonyms: [List 5 synonyms separated by commas]
              7. Examples: [3 natural sentences, each on a new line started with •]` 
            },
            { role: 'user', content: text }
          ]
        })
      })
      clearTimeout(timeout)
      
      const data = await response.json()
      let content = data.choices?.[0]?.message?.content || ''
      
      const getSection = (name) => {
        const regex = new RegExp(`${name}:?\\s*([\\s\\S]*?)(?=\\d\\.|\\n\\d\\.|$)`, 'i')
        let val = content.match(regex)?.[1]?.trim() || ''
        return val.replace(/\*\*|__|\"|\[|\]|`/g, '').trim()
      }

      return {
        text: text.replace(/\*\*|__|\"|\[|\]|`/g, '').trim(),
        videoTitle,
        type: getSection('Classification'),
        pronunciation: getSection('Pronunciation'),
        definition: getSection('Definition'),
        grammar: getSection('Grammar'),
        usage: getSection('Usage'),
        synonyms: getSection('Synonyms'),
        examples: getSection('Examples').split('\n').map(s => s.replace(/•|\*|-/g, '').replace(/\"|\[|\]/g, '').trim()).filter(Boolean),
        date: new Date().toISOString()
      }
    } catch (e) {
      clearTimeout(timeout)
      console.error('AI Explain error:', e.name === 'AbortError' ? 'Timed out' : e.message)
      return { 
        text, 
        videoTitle, 
        definition: e.name === 'AbortError' ? 'AI timed out. Please try again.' : 'AI explanation unavailable.', 
        example: '',
        date: new Date().toISOString()
      }
    }
  })

  ipcMain.handle('fs:pickSavePath', async () => {
    const r = await dialog.showOpenDialog({ title: 'Select Folder', properties: ['openDirectory', 'createDirectory'] })
    if (r.canceled || !r.filePaths.length) return null
    writeAppState({ savePath: r.filePaths[0] })
    return r.filePaths[0]
  })

  ipcMain.handle('settings:getSavePath', () => readAppState().savePath || app.getPath('downloads'))
  ipcMain.handle('settings:setSavePath', (_e, p) => { writeAppState({ savePath: p }); return p })
  ipcMain.handle('shell:openPath', (_e, p) => shell.showItemInFolder(p))
}

// ─── Window ────────────────────────────────────────────────────────────────
let mainWindow = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280, height: 820, minWidth: 900, minHeight: 600,
    backgroundColor: '#0f0f0f',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false,
    },
  })
  mainWindow.setMenu(null)
  if (isDev) mainWindow.loadURL('http://localhost:5173')
  else mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  mainWindow.on('closed', () => { mainWindow = null })
}

// ─── Boot ─────────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  Menu.setApplicationMenu(null)
  registerIpcHandlers()
  createWindow()

  // F12 / Ctrl+Shift+I toggles DevTools (closed by default)
  const toggleDevTools = () => {
    const win = BrowserWindow.getFocusedWindow()
    if (win) win.webContents.toggleDevTools()
  }
  globalShortcut.register('F12', toggleDevTools)
  globalShortcut.register('CommandOrControl+Shift+I', toggleDevTools)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
