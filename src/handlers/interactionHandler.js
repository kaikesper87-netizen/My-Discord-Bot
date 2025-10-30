// src/handlers/interactionHandler.js
import { Client, Collection } from 'discord.js';
import fs from 'fs';
import path from 'path';

// Load commands
const commands = new Collection();
const commandsPath = path.join('./src/commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const { data, execute } = await import(`../commands/${file}`);
    commands.set(data.name, { data, execute });
}

export const handleInteraction = async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error('❌ Error handling interaction:', error);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: 'Something went wrong.', ephemeral: true });
        }
    }
};
