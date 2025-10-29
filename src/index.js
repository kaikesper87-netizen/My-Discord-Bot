// index.js - The Brains of the Bot

"use strict";
import "dotenv/config";
import fs from "fs";
import path from "path";
import http from "http"; // Keep this if you need Uptime Robot/Render port binding

import { 
  Client, 
  GatewayIntentBits, 
  Routes, 
} from "discord.js";
import { REST } from "@discordjs/rest";

// --- CONFIG ---
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
export const OWNER_ID = process.env.OWNER_ID; // Exported for use in modules

// --- DATA PATHS ---
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const PLAYERS_FILE = path.join(DATA_DIR, "players.json");
const GUILDS_FILE = path.join(DATA_DIR, "guilds.json");
const QUESTS_FILE = path.join(DATA_DIR, "quests.json");

// --- GLOBAL STATE (Exported so modules can access them) ---
export let players = {};
export let guilds = {};
export let activeQuests = {};
export let battles = {}; // PvP state tracker
export let dungeonRuns = {};

// --- CORE UTILITY FUNCTIONS (Needed by the main file and all modules) ---
import { fileURLToPath } from "url"; // Need to import this utility for __dirname
import { loadData, saveData, registerCommands } from './utils/coreFunctions.js'; // We will create this file

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// --- DISCORD EVENTS ---

client.once("ready", async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  
  // 1. Load Data
  loadData(players, guilds, activeQuests, PLAYERS_FILE, GUILDS_FILE, QUESTS_FILE);

  // 2. Register Commands
  await registerCommands(client, CLIENT_ID, TOKEN); 

  // 3. Set up Auto-Save
  setInterval(() => saveData(players, guilds, activeQuests, PLAYERS_FILE, GUILDS_FILE, QUESTS_FILE), 60000); 

  // 4. (Optional) Uptime Robot server for Render
  http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot is running\n');
  }).listen(process.env.PORT || 10000, () => {
    console.log(`✅ HTTP server running on port ${process.env.PORT || 10000} for UptimeRobot`);
  });
});

// --- CORE INTERACTION HANDLER (Router) ---
import { handleInteraction } from './handlers/interactionHandler.js'; // We will create this file

client.on("interactionCreate", async (interaction) => {
    // Pass everything to the router for processing
    await handleInteraction(interaction, client);
});

// --- LOGIN ---
client.login(TOKEN);
