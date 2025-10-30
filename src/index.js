// src/index.js
import 'dotenv/config';
import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { handleInteraction } from './handlers/interactionHandler.js';
import fs from 'fs';

// --- 1. Initialize Discord Client ---
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

// --- 2. Initialize game data stores ---
let players = {};   // Stores player data
let guilds = {};    // Stores guild data
let battles = {};   // Stores active PvP battles

// Load saved data if exists
try {
    if (fs.existsSync('./data/players.json')) {
        players = JSON.parse(fs.readFileSync('./data/players.json', 'utf-8'));
    }
    if (fs.existsSync('./data/guilds.json')) {
        guilds = JSON.parse(fs.readFileSync('./data/guilds.json', 'utf-8'));
    }
} catch (err) {
    console.error('Error loading saved data:', err);
}

// --- 3. Handle all interactions ---
client.on('interactionCreate', async (interaction) => {
    await handleInteraction(interaction, players, guilds, battles, client);
});

// --- 4. Login and Ready ---
client.once('ready', () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
    console.log(`✅ Loaded ${Object.keys(players).length} players and ${Object.keys(guilds).length} guilds.`);
});

// --- 5. Login with token ---
client.login(process.env.TOKEN).catch(console.error);

// --- 6. Graceful shutdown (optional but recommended) ---
process.on('SIGINT', () => {
    console.log('Saving data before shutdown...');
    fs.writeFileSync('./data/players.json', JSON.stringify(players, null, 2));
    fs.writeFileSync('./data/guilds.json', JSON.stringify(guilds, null, 2));
    process.exit();
});
