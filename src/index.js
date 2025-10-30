// src/index.js
import 'dotenv/config';
import { Client, GatewayIntentBits } from 'discord.js';
import { handleInteraction } from './handlers/interactionHandler.js';
import http from 'http';

// Create bot client
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

// Interaction listener
client.on('interactionCreate', async (interaction) => {
  await handleInteraction(interaction);
});

// Log when bot is ready
client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// Minimal HTTP server to keep Render awake
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('MageBit is alive!\n');
}).listen(process.env.PORT || 10000, () => {
  console.log(`✅ HTTP server running on port ${process.env.PORT || 10000}`);
});

// Login
client.login(process.env.TOKEN);
