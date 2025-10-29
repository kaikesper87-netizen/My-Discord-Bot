// src/handlers/interactionHandler.js

// 1. Import all command files (We now include profile.js)
import * as StartCommand from '../commands/start.js'; 
import * as PvPCommand from '../commands/pvp.js'; 
import * as ProfileCommand from '../commands/profile.js'; // <-- NEW IMPORT

// Map to easily find command execution logic
const commandMap = new Map([
    // Key: Command Name, Value: The execute function from the module
    ['start', StartCommand.execute], 
    ['pvp', PvPCommand.execute], 
    ['profile', ProfileCommand.execute], // <-- NEW REGISTRATION
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
            return;
        }

        try {
            // Execute the command's main function
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
        // The first part of the customId determines which module handles the action
        const [actionType] = customId.split('_'); 

        switch (actionType) {
            case 'start':
                // Handles 'start_select' menu
                return StartCommand.handleComponent(interaction, client);
                
            case 'pvp': // Handles 'pvp_accept' and 'pvp_decline' buttons
            case 'fight': // Handles 'fight_attack' and 'fight_defend' buttons
                // Send all battle-related components to the PvP module
                return PvPCommand.handleComponent(interaction, client, battles, players);

            // Note: Profile does not need a component handler.
                
            default:
                // Ignore any buttons/menus not recognized by the bot
                break;
        }
    }
}
