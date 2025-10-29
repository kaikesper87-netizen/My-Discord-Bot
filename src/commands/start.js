// src/commands/start.js

import { 
    SlashCommandBuilder, 
    StringSelectMenuBuilder, 
    StringSelectMenuOptionBuilder, 
    ActionRowBuilder 
} from "discord.js";
// Import global state and essential utilities
import { OWNER_ID, players } from "../index.js"; 
import { ELEMENTS } from "../utils/constants.js"; 
import { recalculateStats, elementSpells, passives } from "../utils/coreFunctions.js"; 

// --- 1. COMMAND DEFINITION ---
export const data = new SlashCommandBuilder()
    .setName("start")
    .setDescription("Start your RPG adventure!");

// --- 2. SLASH COMMAND EXECUTION (/start) ---
export async function execute(interaction, client) {
    const userId = interaction.user.id;
    
    if (players[userId]) {
        return interaction.reply({ content: "You have already started your adventure!", ephemeral: true });
    }
    
    // CRITICAL: Defer to prevent the 10062 'Unknown interaction' error!
    await interaction.deferReply({ ephemeral: true }); 

    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId("start_select")
        .setPlaceholder("Choose your starting element...")
        .addOptions(
            ...ELEMENTS.map(element => {
              // Owner-only check for Divine element
              if (element === "Divine" && userId !== OWNER_ID) return null; 
              return new StringSelectMenuOptionBuilder()
                .setLabel(element)
                .setValue(element);
            }).filter(Boolean)
        );
    
    const row = new ActionRowBuilder().addComponents(selectMenu);
    
    return interaction.editReply({ 
        content: "Welcome! Choose your starting element:", 
        components: [row] 
    });
}

// --- 3. COMPONENT HANDLER (start_select) ---
export async function handleComponent(interaction, client) {
    if (!interaction.isStringSelectMenu()) return; 

    const userId = interaction.user.id;
    const selectedElement = interaction.values[0]; 
    
    if (players[userId]) {
         return interaction.update({ content: "You've already started!", components: [] });
    }
    
    // 1. Create the new player object with starting values
    const newPlayer = {
        Level: 1,
        element: selectedElement,
        experience: 0,
        money: 100, 
        items: [],
        spells: elementSpells[selectedElement] || [],
        passive: passives[selectedElement] || "None",
        maxStats: {}, // Populated by recalculateStats
        currentStats: { hp: 0, mana: 0 }, // Populated by recalculateStats
        cooldowns: {},
    };
    
    // 2. Calculate and set initial stats
    recalculateStats(newPlayer);
    newPlayer.currentStats.hp = newPlayer.maxStats.hp;
    newPlayer.currentStats.mana = newPlayer.maxStats.mana;
    
    // 3. Save the player to global state
    players[userId] = newPlayer;

    // 4. Update the message to confirm creation
    await interaction.update({ 
        content: `🎉 Adventure started! You are now a **Level 1 ${selectedElement}** elementalist.`, 
        components: [] 
    });
        }
