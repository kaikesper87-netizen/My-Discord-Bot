// src/utils/database.js
import fs from 'fs';
import path from 'path';

const dbPath = path.join('./src/database.json');

// Ensure database file exists
if (!fs.existsSync(dbPath)) {
  fs.writeFileSync(dbPath, JSON.stringify({}), 'utf8');
}

export const readDatabase = () => {
  const raw = fs.readFileSync(dbPath, 'utf8');
  try {
    return JSON.parse(raw);
  } catch {
    console.error('❌ Failed to parse database.json, resetting file.');
    fs.writeFileSync(dbPath, JSON.stringify({}), 'utf8');
    return {};
  }
};

export const writeDatabase = (data) => {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
};

// Profile helpers
export const getUser = (userId) => {
  const db = readDatabase();
  return db[userId] || null;
};

export const createUser = (userId, profileData) => {
  const db = readDatabase();
  db[userId] = profileData;
  writeDatabase(db);
  return db[userId];
};

export const updateUser = (userId, newData) => {
  const db = readDatabase();
  if (!db[userId]) return null;
  db[userId] = { ...db[userId], ...newData };
  writeDatabase(db);
  return db[userId];
};

export const deleteUser = (userId) => {
  const db = readDatabase();
  if (db[userId]) {
    delete db[userId];
    writeDatabase(db);
  }
};
