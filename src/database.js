// src/utils/database.js
import fs from 'fs';
import path from 'path';

const DATA_PATH = path.join(process.cwd(), 'src', 'database.json');

let players = {};
let guilds = {};

// Load existing data if it exists
if (fs.existsSync(DATA_PATH)) {
    try {
        const raw = fs.readFileSync(DATA_PATH);
        const data = JSON.parse(raw);
        players = data.players || {};
        guilds = data.guilds || {};
        console.log('✅ Loaded database from file.');
    } catch (err) {
        console.error('❌ Failed to load database.json:', err);
    }
}

// Save function
function saveDatabase() {
    fs.writeFileSync(DATA_PATH, JSON.stringify({ players, guilds }, null, 2));
}

// Player functions
export function getPlayer(userId) {
    return players[userId];
}

export function setPlayer(userId, data) {
    players[userId] = data;
    saveDatabase();
}

export function deletePlayer(userId) {
    delete players[userId];
    saveDatabase();
}

// Guild functions (for future expansion)
export function getGuild(guildId) {
    return guilds[guildId];
}

export function setGuild(guildId, data) {
    guilds[guildId] = data;
    saveDatabase();
}

export function deleteGuild(guildId) {
    delete guilds[guildId];
    saveDatabase();
}

// Export full in-memory objects if needed
export { players, guilds };
