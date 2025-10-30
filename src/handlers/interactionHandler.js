// src/handlers/interactionHandler.js

// 1. Import all command files
import * as StartCommand from '../commands/start.js'; 
import * as PvPCommand from '../commands/pvp.js'; 
import * as ProfileCommand from '../commands/profile.js'; 

// 2. Map to easily find command execution logic
const commandMap = new Map([
    ['start', StartCommand.execute], 
    ['pvp', PvPCommand.execute], 
    ['profile', ProfileCommand.execute],
]);

// --- 3. THE MAIN ROUTER FUNCTION ---
/**
 * Handles all incoming Discord interactions (Commands, Buttons, Select Menus).
 */
export async function handleInteraction(interaction, players, guilds, battles, client) {

    // ------------------------------------
    // A. HANDLE SLASH COMMANDS
    // ------------------------------------
    if (interaction.isChatInputCommand()) {
        const commandName = interaction.commandName;
        const executeFunction = commandMap.get(commandName);

        if (!executeFunction) {
            console.error(`No command found for ${commandName}`);
            return;
        }

        try {
            // Execute the command with all required data
            await executeFunction(interaction, client, players, guilds, battles);
        } catch (error) {
            console.error(`❌ Error executing command ${commandName}:`, error);

            const content = 'There was an error while executing this command!';
            try {
                if (interaction.deferred || interaction.replied) {
                    await interaction.editReply({ content, ephemeral: true });
                } else {
                    await interaction.reply({ content, ephemeral: true });
                }
            } catch (err) {
                console.error('Failed to send error reply:', err);
            }
        }
        return; 
    }

    // ------------------------------------
    // B. HANDLE COMPONENTS (Buttons, Select Menus)
    // ------------------------------------
    if (interaction.isButton() || interaction.isStringSelectMenu()) {
        const customId = interaction.customId;
        const [actionType] = customId.split('_'); 

        switch (actionType) {
            case 'start':
                return StartCommand.handleComponent
                    ? StartCommand.handleComponent(interaction, client)
                    : null;

            case 'pvp':
            case 'fight':
                return PvPCommand.handleComponent
                    ? PvPCommand.handleComponent(interaction, client, battles, players)
                    : null;

            default:
                console.warn(`Unrecognized component action: ${customId}`);
                return;
        }
    }
}
