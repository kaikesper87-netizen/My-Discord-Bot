import 'dotenv/config';
import express from 'express';
import { Client, GatewayIntentBits } from 'discord.js';
import { handleInteraction } from './handlers/interactionHandler.js';
import { players, guilds, battles } from './database.js';

// Initialize Discord client
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// HTTP server for uptime
const app = express();
app.get('/', (req, res) => res.send('MageBit Bot is running!'));
app.listen(10000, () => console.log('✅ HTTP server running on port 10000'));

// Event: Interaction create
client.on('interactionCreate', async (interaction) => {
    try {
        await handleInteraction(interaction, players, guilds, battles, client);
    } catch (error) {
        console.error('❌ Error handling interaction:', error);
    }
});

// Event: Client ready
client.once('ready', () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
    console.log(`✅ Loaded ${Object.keys(players).length} players and ${Object.keys(guilds).length} guilds.`);
});

// Login
client.login(process.env.TOKEN);
