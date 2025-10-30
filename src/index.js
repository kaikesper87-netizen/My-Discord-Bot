// src/index.js
import 'dotenv/config';
import { Client, GatewayIntentBits } from 'discord.js';
import { handleInteraction } from './handlers/interactionHandler.js';

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

client.once('ready', () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
});

// Listen to interactions
client.on('interactionCreate', async (interaction) => {
    await handleInteraction(interaction);
});

// Start bot
client.login(process.env.TOKEN)
    .then(() => console.log('✅ Bot is running...'))
    .catch(console.error);
