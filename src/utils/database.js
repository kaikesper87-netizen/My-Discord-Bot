// src/utils/database.js
import fs from 'fs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'src', 'database.json');

let database = {
  players: {},
  guilds: {}
};

// Load database from file
export const loadDatabase = () => {
  if (fs.existsSync(dbPath)) {
    try {
      const rawData = fs.readFileSync(dbPath, 'utf-8');
      database = JSON.parse(rawData);
      console.log(`✅ Loaded database from file.`);
    } catch (err) {
      console.error(`❌ Failed to parse database.json:`, err);
    }
  } else {
    saveDatabase(); // create new file if not exists
  }
};

// Save current database to file
export const saveDatabase = () => {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(database, null, 2));
    // console.log(`💾 Database saved.`);
  } catch (err) {
    console.error(`❌ Failed to save database:`, err);
  }
};

// Player functions
export const getPlayer = (userId) => {
  return database.players[userId] || null;
};

export const createPlayer = (userId, playerData) => {
  database.players[userId] = playerData;
  saveDatabase();
  return database.players[userId];
};

export const updatePlayer = (userId, newData) => {
  if (!database.players[userId]) return null;
  database.players[userId] = { ...database.players[userId], ...newData };
  saveDatabase();
  return database.players[userId];
};

// Guild functions
export const getGuild = (guildId) => {
  return database.guilds[guildId] || null;
};

export const createGuild = (guildId, guildData) => {
  database.guilds[guildId] = guildData;
  saveDatabase();
  return database.guilds[guildId];
};

export const updateGuild = (guildId, newData) => {
  if (!database.guilds[guildId]) return null;
  database.guilds[guildId] = { ...database.guilds[guildId], ...newData };
  saveDatabase();
  return database.guilds[guildId];
};

// Expose the raw database if needed
export const getDatabase = () => database;
