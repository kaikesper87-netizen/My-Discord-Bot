// src/index.js

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import express from 'express';
import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { fileURLToPath } from 'url';

// --- Setup paths ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Load environment variables ---
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const OWNER_ID = process.env.OWNER_ID;  // <-- Added
const PORT = process.env.PORT || 10000;

// --- Initialize Discord client ---
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// Attach ownerId to client for global access
client.ownerId = OWNER_ID;

// --- Persistent data ---
const playersFile = path.join(__dirname, 'data', 'players.json');
const guildsFile = path.join(__dirname, 'data', 'guilds.json');

export let players = {};
export let guilds = {};

// Load data safely
function loadData() {
    try {
        if (fs.existsSync(playersFile)) {
            players = JSON.parse(fs.readFileSync(playersFile, 'utf-8'));
        } else {
            players = {};
        }

        if (fs.existsSync(guildsFile)) {
            guilds = JSON.parse(fs.readFileSync(guildsFile, 'utf-8'));
        } else {
            guilds = {};
        }
    } catch (err) {
        console.error('❌ Failed to load data:', err);
        players = {};
        guilds = {};
    }
}

// Save data
function saveData() {
    try {
        fs.writeFileSync(playersFile, JSON.stringify(players, null, 2));
        fs.writeFileSync(guildsFile, JSON.stringify(guilds, null, 2));
    } catch (err) {
        console.error('❌ Failed to save data:', err);
    }
}

loadData();

// --- Command handling ---
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));

for (const file of commandFiles) {
    const { data, execute, handleComponent } = await import(path.join(commandsPath, file));
    client.commands.set(data.name, { data, execute, handleComponent });
    console.log(`✅ Loaded command: ${data.name}`);
}

// --- Interaction handler ---
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand() && !interaction.isButton() && !interaction.isStringSelectMenu()) return;

    try {
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;

            await command.execute(interaction, client, players, saveData);
            saveData();
        } else if (interaction.isButton() || interaction.isStringSelectMenu()) {
            for (const cmd of client.commands.values()) {
                if (cmd.handleComponent) {
                    await cmd.handleComponent(interaction, client, players, saveData);
                }
            }
            saveData();
        }
    } catch (error) {
        console.error('❌ Error handling interaction:', error);
        if (!interaction.replied) {
            await interaction.reply({ content: 'An error occurred.', ephemeral: true });
        }
    }
});

// --- Ready event ---
client.once('ready', () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
    console.log(`✅ Loaded ${Object.keys(players).length} players and ${Object.keys(guilds).length} guilds.`);
});

// --- Express server for uptime ---
const app = express();
app.get('/', (req, res) => res.send('Bot is running'));
app.listen(PORT, () => console.log(`✅ HTTP server running on port ${PORT}`));

// --- Login ---
client.login(TOKEN);
