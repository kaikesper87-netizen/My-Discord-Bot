// src/handlers/interactionHandler.js
import fs from 'fs';
import path from 'path';
import { players, guilds, battles } from '../database.js';

// Import command modules dynamically
const commandsDir = path.join(process.cwd(), 'src', 'commands');
const commandFiles = fs.readdirSync(commandsDir).filter(f => f.endsWith('.js'));
const commands = new Map();

for (const file of commandFiles) {
    const { data, execute, handleComponent } = await import(`../commands/${file}`);
    commands.set(data.name, { execute, handleComponent });
}

// Main interaction handler
export async function handleInteraction(interaction) {
    try {
        // Slash commands
        if (interaction.isChatInputCommand()) {
            const command = commands.get(interaction.commandName);
            if (!command) return;
            await command.execute(interaction);
        }

        // Select menus & buttons
        else if (interaction.isStringSelectMenu() || interaction.isButton()) {
            const customId = interaction.customId;
            let handled = false;

            // Check all commands for a matching handleComponent
            for (const cmd of commands.values()) {
                if (cmd.handleComponent && customId.startsWith(cmd.data.name) || customId.includes('_')) {
                    await cmd.handleComponent(interaction);
                    handled = true;
                    break;
                }
            }

            if (!handled) {
                await interaction.reply({ content: '❌ Unknown interaction.', ephemeral: true });
            }
        }
    } catch (err) {
        console.error('❌ Interaction error:', err);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: '❌ Something went wrong.', ephemeral: true });
        } else {
            await interaction.reply({ content: '❌ Something went wrong.', ephemeral: true });
        }
    }
}
