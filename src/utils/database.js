import fs from 'fs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'src', 'utils', 'database.json');

export let database = {};

export function loadDatabase() {
    if (fs.existsSync(dbPath)) {
        const raw = fs.readFileSync(dbPath, 'utf-8');
        database = JSON.parse(raw || '{}');
        console.log('✅ Loaded database from file.');
    } else {
        database = {};
        console.log('⚠ Database file not found, starting empty.');
    }
}

export function saveDatabase() {
    fs.writeFileSync(dbPath, JSON.stringify(database, null, 2));
}
