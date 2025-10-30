// src/utils/database.js
import fs from 'fs';
import path from 'path';

const DATA_PATH = path.join(process.cwd(), 'src', 'database.json');

let players = {};
let guilds = {};
let battles = {}; // Added PvP battles

// Load existing data
if (fs.existsSync(DATA_PATH)) {
    try {
        const raw = fs.readFileSync(DATA_PATH);
        const data = JSON.parse(raw);
        players = data.players || {};
        guilds = data.guilds || {};
        battles = data.battles || {};
        console.log('✅ Loaded database from file.');
    } catch (err) {
        console.error('❌ Failed to load database.json:', err);
    }
}

// Save function
function saveDatabase() {
    fs.writeFileSync(DATA_PATH, JSON.stringify({ players, guilds, battles }, null, 2));
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

// Guild functions
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

// Battles functions
export function getBattle(battleId) {
    return battles[battleId];
}

export function setBattle(battleId, data) {
    battles[battleId] = data;
    saveDatabase();
}

export function deleteBattle(battleId) {
    delete battles[battleId];
    saveDatabase();
}

// Export full in-memory objects
export { players, guilds, battles };
