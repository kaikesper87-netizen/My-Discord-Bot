"use strict";
import "dotenv/config";
import fs from "fs";
import path from "path";
import http from "http";
import { fileURLToPath } from "url";
import {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  Routes,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  EmbedBuilder,
} from "discord.js";
import { REST } from "@discordjs/rest";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- CONFIG ---
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const OWNER_ID = process.env.OWNER_ID; // Required for /bestow and Divine Element

if (!TOKEN) {
  console.error("❌ TOKEN not set in environment");
  process.exit(1);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// --- DATA PATHS ---
const DATA_DIR = path.join(__dirname, "..", "data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const PLAYERS_FILE = path.join(DATA_DIR, "players.json");
const GUILDS_FILE = path.join(DATA_DIR, "guilds.json");
const QUESTS_FILE = path.join(DATA_DIR, "quests.json");

// --- GLOBAL STATE ---
let players = {};
let guilds = {};
let activeQuests = {};
let battles = {};
let dungeonRuns = {};

// --- DATA CONSTANTS (Simplified/Example - replace with your full data) ---

const ELEMENTS = ["Fire", "Water", "Wind", "Lightning", "Earth", "Light", "Dark", "Ice", "Poison", "Arcane", "Nature", "Metal", "Divine"];

const elementSpells = {
  Fire: ["Fireball", "Flame Wave", "Inferno", "Burn Strike"],
  Water: ["Water Blast", "Hydro Pump", "Tidal Wave", "Ice Shard"],
  Earth: ["Rock Smash", "Quake", "Stone Skin", "Fissure"],
  Divine: ["Divine Bolt", "Radiant Judgement", "Sanctify", "Aegis of Dawn"],
  // ... rest of elements
};

const passives = {
  Fire: "Bonus Attack +10",
  Water: "Bonus Mana Regen +5",
  Earth: "Bonus HP +50",
  Divine: "All stats +10%", // Owner-only passive
  // ... rest of elements
};

const itemDatabase = {
  // consumables
  potion_hp: { name: "Small HP Potion", type: "consumable", cost: 100, stats: { hpRestore: 50 } },
  potion_mana: { name: "Small Mana Potion", type: "consumable", cost: 100, stats: { manaRestore: 25 } },
  // equipment
  eq_sword: { name: "Iron Sword", type: "weapon", cost: 500, stats: { attack: 15 } },
  eq_armor: { name: "Leather Armor", type: "armor", cost: 400, stats: { defense: 10, hp: 20 } },
  eq_ring: { name: "Simple Ring", type: "accessory", cost: 300, stats: { luck: 5 } },
  // Add more items to test the dynamic shop button fix
  eq_axe: { name: "Steel Axe", type: "weapon", cost: 800, stats: { attack: 25 } },
  eq_helm: { name: "Steel Helm", type: "armor", cost: 700, stats: { defense: 15 } },
  eq_amulet: { name: "Protection Amulet", type: "accessory", cost: 600, stats: { defense: 5, hp: 10 } },
  eq_bow: { name: "Hunters Bow", type: "weapon", cost: 900, stats: { attack: 20, luck: 5 } },
  eq_shield: { name: "Wooden Shield", type: "armor", cost: 300, stats: { defense: 15 } },
};
// --- HELPER FUNCTIONS (Placeholder, assuming original logic is correct) ---
function recalculateStats(player) {
  // Placeholder: Re-calculate player's maxStats based on level, prestige, and equipment.
  player.maxStats = {
    hp: 100 + (player.Level * 10),
    mana: 50 + (player.Level * 5),
    attack: 10 + (player.Level * 2),
    defense: 5 + (player.Level * 1),
    luck: 0,
  };
  // Apply equipment stats
  for (const itemId of Object.values(player.equipment)) {
    const item = itemDatabase[itemId];
    if (item && item.stats) {
      for (const stat in item.stats) {
        player.maxStats[stat] = (player.maxStats[stat] || 0) + item.stats[stat];
      }
    }
  }
  // Apply Divine Passive Bonus
  if (player.element === "Divine") {
    for (const stat in player.maxStats) {
      player.maxStats[stat] = Math.floor(player.maxStats[stat] * 1.10);
    }
  }

  // Ensure current HP/Mana are not over max
  player.currentStats.hp = Math.min(player.currentStats.hp, player.maxStats.hp);
  player.currentStats.mana = Math.min(player.currentStats.mana, player.maxStats.mana);
}

function createPlayer(userId, element) {
  const player = {
    id: userId,
    element: element,
    Level: 1,
    EXP: 0,
    Gold: 0,
    prestige: 0,
    inventory: {},
    equipment: { weapon: null, armor: null, accessory: null },
    maxStats: {}, // Filled by recalculateStats
    currentStats: { hp: 100, mana: 50 },
    spells: elementSpells[element].slice(0, 2),
    passive: passives[element],
    achievements: [],
    guildId: null,
  };
  recalculateStats(player);
  return player;
}

// Placeholder for other core functions:
function calculateDamage() { return 10; } // Simplified
function processStatusEffects() { } // Simplified
function tryLevelUp() { return false; } // Simplified
function generateDungeonEncounter() { return { hp: 50, gold: 50, exp: 10 }; } // Simplified

// --- DATA MANAGEMENT ---
function loadData() {
  try {
    if (fs.existsSync(PLAYERS_FILE)) players = JSON.parse(fs.readFileSync(PLAYERS_FILE));
    if (fs.existsSync(GUILDS_FILE)) guilds = JSON.parse(fs.readFileSync(GUILDS_FILE));
    if (fs.existsSync(QUESTS_FILE)) activeQuests = JSON.parse(fs.readFileSync(QUESTS_FILE));
    
    // Recalculate stats for all loaded players to ensure consistency
    for (const userId in players) {
      recalculateStats(players[userId]);
    }
    console.log(`✅ Loaded ${Object.keys(players).length} players and ${Object.keys(guilds).length} guilds.`);
  } catch (error) {
    console.error("❌ Error loading data:", error);
  }
}

function saveData() {
  try {
    fs.writeFileSync(PLAYERS_FILE, JSON.stringify(players, null, 2));
    fs.writeFileSync(GUILDS_FILE, JSON.stringify(guilds, null, 2));
    fs.writeFileSync(QUESTS_FILE, JSON.stringify(activeQuests, null, 2));
    // console.log("💾 Data saved successfully.");
  } catch (error) {
    console.error("❌ Error saving data:", error);
  }
}

// --- COMMAND REGISTRATION ---
const commands = [
  new SlashCommandBuilder()
    .setName("start")
    .setDescription("Start your RPG adventure!"),

  new SlashCommandBuilder()
    .setName("profile")
    .setDescription("View your character profile."),

  new SlashCommandBuilder()
    .setName("dungeon")
    .setDescription("Start a dungeon run for EXP and Gold."),

  new SlashCommandBuilder()
    .setName("shop")
    .setDescription("View items and equipment for sale."),

  // --- GUILD COMMAND FIX/ADDITIONS ---
  new SlashCommandBuilder()
    .setName("guild")
    .setDescription("Manage your guild.")
    .addSubcommand(subcommand =>
      subcommand
        .setName("create")
        .setDescription("Create a new guild.")
        .addStringOption(option =>
          option.setName("name").setDescription("The name of your new guild").setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName("view")
        .setDescription("View your current guild's information.")
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName("invite")
        .setDescription("Invite a user to your guild (Leader only).")
        .addUserOption(option =>
          option.setName("user").setDescription("The user to invite").setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName("join")
        .setDescription("Accept an invitation to join a guild.")
        .addStringOption(option =>
          option.setName("guild_name").setDescription("The name of the guild you were invited to").setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName("leave")
        .setDescription("Leave your current guild (dissolves if you are the leader).")
    ),

  new SlashCommandBuilder()
    .setName("bestow")
    .setDescription("[OWNER ONLY] Grant a user gold, exp, or change their element.")
    .addUserOption(option =>
      option.setName("target").setDescription("The user to bestow upon").setRequired(true)
    )
    .addStringOption(option =>
      option.setName("action")
        .setDescription("The action to perform")
        .setRequired(true)
        .addChoices(
          { name: "setGold", value: "setGold" },
          { name: "setExp", value: "setExp" },
          { name: "setElement", value: "setElement" },
          { name: "setLevel", value: "setLevel" },
        )
    )
    .addStringOption(option =>
      option.setName("value").setDescription("The value for the action").setRequired(true)
    ),
].map(command => command.toJSON());
// --- DISCORD EVENTS ---

client.once("ready", async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  loadData();

  // Register all commands to the Discord API
  const rest = new REST({ version: "10" }).setToken(TOKEN);
  try {
    await rest.put(
      Routes.applicationCommands(CLIENT_ID),
      { body: commands },
    );
    console.log("✅ Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error("❌ Failed to register commands:", error);
  }

  // Set up the automatic save interval
  setInterval(saveData, 60000); // Save data every 60 seconds
});

// --- CORE INTERACTION HANDLER REFACTOR ---
client.on("interactionCreate", async (interaction) => {
  if (interaction.isCommand()) {
    const { commandName } = interaction;
    const userId = interaction.user.id;

    // Command Switch for better organization
    switch (commandName) {
      case "start": {
        if (players[userId]) {
          return interaction.reply({ content: "You have already started your adventure!", ephemeral: true });
        }
        
        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId("start_select")
          .setPlaceholder("Choose your starting element...")
          .addOptions(
            ...ELEMENTS.map(element => {
              if (element === "Divine" && userId !== OWNER_ID) return null; // Divine element check
              return new StringSelectMenuOptionBuilder()
                .setLabel(element)
                .setValue(element);
            }).filter(Boolean)
          );
        
        const row = new ActionRowBuilder().addComponents(selectMenu);
        return interaction.reply({ content: "Welcome! Choose your starting element:", components: [row], ephemeral: true });
      }

      case "profile": {
        const player = players[userId];
        if (!player) return interaction.reply({ content: "Please use **/start** first.", ephemeral: true });

        const embed = new EmbedBuilder()
          .setTitle(`⚔️ ${interaction.user.username}'s Profile`)
          .setDescription(`**Level**: ${player.Level} (Exp: ${player.EXP})\n**Element**: ${player.element} (${player.passive})`)
          .addFields(
            { name: "Health/Mana", value: `HP: ${player.currentStats.hp}/${player.maxStats.hp}\nMana: ${player.currentStats.mana}/${player.maxStats.mana}`, inline: true },
            { name: "Stats", value: `ATK: ${player.maxStats.attack}\nDEF: ${player.maxStats.defense}\nLUCK: ${player.maxStats.luck}`, inline: true },
            { name: "Gold", value: `${player.Gold.toLocaleString()} 🪙`, inline: false }
          )
          .setColor(0x00ff00);

        return interaction.reply({ embeds: [embed] });
      }

      case "dungeon": {
        if (!players[userId]) return interaction.reply({ content: "Please use **/start** first.", ephemeral: true });
        if (dungeonRuns[userId]) return interaction.reply({ content: "You are already in a dungeon run!", ephemeral: true });
        
        // Start dungeon logic
        const player = players[userId];
        const monster = generateDungeonEncounter(player.Level, 1); // Start at floor 1
        dungeonRuns[userId] = { floor: 1, monster: monster, playerHP: player.currentStats.hp, playerMana: player.currentStats.mana };

        const embed = new EmbedBuilder()
          .setTitle(`Dungeon Floor 1: ${monster.name}`)
          .setDescription(`**Monster HP:** ${monster.hp}\n**Your HP:** ${player.currentStats.hp}/${player.maxStats.hp}\n**Your Mana:** ${player.currentStats.mana}/${player.maxStats.mana}`)
          .setColor(0xff0000);

        const attackRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("dungeonattack").setLabel("Attack").setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId("leavedungeon").setLabel("Flee").setStyle(ButtonStyle.Danger),
        );

        return interaction.reply({ embeds: [embed], components: [attackRow], ephemeral: false });
      }

      case "shop": {
        if (!players[userId]) return interaction.reply({ content: "Please use **/start** first.", ephemeral: true });

        const itemsToShow = Object.entries(itemDatabase).map(([id, item]) => ({ id, ...item }));
        
        const shopEmbed = new EmbedBuilder()
          .setTitle("🛒 The General Store")
          .setDescription("Buy equipment and consumables to help your journey!")
          .setColor(0xaa00aa);

        // Populate embed with item list
        let itemDescription = "";
        itemsToShow.forEach(item => {
          itemDescription += `\n**${item.name}** (${item.cost} 🪙) - *${item.type.toUpperCase()}*\n`;
          // You can add more detailed stats here if desired
        });
        shopEmbed.addFields({ name: "Available Items", value: itemDescription || "The shop is empty.", inline: false });
        
        // --- FIX: DYNAMICALLY CREATE ACTION ROWS FOR ALL ITEMS ---
        const allRows = [];
        let currentRow = new ActionRowBuilder();
        let buttonCount = 0;
        const MAX_ROWS = 5;

        for (const [index, { id, name, cost }] of itemsToShow.entries()) {
          const button = new ButtonBuilder()
            .setCustomId(`buyitem_${id}`)
            .setLabel(`Buy ${name} (${cost}🪙)`)
            .setStyle(ButtonStyle.Secondary);

          if (allRows.length < MAX_ROWS) {
            currentRow.addComponents(button);
            buttonCount++;
          }

          // Check Discord's limit of 5 buttons per row
          if (buttonCount === 5 || index === itemsToShow.length - 1) {
            if (currentRow.components.length > 0) {
              allRows.push(currentRow);
            }
            
            if (allRows.length < MAX_ROWS) {
              currentRow = new ActionRowBuilder();
              buttonCount = 0;
            } else {
              // Stop adding buttons if we hit the 5-row limit (25 buttons total)
              break; 
            }
          }
        }
        // --- END FIX ---

        return interaction.reply({ embeds: [shopEmbed], components: allRows.length > 0 ? allRows : [], ephemeral: false });
      }
      
      case "guild": {
        const action = interaction.options.getSubcommand();
        const player = players[userId];

        if (!player) return interaction.reply({ content: "Please use **/start** first.", ephemeral: true });

        switch (action) {
          case "create": {
            const name = interaction.options.getString("name");
            if (player.guildId) return interaction.reply({ content: `You are already in a guild: **${guilds[player.guildId].name}**`, ephemeral: true });
            if (Object.values(guilds).some(g => g.name.toLowerCase() === name.toLowerCase())) return interaction.reply({ content: "A guild with that name already exists.", ephemeral: true });

            const newId = `G${Date.now()}`;
            guilds[newId] = { id: newId, name, leader: userId, members: [userId], invites: [], level: 1, exp: 0, gold: 0, buffs: [] };
            player.guildId = newId;
            saveData();
            return interaction.reply({ content: `✅ Guild **${name}** created! You are the leader!`, ephemeral: false });
          }
          case "view": {
            const guildId = player.guildId;
            if (!guildId) return interaction.reply({ content: "You are not in a guild.", ephemeral: true });
            const guild = guilds[guildId];
            const leaderName = client.users.cache.get(guild.leader)?.username || "Unknown User";
            
            const embed = new EmbedBuilder()
              .setTitle(`🛡️ ${guild.name}`)
              .setDescription(`Leader: **${leaderName}**\nLevel: ${guild.level}\nMembers: ${guild.members.length}\nGold Stash: ${guild.gold.toLocaleString()} 🪙`)
              .setColor(0x0099ff);

            return interaction.reply({ embeds: [embed] });
          }
          // --- FIX: ADDED MISSING LOGIC FOR INVITE AND JOIN ---
          case "invite": {
            const targetUser = interaction.options.getUser("user");
            const guildId = player.guildId;
            const guild = guilds[guildId];
            
            if (!guildId) return interaction.reply({ content: "You must be in a guild to invite others.", ephemeral: true });
            if (guild.leader !== userId) return interaction.reply({ content: "Only the guild leader can send invites.", ephemeral: true });
            if (!targetUser || targetUser.bot || players[targetUser.id]?.guildId) return interaction.reply({ content: "Invalid user, bot, or user is already in a guild.", ephemeral: true });
            if (guild.invites.includes(targetUser.id)) return interaction.reply({ content: "That user has already been invited.", ephemeral: true });

            guild.invites.push(targetUser.id);
            saveData();

            try {
              await targetUser.send(`You have been invited to join the guild **${guild.name}** by ${interaction.user.username}! Use the **/guild join** command with the guild name.`);
            } catch (e) {
              console.error(`Could not DM user ${targetUser.id}: ${e.message}`);
            }

            return interaction.reply({ content: `✅ Invited **${targetUser.username}** to **${guild.name}**! They have been DM'd.`, ephemeral: false });
          }
          case "join": {
            const inviteCode = interaction.options.getString("guild_name");
            if (player.guildId) return interaction.reply({ content: `You are already in a guild.`, ephemeral: true });

            const guildToJoin = Object.values(guilds).find(g => g.name.toLowerCase() === inviteCode.toLowerCase());
            if (!guildToJoin) return interaction.reply({ content: "Guild not found.", ephemeral: true });
            
            if (!guildToJoin.invites.includes(userId)) return interaction.reply({ content: `You have not been invited to **${guildToJoin.name}**.`, ephemeral: true });
            
            if (guildToJoin.members.length >= 50) return interaction.reply({ content: `**${guildToJoin.name}** is full (50/50 members).`, ephemeral: true });

            guildToJoin.members.push(userId);
            guildToJoin.invites = guildToJoin.invites.filter(id => id !== userId);
            player.guildId = guildToJoin.id;
            saveData();
            return interaction.reply({ content: `✅ You have joined **${guildToJoin.name}**!`, ephemeral: false });
          }
          // --- END FIX ---
          case "leave": {
            const guildId = player.guildId;
            if (!guildId) return interaction.reply({ content: "You are not in a guild.", ephemeral: true });

            const guild = guilds[guildId];
            
            if (guild.leader === userId) {
              // Dissolve guild
              delete guilds[guildId];
              guild.members.forEach(memberId => players[memberId] && (players[memberId].guildId = null));
              saveData();
              return interaction.reply({ content: `❌ Guild **${guild.name}** has been dissolved. All members are now guildless.`, ephemeral: false });
            } else {
              // Member leaves
              guild.members = guild.members.filter(id => id !== userId);
              player.guildId = null;
              saveData();
              return interaction.reply({ content: `🚪 You have left **${guild.name}**.`, ephemeral: false });
            }
          }
          default:
            return interaction.reply({ content: "Unknown guild action.", ephemeral: true });
        }
      }

      case "bestow": {
        if (userId !== OWNER_ID) {
          return interaction.reply({ content: "Owner only!", ephemeral: true });
        }
        
        const target = interaction.options.getUser("target");
        const targetId = target.id;
        const action = interaction.options.getString("action");
        const valueStr = interaction.options.getString("value");
        let value = parseInt(valueStr);

        if (!players[targetId]) {
          return interaction.reply({ content: `${target.username} has not started the game yet.`, ephemeral: true });
        }
        const targetPlayer = players[targetId];

        switch (action) {
          case "setGold":
            if (value >= 0) targetPlayer.Gold = value;
            else return interaction.reply({ content: "Gold value must be non-negative.", ephemeral: true });
            break;
          case "setExp":
            if (value >= 0) targetPlayer.EXP = value;
            else return interaction.reply({ content: "Exp value must be non-negative.", ephemeral: true });
            break;
          case "setElement":
            const element = valueStr.charAt(0).toUpperCase() + valueStr.slice(1).toLowerCase();
            if (ELEMENTS.includes(element)) {
              targetPlayer.element = element;
              targetPlayer.spells = elementSpells[element].slice(0, 2);
              targetPlayer.passive = passives[element];
            } else {
              return interaction.reply({ content: `Invalid element: ${valueStr}`, ephemeral: true });
            }
            break;
          case "setLevel":
            if (value > 0) {
              targetPlayer.Level = value;
              recalculateStats(targetPlayer);
            } else {
              return interaction.reply({ content: "Level value must be positive.", ephemeral: true });
            }
            break;
          default:
            return interaction.reply({ content: "Unknown action!", ephemeral: true });
        }

        saveData();
        return interaction.reply({
          content: `✅ Applied **${action}** to ${target.username}. Current ${action} is: **${action === 'setElement' ? targetPlayer.element : value}**`,
          ephemeral: true,
        });
      }
    }
  } 
                // --- BUTTON/SELECT MENU INTERACTION HANDLER REFACTOR ---
  else if (interaction.isButton() || interaction.isStringSelectMenu()) {
    const customId = interaction.customId;
    const userId = interaction.user.id;
    const player = players[userId];

    if (!player) return interaction.reply({ content: "Please use **/start** first.", ephemeral: true });

    // Handle Select Menus
    if (interaction.isStringSelectMenu()) {
      switch (customId) {
        case "start_select": {
          const chosenElement = interaction.values[0];
          
          if (chosenElement === "Divine" && userId !== OWNER_ID) {
            return interaction.update({
              content: "Divine element is owner-only. Please choose another.",
              components: interaction.message.components, // Keep component to allow re-selection
              embeds: [],
            });
          }

          players[userId] = createPlayer(userId, chosenElement);
          saveData();
          return interaction.update({
            content: `🎉 You have chosen **${chosenElement}**! Use **/profile** to view your stats.`,
            components: [],
            embeds: [],
          });
        }
        // Add other select menu logic here
        // case "pvp_select": ... 
      }
    }
    
    // Handle Buttons
    else if (interaction.isButton()) {
      const action = customId.split("_")[0];
      
      switch (action) {
        case "dungeonattack": {
          // --- FIX: DUNGEON SAFETY CHECK ---
          if (!dungeonRuns[userId]) return interaction.reply({ content: "You are not in an active dungeon!", ephemeral: true });
          
          const run = dungeonRuns[userId];
          const monster = run.monster;
          const damage = calculateDamage(player, monster);
          monster.hp -= damage;
          
          let response = `You attacked the **${monster.name}** for ${damage} damage!\n`;
          
          if (monster.hp <= 0) {
            // Victory
            player.EXP += monster.exp;
            player.Gold += monster.gold;
            tryLevelUp(player);
            delete dungeonRuns[userId];
            saveData();
            
            response += `✅ You defeated the **${monster.name}**! You gained ${monster.exp} EXP and ${monster.gold} 🪙.`;
            return interaction.update({ content: response, components: [], embeds: [] });

          } else {
            // Monster attacks back
            // Simplified monster damage logic
            const monsterDamage = Math.max(1, Math.floor(monster.attack - (player.maxStats.defense / 2))); 
            run.playerHP -= monsterDamage;
            response += `The **${monster.name}** attacked you back for ${monsterDamage} damage!\n`;
            
            if (run.playerHP <= 0) {
              // Defeat
              player.currentStats.hp = Math.floor(player.maxStats.hp * 0.5); // Respawn with half health
              delete dungeonRuns[userId];
              saveData();
              
              response += `❌ You have been defeated on Floor ${run.floor}! You retreated and lost some progress.`;
              return interaction.update({ content: response, components: [], embeds: [] });
            }
            
            // Continue battle
            const embed = EmbedBuilder.from(interaction.message.embeds[0])
              .setDescription(`**Monster HP:** ${monster.hp}\n**Your HP:** ${run.playerHP}/${player.maxStats.hp}\n**Your Mana:** ${run.playerMana}/${player.maxStats.mana}`);
            
            return interaction.update({ content: response, embeds: [embed] });
          }
        }

        case "leavedungeon": {
          // --- FIX: DUNGEON SAFETY CHECK ---
          if (!dungeonRuns[userId]) return interaction.reply({ content: "You are not in an active dungeon to flee from!", ephemeral: true });

          const run = dungeonRuns[userId];
          player.currentStats.hp = run.playerHP; // Keep current HP/Mana from the run
          player.currentStats.mana = run.playerMana;
          delete dungeonRuns[userId];
          saveData();
          return interaction.update({ content: "🚪 You fled the dungeon and saved your progress!", components: [], embeds: [] });
        }

        case "buyitem": {
          // Logic for buying an item from the shop
          const itemId = customId.split("_")[1];
          const item = itemDatabase[itemId];

          if (!item) return interaction.reply({ content: "Item not found!", ephemeral: true });
          if (player.Gold < item.cost) return interaction.reply({ content: `You need ${item.cost} 🪙 to buy ${item.name}!`, ephemeral: true });

          player.Gold -= item.cost;
          
          // Simple inventory add logic
          if (!player.inventory[itemId]) player.inventory[itemId] = 0;
          player.inventory[itemId]++;
          
          saveData();
          return interaction.reply({ content: `✅ Purchased **${item.name}** for ${item.cost} 🪙!`, ephemeral: true });
        }
        
        // Add other button logic here
        // case "equipitem": ...
        // case "nextfloor": ...
        
        default:
          return interaction.reply({ content: "Unknown button action.", ephemeral: true });
      }
    }
  }
});

// --- HTTP SERVER FOR MONITORING ---
const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(
    JSON.stringify({
      status: "online",
      bot: client.user ? client.user.tag : "connecting...",
      players: Object.keys(players).length,
      guilds: Object.keys(guilds).length,
      uptime: process.uptime(),
    }),
  );
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ HTTP server running on port ${PORT} for UptimeRobot`);
});

// --- BOT LOGIN ---
client
  .login(TOKEN)
  .then(() => console.log("✅ Bot online!"))
  .catch((err) => console.error("❌ Login failed:", err));

// Initial data load on startup (before commands are registered)
loadData();

// Process exit handlers to ensure data is saved
process.on("SIGINT", () => {
  console.log("\n🛑 SIGINT received. Saving data and exiting...");
  saveData();
  process.exit();
});

process.on("SIGTERM", () => {
  console.log("\n🛑 SIGTERM received. Saving data and exiting...");
  saveData();
  process.exit();
});
