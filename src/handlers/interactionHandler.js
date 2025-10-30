// src/handlers/interactionHandler.js

import * as StartCommand from '../commands/start.js'; 
import * as PvPCommand from '../commands/pvp.js'; 
import * as ProfileCommand from '../commands/profile.js'; 

// Map command names to their execute functions
const commandMap = new Map([
    ['start', StartCommand.execute], 
    ['pvp', PvPCommand.execute], 
    ['profile', ProfileCommand.execute],
]);

/**
 * Handles all Discord interactions (slash commands, buttons, select menus)
 */
export async function handleInteraction(interaction, players, guilds, battles, client) {

    // -----------------------------
    // 1. Slash Commands
    // -----------------------------
    if (interaction.isChatInputCommand()) {
        const commandName = interaction.commandName;
        const executeFunction = commandMap.get(commandName);

        if (!executeFunction) {
            console.error(`No command found for ${commandName}`);
            return;
        }

        try {
            // Execute command with updated signature
            await executeFunction(interaction, client, players, guilds, battles);
        } catch (error) {
            console.error(`❌ Error executing command ${commandName}:`, error);

            const content = 'There was an error while executing this command!';
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({ content, ephemeral: true }).catch(() => {});
            } else {
                await interaction.reply({ content, ephemeral: true }).catch(() => {});
            }
        }
        return;
    }

    // -----------------------------
    // 2. Buttons / Select Menus
    // -----------------------------
    if (interaction.isButton() || interaction.isStringSelectMenu()) {
        const customId = interaction.customId;
        const [actionType] = customId.split('_');

        try {
            switch (actionType) {
                case 'start':
                    return StartCommand.handleComponent(interaction, client);

                case 'pvp':
                case 'fight':
                    return PvPCommand.handleComponent(interaction, client, battles, players);

                default:
                    console.warn(`Unrecognized component action: ${customId}`);
                    return;
            }
        } catch (error) {
            console.error(`❌ Error handling component ${customId}:`, error);

            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: 'Error processing interaction.', ephemeral: true }).catch(() => {});
            }
        }
    }
}
