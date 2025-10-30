// src/handlers/interactionHandler.js
import fs from 'fs';
import path from 'path';
import { Collection } from 'discord.js';

const commandsPath = path.join(process.cwd(), 'src', 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));

// Load commands dynamically
export const commands = new Collection();

for (const file of commandFiles) {
    const { data, execute, handleComponent } = await import(`../commands/${file}`);
    commands.set(data.name, { data, execute, handleComponent });
}

// Main interaction handler
export async function handleInteraction(interaction, players, guilds, battles, client) {
    try {
        if (interaction.isChatInputCommand()) {
            const cmd = commands.get(interaction.commandName);
            if (!cmd) return;

            await cmd.execute(interaction, client);
        } else if (interaction.isStringSelectMenu() || interaction.isButton()) {
            const cmdName = interaction.customId.split('_')[0]; // e.g., 'start' or 'pvp'
            const cmd = commands.get(cmdName);
            if (!cmd || !cmd.handleComponent) return;

            await cmd.handleComponent(interaction, client, battles, players);
        }
    } catch (error) {
        console.error('❌ Interaction error:', error);

        // Safely reply if interaction hasn't been acknowledged yet
        if (!interaction.replied && !interaction.deferred) {
            try {
                await interaction.reply({ content: '❌ Something went wrong.', ephemeral: true });
            } catch {}
        }
    }
}
