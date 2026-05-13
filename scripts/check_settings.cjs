const Database = require('better-sqlite3');
const path = require('path');
const os = require('os');

const dbPath = path.join(os.homedir(), 'AppData', 'Roaming', 'StudyTube', 'studytube.db');
const db = new Database(dbPath);

try {
    const row = db.prepare('SELECT config FROM settings WHERE id = 1').get();
    if (row) {
        console.log("Current Settings JSON:");
        console.log(JSON.stringify(JSON.parse(row.config), null, 2));
    } else {
        console.log("No settings found in database.");
    }
} catch (e) {
    console.error("Error reading settings:", e.message);
}
db.close();
