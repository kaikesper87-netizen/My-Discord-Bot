// src/handlers/interactionHandler.js

// 1. Import all command files
import * as StartCommand from '../commands/start.js'; 
// import * as PvPCommand from '../commands/pvp.js'; // Will import this once created

// Map to easily find command execution logic
const commandMap = new Map([
    // Key: Command Name (e.g., 'start'), Value: The execute function from the module
    ['start', StartCommand.execute], 
]);


// --- 2. THE MAIN ROUTER FUNCTION ---

/**
 * Handles all incoming Discord interactions (Commands, Buttons, Select Menus).
 */
export async function handleInteraction(interaction, players, guilds, battles, client) {
    // ------------------------------------
    // A. HANDLE SLASH COMMANDS (Initial /command)
    // ------------------------------------
    if (interaction.isChatInputCommand()) {
        const commandName = interaction.commandName;
        const executeFunction = commandMap.get(commandName);

        if (!executeFunction) {
            console.error(`No command found for ${commandName}`);
            // Don't reply here, Discord will show "Application did not respond"
            return;
        }

        try {
            // Execute the command's main function, passing the interaction and client
            await executeFunction(interaction, client);
        } catch (error) {
            console.error(`❌ Error executing command ${commandName}:`, error);
            // Graceful error handling for the user
            const content = 'There was an error while executing this command!';
            if (interaction.deferred || interaction.replied) {
                 await interaction.editReply({ content, ephemeral: true });
            } else {
                 await interaction.reply({ content, ephemeral: true });
            }
        }
        return; 
    }

    // ------------------------------------
    // B. HANDLE COMPONENTS (Buttons, Select Menus)
    // ------------------------------------
    if (interaction.isButton() || interaction.isStringSelectMenu()) {
        const customId = interaction.customId;
        const [actionType] = customId.split('_'); // e.g., 'start_select' -> actionType='start'

        switch (actionType) {
            case 'start':
                // Send all start-related components (like 'start_select') to the start module's handler
                return StartCommand.handleComponent(interaction, client);
                
            case 'pvp':
            case 'fight':
                // These will be handled by the PvP module once we build it.
                // return PvPCommand.handleComponent(interaction, client, battles);
                return interaction.reply({ content: "PvP component logic not implemented yet!", ephemeral: true });

            // Add other component types here (e.g., case 'shop', case 'dungeon')
                
            default:
                // Ignore any buttons/menus not recognized by the bot
                break;
        }
    }
}
