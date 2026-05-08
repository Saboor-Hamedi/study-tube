import Database from 'better-sqlite3';
import path from 'path';
import os from 'os';

const dbPath = path.join(os.homedir(), 'AppData', 'Roaming', 'StudyTube', 'studytube.db');
console.log('Checking DB at:', dbPath);

try {
    const db = new Database(dbPath);
    const row = db.prepare('SELECT config FROM settings WHERE id = 1').get();
    if (row) {
        const config = JSON.parse(row.config);
        console.log('Current Settings:', config);
        console.log('Cloud API URL:', config.cloudApiUrl || 'NOT SET');
    } else {
        console.log('Settings table is empty or record id=1 missing.');
    }
} catch (err) {
    console.error('Error reading DB:', err.message);
}
