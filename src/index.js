// src/index.js
import 'dotenv/config';
import { Client, GatewayIntentBits, Collection } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { handleInteraction } from './handlers/interactionHandler.js';

// Create client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Load slash commands dynamically
client.commands = new Collection();
const commandsPath = path.join('./src/commands');
const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));

for (const file of commandFiles) {
  const { data, execute } = await import(`./commands/${file}`);
  client.commands.set(data.name, { data, execute });
  console.log(`✅ Loaded command: ${data.name}`);
}

// Event: Bot ready
client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// Event: Interaction created
client.on('interactionCreate', async (interaction) => {
  await handleInteraction(interaction);
});

// Start bot
client.login(process.env.TOKEN)
  .then(() => console.log('✅ Bot login successful'))
  .catch(err => console.error('❌ Bot login failed:', err));

// Optional: Basic HTTP server for Render uptime
import express from 'express';
const app = express();
app.get('/', (req, res) => res.send('MageBit is running!'));
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`✅ HTTP server running on port ${PORT}`));
