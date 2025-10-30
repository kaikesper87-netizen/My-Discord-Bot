require('dotenv').config();
const { Client, Intents } = require('discord.js');
const { handleInteraction } = require('./handlers/interactionHandler');

const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

client.once('ready', () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on('interactionCreate', async (interaction) => {
    await handleInteraction(interaction, client);
});

client.login(process.env.TOKEN);
