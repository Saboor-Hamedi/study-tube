const sqlite = require('better-sqlite3');
const path = require('path');
const os = require('os');

// Attempt to find the database
const dbPath = path.join(os.homedir(), 'AppData', 'Roaming', 'StudyTube', 'vocabulary.db');
console.log('Targeting Archive:', dbPath);

try {
    const db = new sqlite(dbPath);
    const allCount = db.prepare('SELECT COUNT(*) as count FROM library WHERE archived = 0').get().count;
    const trashCount = db.prepare('SELECT COUNT(*) as count FROM library WHERE archived = 1').get().count;
    const collections = db.prepare('SELECT name FROM collections').all();
    
    console.log('--- Industrial Archive Audit ---');
    console.log('Total Research Root:', allCount);
    console.log('Neural Trash:', trashCount);
    console.log('Collections Found:', collections.length);
    
    collections.forEach(c => {
        const cCount = db.prepare('SELECT COUNT(*) as count FROM library WHERE archived = 0 AND collection = ?').get(c.name).count;
        console.log(` > ${c.name}: ${cCount}`);
    });
    
} catch (err) {
    console.error('Audit Failure:', err.message);
}
