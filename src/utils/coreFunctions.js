// Base XP needed to reach the next level
const BASE_XP = 100;
// Multiplier for subsequent levels
const XP_GROWTH_FACTOR = 1.5;

// Function to calculate XP needed for the next level
export function getRequiredXP(level) {
    if (level <= 0) return BASE_XP;
    return Math.floor(BASE_XP * Math.pow(XP_GROWTH_FACTOR, level - 1));
}

// Base stats for a Level 1 player
const BASE_STATS = {
    hp: 100,
    mana: 50,
    attack: 10,
    defense: 5,
    luck: 1
};

// Stat increases per level
const STAT_GROWTH = {
    hp: 15,
    mana: 5,
    attack: 2,
    defense: 1,
    luck: 0.2
};

// src/utils/coreFunctions.js

import fs from "fs";
import path from "path";
import { REST } from "@discordjs/rest";
import { Routes } from "discord.js";

// --- 1. DATA MANAGEMENT FUNCTIONS ---

export function loadData(players, guilds, activeQuests, PLAYERS_FILE, GUILDS_FILE, QUESTS_FILE) {
    try {
        if (fs.existsSync(PLAYERS_FILE)) {
            // Use Object.assign to update the properties of the imported 'players' object reference
            Object.assign(players, JSON.parse(fs.readFileSync(PLAYERS_FILE)));
        }
        if (fs.existsSync(GUILDS_FILE)) {
            Object.assign(guilds, JSON.parse(fs.readFileSync(GUILDS_FILE)));
        }
        if (fs.existsSync(QUESTS_FILE)) {
            Object.assign(activeQuests, JSON.parse(fs.readFileSync(QUESTS_FILE)));
        }
        
        // After loading, ensure all player stats are correctly initialized/recalculated
        for (const userId in players) {
            recalculateStats(players[userId]);
        }

        console.log(`✅ Loaded ${Object.keys(players).length} players and ${Object.keys(guilds).length} guilds.`);
    } catch (error) {
        console.error("❌ Error loading data:", error);
    }
}

export function saveData(players, guilds, activeQuests, PLAYERS_FILE, GUILDS_FILE, QUESTS_FILE) {
    try {
        fs.writeFileSync(PLAYERS_FILE, JSON.stringify(players, null, 2));
        fs.writeFileSync(GUILDS_FILE, JSON.stringify(guilds, null, 2));
        fs.writeFileSync(QUESTS_FILE, JSON.stringify(activeQuests, null, 2));
    } catch (error) {
        console.error("❌ Error saving data:", error);
    }
}

// --- 2. COMMAND REGISTRATION FUNCTION ---

export async function registerCommands(client, CLIENT_ID, TOKEN) {
    const commandDefinitions = [];
    
    // Dynamically read and load commands from the /src/commands directory
    const commandFiles = fs.readdirSync(path.join(process.cwd(), 'src', 'commands'))
                         .filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        // Dynamic import ensures we get the 'data' export from each command file
        const command = await import(`../commands/${file}`);
        // Only push commands that have a defined 'data' property
        if (command.data) { 
            commandDefinitions.push(command.data.toJSON());
        }
    }

    const rest = new REST({ version: "10" }).setToken(TOKEN);
    try {
        await rest.put(
            Routes.applicationCommands(CLIENT_ID),
            { body: commandDefinitions },
        );
        console.log(`✅ Successfully registered ${commandDefinitions.length} application (/) commands.`);
    } catch (error) {
        console.error("❌ Failed to register commands. Ensure your TOKEN and CLIENT_ID are correct:", error);
    }
}


// --- 3. HELPER DATA (Elemental Spells and Passives) ---

export const elementSpells = {
    Fire: ["Fireball", "Flame Wave", "Inferno", "Burn Strike"],
    Water: ["Water Blast", "Hydro Pump", "Tidal Wave", "Ice Shard"],
    Earth: ["Rock Smash", "Quake", "Stone Skin", "Fissure"],
    Divine: ["Divine Bolt", "Radiant Judgement", "Sanctify", "Aegis of Dawn"],
    
    Wind: ["Gale Slash", "Tornado", "Air Dash", "Feather Fall"],
    Lightning: ["Lightning Bolt", "Chain Zap", "Thunderclap", "Static Field"],
    Light: ["Holy Light", "Sunfire Ray", "Aura of Protection", "Blinding Flash"],
    Dark: ["Shadow Bind", "Dark Orb", "Void Step", "Life Drain"],
    Ice: ["Frost Nova", "Blizzard", "Ice Wall", "Chilling Touch"],
    Poison: ["Venom Spit", "Toxic Cloud", "Corrosive Spray", "Blight"],
    Arcane: ["Arcane Missile", "Teleport", "Mana Shield", "Disrupt Magic"],
    Nature: ["Root Bind", "Heal Growth", "Thorn Whip", "Poison Ivy"],
    Metal: ["Iron Defense", "Blade Fury", "Metallic Skin", "Magnetic Field"],
};

export const passives = {
    Fire: "Bonus Attack +10",
    Water: "Bonus Mana Regen +5",
    Earth: "Bonus HP +50",
    Divine: "All stats +10%", 
    
    Wind: "Bonus Evasion +5%",
    Lightning: "Critical Hit Chance +5%",
    Light: "Healing Effectiveness +10%",
    Dark: "Life Steal +3%",
    Ice: "Reduced Damage from Fire -10%",
    Poison: "Damage over Time (DoT) Bonus +5%",
    Arcane: "Magic Penetration +10",
    Nature: "Bonus Healing +5 HP/Turn",
    Metal: "Bonus Defense +5",
};

/**
 * Calculates and sets the player's max stats based on their current level,
 * and applies passive bonuses. Also ensures current HP/Mana don't exceed max.
 * @param {object} player - The player object to update.
 */
export function recalculateStats(player) {
    const level = player.Level;

    // 1. Base stats with level scaling
    player.maxStats.hp = BASE_STATS.hp + (STAT_GROWTH.hp * (level - 1));
    player.maxStats.mana = BASE_STATS.mana + (STAT_GROWTH.mana * (level - 1));
    player.maxStats.attack = BASE_STATS.attack + (STAT_GROWTH.attack * (level - 1));
    player.maxStats.defense = BASE_STATS.defense + (STAT_GROWTH.defense * (level - 1));
    player.maxStats.luck = BASE_STATS.luck + (STAT_GROWTH.luck * (level - 1));
    player.maxStats.luck = parseFloat(player.maxStats.luck.toFixed(2));

    // 2. Apply passive bonuses
    const passive = player.passive || [];

    if (passive.includes("Bonus Attack")) {
        player.maxStats.attack += 10;
    }
    if (passive.includes("Bonus Defense")) {
        player.maxStats.defense += 5;
    }
    // Add more passive effects here as needed (crit, evasion, etc.)

    // 3. Update current stats to not exceed max
    if (!player.currentStats) player.currentStats = {};
    
    if (!player.currentStats.hp || player.currentStats.hp > player.maxStats.hp) {
        player.currentStats.hp = player.maxStats.hp;
    }
    if (!player.currentStats.mana || player.currentStats.mana > player.maxStats.mana) {
        player.currentStats.mana = player.maxStats.mana;
    }
                         }
