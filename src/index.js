// src/index.js
import 'dotenv/config'; // Automatically loads .env variables
import { Client, GatewayIntentBits, Collection } from 'discord.js';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { handleInteraction } from './handlers/interactionHandler.js';

// === EXPRESS SERVER (Optional, for status page) ===
const app = express();
const PORT = process.env.PORT || 10000;
app.get('/', (req, res) => res.send('MageBit is live!'));
app.listen(PORT, () => console.log(`✅ HTTP server running on port ${PORT}`));

// === DISCORD CLIENT SETUP ===
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ]
});

// === LOAD COMMANDS ===
client.commands = new Collection();
const commandsPath = path.join('./src/commands');
const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));

for (const file of commandFiles) {
  const { execute, data } = await import(`./commands/${file}`);
  if (data) client.commands.set(data.name, { execute, data });
  console.log(`✅ Loaded command: ${file.replace('.js', '')}`);
}

// === EVENT: READY ===
client.once('clientReady', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  // Initialize empty players and guilds
  client.players = {};
  client.guildsData = {};
});

// === EVENT: INTERACTION CREATE ===
client.on('interactionCreate', async (interaction) => {
  try {
    await handleInteraction(interaction, client.players, client.guildsData, client.battles, client);
  } catch (err) {
    console.error('❌ Error handling interaction:', err);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: 'An unexpected error occurred.', ephemeral: true });
    }
  }
});

// === LOGIN ===
client.login(process.env.TOKEN);
