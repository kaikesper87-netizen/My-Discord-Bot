// index.js - The Brains of the Bot (Inside /src)

"use strict";
import "dotenv/config";
import fs from "fs";
import path from "path";
import http from "http"; 
import { fileURLToPath } from "url"; // <--- Important: Imported utility for path.

import { 
  Client, 
  GatewayIntentBits, 
  // Removed unused Routes
} from "discord.js";
// Removed unused REST import

// --- CONFIG ---
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
export const OWNER_ID = process.env.OWNER_ID; 

// --- DATA PATHS (CORRECTED) ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Go UP one level from /src, then into /data
const DATA_DIR = path.join(__dirname, "..", "data"); 
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const PLAYERS_FILE = path.join(DATA_DIR, "players.json");
const GUILDS_FILE = path.join(DATA_DIR, "guilds.json");
const QUESTS_FILE = path.join(DATA_DIR, "quests.json");

// --- GLOBAL STATE ---
export let players = {};
export let guilds = {};
export let activeQuests = {};
export let battles = {}; // PvP state tracker
export let dungeonRuns = {};

// --- CORE UTILITY FUNCTIONS (Importing from a sibling folder) ---
import { loadData, saveData, registerCommands } from './utils/coreFunctions.js'; 

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// --- DISCORD EVENTS ---

client.once("ready", async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  
  loadData(players, guilds, activeQuests, PLAYERS_FILE, GUILDS_FILE, QUESTS_FILE);
  await registerCommands(client, CLIENT_ID, TOKEN); 

  setInterval(() => saveData(players, guilds, activeQuests, PLAYERS_FILE, GUILDS_FILE, QUESTS_FILE), 60000); 

  // Uptime Robot server for Render
  http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot is running\n');
  }).listen(process.env.PORT || 10000, () => {
    console.log(`✅ HTTP server running on port ${process.env.PORT || 10000} for UptimeRobot`);
  });
});

// --- CORE INTERACTION HANDLER (Router) ---
import { handleInteraction } from './handlers/interactionHandler.js'; 

client.on("interactionCreate", async (interaction) => {
    // Pass global state objects AND the client
    await handleInteraction(interaction, players, guilds, battles, client); 
});

// --- LOGIN ---
client.login(TOKEN);
