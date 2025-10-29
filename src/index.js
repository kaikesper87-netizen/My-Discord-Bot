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

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const OWNER_ID = process.env.OWNER_ID;

if (!TOKEN) {
  console.error("❌ TOKEN not set in environment");
  process.exit(1);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const DATA_DIR = path.join(__dirname, "..", "data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const PLAYERS_FILE = path.join(DATA_DIR, "players.json");
const GUILDS_FILE = path.join(DATA_DIR, "guilds.json");
const QUESTS_FILE = path.join(DATA_DIR, "quests.json");

let players = {};
let guilds = {};
let activeQuests = {};
let battles = {};
let dungeonRuns = {};

function loadData() {
  try {
    if (fs.existsSync(PLAYERS_FILE)) {
      players = JSON.parse(fs.readFileSync(PLAYERS_FILE, "utf8"));
      console.log("✅ Loaded players");
    }
    if (fs.existsSync(GUILDS_FILE)) {
      guilds = JSON.parse(fs.readFileSync(GUILDS_FILE, "utf8"));
      console.log("✅ Loaded guilds");
    }
    if (fs.existsSync(QUESTS_FILE)) {
      activeQuests = JSON.parse(fs.readFileSync(QUESTS_FILE, "utf8"));
      console.log("✅ Loaded quests");
    }
  } catch (e) {
    console.error("❌ Failed to load data:", e);
  }
}

function saveData() {
  try {
    fs.writeFileSync(PLAYERS_FILE, JSON.stringify(players, null, 2));
    fs.writeFileSync(GUILDS_FILE, JSON.stringify(guilds, null, 2));
    fs.writeFileSync(QUESTS_FILE, JSON.stringify(activeQuests, null, 2));
  } catch (e) {
    console.error("❌ Failed to save data:", e);
  }
}

loadData();

const elementSpells = {
  Fire: ["Fireball", "Flame Wave", "Inferno", "Burn Strike"],
  Water: ["Water Jet", "Tsunami", "Aqua Shield", "Healing Rain"],
  Wind: ["Wind Slash", "Gale Force", "Tornado", "Haste"],
  Lightning: [
    "Lightning Bolt",
    "Thunder Strike",
    "Static Shock",
    "Chain Lightning",
  ],
  Earth: ["Rock Throw", "Earthquake", "Stone Wall", "Shield Wall"],
  Light: ["Holy Light", "Radiant Beam", "Solar Flare", "Purify"],
  Dark: ["Shadow Bolt", "Umbral Wave", "Nightmare", "Drain Life"],
  Ice: ["Ice Shard", "Frost Nova", "Blizzard", "Chill Ward"],
  Poison: ["Poison Dart", "Venom Cloud", "Corrupt", "Toxin Trap"],
  Arcane: ["Arcane Missiles", "Mana Burst", "Leyline", "Arcane Shield"],
  Nature: ["Thorn Strike", "Entangle", "Regrowth", "Overgrowth"],
  Metal: ["Iron Fist", "Metal Barrage", "Reflective Shield", "Fortify"],
  Divine: ["Divine Bolt", "Radiant Judgement", "Sanctify", "Aegis of Dawn"],
};

const passives = {
  Fire: "Burn Damage +30%",
  Water: "Healing Boost +25%",
  Wind: "Evasion +15%",
  Lightning: "Stun Chance +20%",
  Earth: "Bonus HP +50",
  Light: "First Strike & Crit +25%",
  Dark: "Life Steal 20%",
  Ice: "Freeze Chance +12%",
  Poison: "DoT +15 per turn",
  Arcane: "Mana Efficiency +30%",
  Nature: "Regen +5 HP/turn",
  Metal: "Armor +20 & Reflect 10%",
  Divine: "All stats +10%",
};

const spellCosts = {
  Fireball: 15,
  "Flame Wave": 10,
  Inferno: 30,
  "Burn Strike": 12,
  "Lightning Bolt": 25,
  "Thunder Strike": 20,
  "Static Shock": 12,
  "Chain Lightning": 28,
  "Wind Slash": 10,
  "Gale Force": 18,
  Tornado: 25,
  Haste: 15,
  Tsunami: 25,
  "Water Jet": 10,
  "Aqua Shield": 15,
  "Healing Rain": 20,
  "Rock Throw": 8,
  Earthquake: 20,
  "Stone Wall": 15,
  "Shield Wall": 18,
  "Holy Light": 18,
  "Radiant Beam": 22,
  "Solar Flare": 30,
  Purify: 20,
  "Shadow Bolt": 18,
  "Umbral Wave": 22,
  Nightmare: 28,
  "Drain Life": 20,
  "Ice Shard": 12,
  "Frost Nova": 18,
  Blizzard: 26,
  "Chill Ward": 15,
  "Poison Dart": 10,
  "Venom Cloud": 18,
  Corrupt: 22,
  "Toxin Trap": 12,
  "Arcane Missiles": 12,
  "Mana Burst": 20,
  Leyline: 25,
  "Arcane Shield": 15,
  "Thorn Strike": 10,
  Entangle: 18,
  Regrowth: 20,
  Overgrowth: 28,
  "Iron Fist": 12,
  "Metal Barrage": 22,
  "Reflective Shield": 18,
  Fortify: 15,
  "Divine Bolt": 20,
  "Radiant Judgement": 30,
  Sanctify: 25,
  "Aegis of Dawn": 15,
};

const spellLevels = {
  0: 2,
  5: 3,
  10: 4,
  20: 5,
  30: 6,
  50: 7,
  75: 8,
  100: 9,
};

const itemDatabase = {
  "Health Potion": {
    type: "consumable",
    cost: 50,
    effect: { HP: 50 },
    desc: "Restores 50 HP",
  },
  "Mana Potion": {
    type: "consumable",
    cost: 50,
    effect: { Mana: 50 },
    desc: "Restores 50 Mana",
  },
  "Greater Health Potion": {
    type: "consumable",
    cost: 150,
    effect: { HP: 150 },
    desc: "Restores 150 HP",
  },
  "Greater Mana Potion": {
    type: "consumable",
    cost: 150,
    effect: { Mana: 150 },
    desc: "Restores 150 Mana",
  },
  "Iron Sword": {
    type: "weapon",
    cost: 100,
    stats: { attack: 10 },
    desc: "+10 Attack",
  },
  "Steel Sword": {
    type: "weapon",
    cost: 300,
    stats: { attack: 25 },
    desc: "+25 Attack",
  },
  "Mystic Blade": {
    type: "weapon",
    cost: 800,
    stats: { attack: 50, mana: 20 },
    desc: "+50 Attack, +20 Mana",
  },
  "Legendary Sword": {
    type: "weapon",
    cost: 2000,
    stats: { attack: 100, mana: 50 },
    desc: "+100 Attack, +50 Mana",
  },
  "Leather Armor": {
    type: "armor",
    cost: 100,
    stats: { defense: 10 },
    desc: "+10 Defense",
  },
  "Chain Mail": {
    type: "armor",
    cost: 300,
    stats: { defense: 25 },
    desc: "+25 Defense",
  },
  "Plate Armor": {
    type: "armor",
    cost: 800,
    stats: { defense: 50, hp: 50 },
    desc: "+50 Defense, +50 HP",
  },
  "Dragon Armor": {
    type: "armor",
    cost: 2000,
    stats: { defense: 100, hp: 150 },
    desc: "+100 Defense, +150 HP",
  },
  "Simple Ring": {
    type: "accessory",
    cost: 150,
    stats: { mana: 20 },
    desc: "+20 Mana",
  },
  "Magic Amulet": {
    type: "accessory",
    cost: 400,
    stats: { mana: 50, hp: 30 },
    desc: "+50 Mana, +30 HP",
  },
  "Ancient Relic": {
    type: "accessory",
    cost: 1500,
    stats: { attack: 30, mana: 80, hp: 50 },
    desc: "+30 Atk, +80 Mana, +50 HP",
  },
};

const monsters = {
  Goblin: { HP: 40, attack: 8, defense: 2, exp: 25, gold: 10 },
  Orc: { HP: 70, attack: 15, defense: 5, exp: 50, gold: 25 },
  Troll: { HP: 120, attack: 22, defense: 10, exp: 85, gold: 50 },
  "Dark Mage": { HP: 90, attack: 30, defense: 5, exp: 100, gold: 60 },
  Golem: { HP: 180, attack: 25, defense: 20, exp: 120, gold: 75 },
  Dragon: { HP: 250, attack: 40, defense: 15, exp: 200, gold: 150 },
  "Shadow Demon": { HP: 200, attack: 45, defense: 10, exp: 250, gold: 200 },
};

const bosses = {
  "Goblin King": {
    HP: 300,
    attack: 35,
    defense: 15,
    exp: 500,
    gold: 400,
    floor: 5,
  },
  "Ancient Dragon": {
    HP: 500,
    attack: 55,
    defense: 25,
    exp: 1000,
    gold: 800,
    floor: 10,
  },
  "Void Lord": {
    HP: 800,
    attack: 70,
    defense: 35,
    exp: 2000,
    gold: 1500,
    floor: 15,
  },
  "Primordial Titan": {
    HP: 1200,
    attack: 90,
    defense: 50,
    exp: 3500,
    gold: 3000,
    floor: 20,
  },
};

const achievements = {
  first_blood: {
    name: "First Blood",
    desc: "Win your first PvP battle",
    reward: { gold: 100 },
  },
  dungeon_novice: {
    name: "Dungeon Novice",
    desc: "Clear floor 5",
    reward: { gold: 200 },
  },
  dungeon_expert: {
    name: "Dungeon Expert",
    desc: "Clear floor 10",
    reward: { gold: 500 },
  },
  level_10: {
    name: "Apprentice Mage",
    desc: "Reach level 10",
    reward: { gold: 150 },
  },
  level_25: {
    name: "Adept Mage",
    desc: "Reach level 25",
    reward: { gold: 300 },
  },
  level_50: {
    name: "Master Mage",
    desc: "Reach level 50",
    reward: { gold: 750 },
  },
  rich: { name: "Wealthy", desc: "Accumulate 5000 gold", reward: { exp: 500 } },
  prestigious: {
    name: "Prestigious",
    desc: "Prestige once",
    reward: { gold: 1000 },
  },
};

function getSpellCost(spell) {
  return spellCosts[spell] || 10;
}

function createPlayer(userId, username, element) {
  const baseMax = 100;
  players[userId] = {
    username,
    element,
    HP: baseMax,
    Mana: baseMax,
    maxHP: baseMax,
    maxMana: baseMax,
    attack: 0,
    defense: 0,
    Rank: "Novice Mage",
    Gold: 100,
    EXP: 0,
    Level: 1,
    spells: elementSpells[element].slice(0, 2),
    passive: passives[element],
    cooldowns: {},
    prestige: 0,
    pvpPoints: 0,
    dungeonFloor: 1,
    inventory: {},
    equipment: { weapon: null, armor: null, accessory: null },
    statusEffects: {},
    achievements: [],
    quests: {},
    guildId: null,
    stats: { pvpWins: 0, pvpLosses: 0, monstersDefeated: 0, bossesDefeated: 0 },
  };
  saveData();
}

function getPlayer(id) {
  return players[id];
}

function applyHealing(player, amount) {
  player.HP = Math.min(player.HP + amount, player.maxHP);
}

function applyDamageToPlayer(player, dmg) {
  const actualDamage = Math.max(1, dmg - player.defense);
  player.HP -= actualDamage;
  if (player.HP < 0) player.HP = 0;
  return actualDamage;
}

function calculateEquipmentStats(player) {
  let bonus = { attack: 0, defense: 0, hp: 0, mana: 0 };
  for (let slot of ["weapon", "armor", "accessory"]) {
    const item = player.equipment[slot];
    if (item && itemDatabase[item]) {
      const stats = itemDatabase[item].stats || {};
      bonus.attack += stats.attack || 0;
      bonus.defense += stats.defense || 0;
      bonus.hp += stats.hp || 0;
      bonus.mana += stats.mana || 0;
    }
  }
  return bonus;
}

function recalculateStats(player) {
  const bonus = calculateEquipmentStats(player);
  player.attack = bonus.attack;
  player.defense = bonus.defense;
  const baseMaxHP = 100 + player.Level * 10 + player.prestige * 20;
  const baseMaxMana = 100 + player.Level * 10 + player.prestige * 15;
  player.maxHP = Math.min(baseMaxHP + bonus.hp, 2000);
  player.maxMana = Math.min(baseMaxMana + bonus.mana, 2000);
  if (player.element === "Earth") player.maxHP += 50;
  player.HP = Math.min(player.HP, player.maxHP);
  player.Mana = Math.min(player.Mana, player.maxMana);
}

function calculateDamage(attacker, defender, spell) {
  let baseDamage = 20 + (attacker.attack || 0);
  attacker._lastCrit = false;
  attacker._lastStatusEffect = null;

  if (!spell) spell = "Basic Strike";

  if (/fire|flame|inferno|burn/i.test(spell)) baseDamage = 25 + attacker.attack;
  if (/lightning|thunder/i.test(spell)) baseDamage = 28 + attacker.attack;
  if (/water|aqua/i.test(spell)) baseDamage = 18 + attacker.attack;
  if (/wind|gale|tornado/i.test(spell)) baseDamage = 15 + attacker.attack;
  if (/earth|rock|stone/i.test(spell)) baseDamage = 22 + attacker.attack;
  if (/heal|regrowth|sanctify|purify|rain/i.test(spell)) {
    baseDamage = -Math.max(30, Math.floor(attacker.maxHP * 0.3));
    if (attacker.element === "Water")
      baseDamage = Math.floor(baseDamage * 1.25);
    return baseDamage;
  }
  if (/ice|frost|blizzard/i.test(spell)) baseDamage = 18 + attacker.attack;
  if (/poison|venom|corrupt/i.test(spell)) baseDamage = 16 + attacker.attack;
  if (/arcane/i.test(spell)) baseDamage = 20 + attacker.attack;
  if (/divine|radiant|holy/i.test(spell)) baseDamage = 30 + attacker.attack;
  if (/shadow|umbral|nightmare|drain/i.test(spell))
    baseDamage = 22 + attacker.attack;
  if (/thorn|entangle/i.test(spell)) baseDamage = 17 + attacker.attack;
  if (/metal|iron|fortify/i.test(spell)) baseDamage = 20 + attacker.attack;

  baseDamage += Math.floor(attacker.Mana / 8);

  if (
    attacker.element === "Fire" &&
    attacker.HP <= Math.floor(attacker.maxHP * 0.5)
  ) {
    baseDamage = Math.floor(baseDamage * 1.3);
  }
  if (
    attacker.element === "Wind" &&
    attacker.HP <= Math.floor(attacker.maxHP * 0.2)
  ) {
    baseDamage = Math.floor(baseDamage * 1.5);
  }
  if (attacker.element === "Light" && Math.random() < 0.25) {
    baseDamage = Math.floor(baseDamage * 1.5);
    attacker._lastCrit = true;
  }

  if (
    attacker.element === "Fire" &&
    /fire|burn/i.test(spell) &&
    Math.random() < 0.3
  ) {
    attacker._lastStatusEffect = "burn";
  }
  if (
    attacker.element === "Ice" &&
    /ice|frost/i.test(spell) &&
    Math.random() < 0.15
  ) {
    attacker._lastStatusEffect = "freeze";
  }
  if (
    attacker.element === "Poison" &&
    /poison|venom/i.test(spell) &&
    Math.random() < 0.25
  ) {
    attacker._lastStatusEffect = "poison";
  }
  if (
    attacker.element === "Lightning" &&
    /lightning|thunder/i.test(spell) &&
    Math.random() < 0.2
  ) {
    attacker._lastStatusEffect = "stun";
  }

  return baseDamage;
}

function applyStatusEffect(target, effect, duration = 3) {
  if (!target.statusEffects) target.statusEffects = {};
  target.statusEffects[effect] = { duration, applied: Date.now() };
}

function processStatusEffects(player) {
  if (!player.statusEffects) player.statusEffects = {};
  let messages = [];

  if (player.statusEffects.burn && player.statusEffects.burn.duration > 0) {
    const damage = 15;
    player.HP -= damage;
    if (player.HP < 0) player.HP = 0;
    messages.push(`🔥 Burn dealt ${damage} damage!`);
    player.statusEffects.burn.duration--;
  }

  if (player.statusEffects.poison && player.statusEffects.poison.duration > 0) {
    const damage = 12;
    player.HP -= damage;
    if (player.HP < 0) player.HP = 0;
    messages.push(`☠️ Poison dealt ${damage} damage!`);
    player.statusEffects.poison.duration--;
  }

  if (player.element === "Nature") {
    const heal = 5;
    applyHealing(player, heal);
    messages.push(`🌿 Natural regeneration healed ${heal} HP!`);
  }

  Object.keys(player.statusEffects).forEach((effect) => {
    if (player.statusEffects[effect].duration <= 0) {
      delete player.statusEffects[effect];
    }
  });

  return messages;
}

function tryLevelUp(player) {
  let leveledUp = false;
  while (true) {
    const required = 100 * player.Level;
    if (player.EXP < required) break;
    player.EXP -= required;
    player.Level += 1;
    leveledUp = true;

    recalculateStats(player);

    const maxSpells = spellLevels[player.Level] || spellLevels[100];
    const availableSpells = elementSpells[player.element] || [];
    player.spells = availableSpells.slice(
      0,
      Math.min(maxSpells, availableSpells.length),
    );

    checkAchievements(player);
  }
  if (leveledUp) saveData();
  return leveledUp;
}

function checkAchievements(player) {
  const toCheck = [
    { id: "level_10", condition: player.Level >= 10 },
    { id: "level_25", condition: player.Level >= 25 },
    { id: "level_50", condition: player.Level >= 50 },
    { id: "rich", condition: player.Gold >= 5000 },
    { id: "prestigious", condition: player.prestige >= 1 },
    { id: "dungeon_novice", condition: player.dungeonFloor >= 5 },
    { id: "dungeon_expert", condition: player.dungeonFloor >= 10 },
  ];

  toCheck.forEach(({ id, condition }) => {
    if (condition && !player.achievements.includes(id)) {
      player.achievements.push(id);
      const ach = achievements[id];
      if (ach && ach.reward) {
        if (ach.reward.gold) player.Gold += ach.reward.gold;
        if (ach.reward.exp) player.EXP += ach.reward.exp;
      }
    }
  });
}

function generateDungeonEncounter(floor) {
  if (floor % 5 === 0) {
    const bossNames = Object.keys(bosses).filter(
      (b) => bosses[b].floor === floor,
    );
    if (bossNames.length > 0) {
      const bossName = bossNames[Math.floor(Math.random() * bossNames.length)];
      const boss = { ...bosses[bossName], _name: bossName, _isBoss: true };
      const scaling = 1 + floor / 10;
      boss.HP = Math.floor(boss.HP * scaling);
      boss.attack = Math.floor(boss.attack * scaling);
      boss.defense = Math.floor(boss.defense * scaling);
      return boss;
    }
  }

  const monsterNames = Object.keys(monsters);
  const monsterName =
    monsterNames[Math.floor(Math.random() * monsterNames.length)];
  const monster = {
    ...monsters[monsterName],
    _name: monsterName,
    _isBoss: false,
  };
  const scaling = 1 + floor / 15;
  monster.HP = Math.floor(monster.HP * scaling);
  monster.attack = Math.floor(monster.attack * scaling);
  monster.defense = Math.floor(monster.defense * scaling);
  monster.exp = Math.floor(monster.exp * scaling);
  monster.gold = Math.floor(monster.gold * scaling);

  return monster;
}

function generateQuests() {
  return {
    daily_dungeon: {
      type: "daily",
      desc: "Clear 3 dungeon floors",
      progress: 0,
      goal: 3,
      reward: { gold: 150, exp: 100 },
      expires: Date.now() + 86400000,
    },
    daily_pvp: {
      type: "daily",
      desc: "Win 2 PvP battles",
      progress: 0,
      goal: 2,
      reward: { gold: 200, exp: 150 },
      expires: Date.now() + 86400000,
    },
    weekly_boss: {
      type: "weekly",
      desc: "Defeat 5 bosses",
      progress: 0,
      goal: 5,
      reward: { gold: 1000, exp: 800 },
      expires: Date.now() + 604800000,
    },
    weekly_level: {
      type: "weekly",
      desc: "Gain 5 levels",
      progress: 0,
      goal: 5,
      reward: { gold: 800, exp: 500 },
      expires: Date.now() + 604800000,
    },
  };
}

const elementChoices = Object.keys(elementSpells)
  .filter((e) => e !== "Divine")
  .map((e) => ({ name: e, value: e }));

const commands = [
  new SlashCommandBuilder()
    .setName("start")
    .setDescription("Start your RPG journey"),
  new SlashCommandBuilder()
    .setName("profile")
    .setDescription("View your character profile"),
  new SlashCommandBuilder()
    .setName("dungeon")
    .setDescription("Enter the dungeon (PvE)"),
  new SlashCommandBuilder()
    .setName("inventory")
    .setDescription("View your inventory and equipment"),
  new SlashCommandBuilder()
    .setName("shop")
    .setDescription("Browse the item shop"),
  new SlashCommandBuilder()
    .setName("equip")
    .setDescription("Equip an item")
    .addStringOption((o) =>
      o.setName("item").setDescription("Item name").setRequired(true),
    )
    .addStringOption((o) =>
      o
        .setName("slot")
        .setDescription("Equipment slot")
        .setRequired(true)
        .addChoices(
          { name: "weapon", value: "weapon" },
          { name: "armor", value: "armor" },
          { name: "accessory", value: "accessory" },
        ),
    ),
  new SlashCommandBuilder()
    .setName("use")
    .setDescription("Use a consumable item")
    .addStringOption((o) =>
      o.setName("item").setDescription("Item name").setRequired(true),
    ),
  new SlashCommandBuilder().setName("quest").setDescription("View your quests"),
  new SlashCommandBuilder()
    .setName("guild")
    .setDescription("Manage your guild")
    .addStringOption((o) =>
      o
        .setName("action")
        .setDescription("Action")
        .setRequired(true)
        .addChoices(
          { name: "create", value: "create" },
          { name: "info", value: "info" },
          { name: "leave", value: "leave" },
          { name: "invite", value: "invite" },
          { name: "join", value: "join" },
        ),
    )
    .addStringOption((o) => o.setName("name").setDescription("Guild name"))
    .addUserOption((o) => o.setName("user").setDescription("User to invite")),
  new SlashCommandBuilder()
    .setName("prestige")
    .setDescription("Reset your character for permanent bonuses"),
  new SlashCommandBuilder()
    .setName("achievements")
    .setDescription("View your achievements"),
  new SlashCommandBuilder()
    .setName("pvp")
    .setDescription("Challenge a player to PvP")
    .addUserOption((o) =>
      o.setName("opponent").setDescription("Opponent").setRequired(true),
    ),
  new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("View leaderboards")
    .addStringOption((o) =>
      o
        .setName("type")
        .setDescription("Leaderboard type")
        .setRequired(true)
        .addChoices(
          { name: "overall", value: "overall" },
          { name: "pvp", value: "pvp" },
          { name: "dungeon", value: "dungeon" },
          { name: "prestige", value: "prestige" },
        ),
    ),
  new SlashCommandBuilder()
    .setName("bestow")
    .setDescription("Admin: grant items/levels/element")
    .addUserOption((o) =>
      o.setName("target").setDescription("Target player").setRequired(true),
    )
    .addStringOption((o) =>
      o
        .setName("action")
        .setDescription("Action")
        .setRequired(true)
        .addChoices(
          { name: "setHP", value: "setHP" },
          { name: "setMana", value: "setMana" },
          { name: "addGold", value: "addGold" },
          { name: "addSpell", value: "addSpell" },
          { name: "setElement", value: "setElement" },
          { name: "setLevel", value: "setLevel" },
        ),
    )
    .addIntegerOption((o) => o.setName("value").setDescription("Value"))
    .addStringOption((o) => o.setName("spell").setDescription("Spell name"))
    .addStringOption((o) =>
      o
        .setName("element")
        .setDescription("Element")
        .addChoices(...elementChoices),
    ),
].map((cmd) => cmd.toJSON());

// === AUTO-LOAD COMMANDS FROM ./commands FOLDER ===
const commandsDir = path.join(__dirname, "commands");

if (fs.existsSync(commandsDir)) {
  const commandFiles = fs.readdirSync(commandsDir).filter(f => f.endsWith(".js"));
  for (const file of commandFiles) {
    const { data } = await import(`./commands/${file}`);
    if (data) commands.push(data.toJSON());
    console.log(`✅ Loaded command: ${data.name}`);
  }
}

const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  try {
    if (!CLIENT_ID) throw new Error("CLIENT_ID not set");
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log("✅ Registered slash commands");
  } catch (err) {
    console.error("❌ Failed to register commands:", err);
  }
})();

client.on("interactionCreate", async (interaction) => {
  if (interaction.isButton()) {
    const [action, ...params] = interaction.customId.split("_");

    if (action === "dungeonattack") {
      const userId = interaction.user.id;
      const dungeon = dungeonRuns[userId];
      if (!dungeon)
        return interaction.update({
          content: "Dungeon session expired.",
          components: [],
          embeds: [],
        });

      const player = getPlayer(userId);
      if (!player)
        return interaction.update({
          content: "Player not found.",
          components: [],
          embeds: [],
        });

      const playerStunned =
        player.statusEffects.stun && player.statusEffects.stun.duration > 0;
      const playerFrozen =
        player.statusEffects.freeze && player.statusEffects.freeze.duration > 0;

      if (playerStunned || playerFrozen) {
        if (playerStunned) {
          player.statusEffects.stun.duration--;
        } else {
          player.statusEffects.freeze.duration--;
        }

        const statusMsgs = processStatusEffects(player);
        const embed = new EmbedBuilder()
          .setTitle(playerStunned ? "⚡ Stunned!" : "❄️ Frozen!")
          .setDescription(
            `You are ${playerStunned ? "stunned" : "frozen"} and cannot act!\n${statusMsgs.join("\n")}\n\nEnemy HP: ${dungeon.monster.HP}/${dungeon.monster._maxHP}`,
          )
          .setColor(0xe74c3c);

        const monsterStunned =
          dungeon.monster.statusEffects.stun &&
          dungeon.monster.statusEffects.stun.duration > 0;
        const monsterFrozen =
          dungeon.monster.statusEffects.freeze &&
          dungeon.monster.statusEffects.freeze.duration > 0;

        if (monsterStunned || monsterFrozen) {
          if (monsterStunned) {
            embed.setDescription(
              embed.data.description +
                `\n\n⚡ ${dungeon.monster._name} is stunned and cannot attack!`,
            );
            dungeon.monster.statusEffects.stun.duration--;
          } else {
            embed.setDescription(
              embed.data.description +
                `\n\n❄️ ${dungeon.monster._name} is frozen and cannot attack!`,
            );
            dungeon.monster.statusEffects.freeze.duration--;
          }
        } else {
          const enemyDmg = Math.max(1, dungeon.monster.attack - player.defense);
          player.HP -= enemyDmg;
          if (player.HP < 0) player.HP = 0;
          embed.setDescription(
            embed.data.description +
              `\n\n${dungeon.monster._name} attacks for ${enemyDmg} damage!\nYour HP: ${player.HP}/${player.maxHP}`,
          );
        }

        const monsterStatusMsgs = processStatusEffects(dungeon.monster);
        if (monsterStatusMsgs.length > 0) {
          embed.setDescription(
            embed.data.description + `\n${monsterStatusMsgs.join("\n")}`,
          );
        }

        if (player.HP <= 0) {
          delete dungeonRuns[userId];
          player.HP = Math.floor(player.maxHP * 0.5);
          saveData();
          embed.setTitle("💀 Defeated!");
          embed.setDescription("You were defeated... HP restored to 50%.");
          return interaction.update({ embeds: [embed], components: [] });
        }

        saveData();
        return interaction.update({
          embeds: [embed],
          components: interaction.message.components,
        });
      }

      const spell = params[0] || player.spells[0];
      const cost = getSpellCost(spell);
      let damage = calculateDamage(player, dungeon.monster, spell);

      if (player.Mana < cost) {
        if (player.Mana === 0) damage = Math.floor(damage / 2);
        else {
          const factor = player.Mana / cost;
          damage = Math.floor(damage * factor);
          player.Mana = 0;
        }
      } else {
        player.Mana -= cost;
      }

      let description = "";

      if (damage < 0) {
        const healAmt = -damage;
        applyHealing(player, healAmt);
        description += `You cast **${spell}** and healed **${healAmt} HP**!\n`;
      } else {
        const actualDmg = Math.max(1, damage - dungeon.monster.defense);
        dungeon.monster.HP -= actualDmg;
        if (dungeon.monster.HP < 0) dungeon.monster.HP = 0;
        description += `You cast **${spell}** for **${actualDmg} damage**!\n`;

        if (player._lastCrit)
          description = "💥 **Critical Hit!**\n" + description;

        if (player._lastStatusEffect) {
          applyStatusEffect(dungeon.monster, player._lastStatusEffect);
          description += `✨ Applied ${player._lastStatusEffect}!\n`;
        }

        if (player.element === "Dark") {
          const heal = Math.floor(actualDmg * 0.2);
          applyHealing(player, heal);
          description += `🩸 Life steal healed ${heal} HP!\n`;
        }
      }

      const statusMsgs = processStatusEffects(player);
      if (statusMsgs.length > 0) description += statusMsgs.join("\n") + "\n";

      player.Mana = Math.min(player.Mana + 15, player.maxMana);

      description += `\n**${dungeon.monster._name}**\nHP: ${dungeon.monster.HP}/${dungeon.monster._maxHP}\n`;

      if (dungeon.monster.HP <= 0) {
        player.Gold += dungeon.monster.gold;
        player.EXP += dungeon.monster.exp;
        player.stats.monstersDefeated++;
        if (dungeon.monster._isBoss) {
          player.stats.bossesDefeated++;
          if (player.quests && player.quests.weekly_boss) {
            player.quests.weekly_boss.progress++;
          }
        }

        if (player.quests && player.quests.daily_dungeon) {
          player.quests.daily_dungeon.progress++;
        }

        const leveledUp = tryLevelUp(player);
        checkAchievements(player);

        delete dungeonRuns[userId];
        saveData();

        const embed = new EmbedBuilder()
          .setTitle(`🏆 Victory on Floor ${dungeon.floor}!`)
          .setDescription(
            description +
              `\nYou defeated **${dungeon.monster._name}**!\n+${dungeon.monster.exp} EXP | +${dungeon.monster.gold} Gold${leveledUp ? "\n\n🎉 **Level Up!**" : ""}`,
          )
          .setColor(0x2ecc71)
          .setFooter({
            text: `HP: ${player.HP}/${player.maxHP} | Mana: ${player.Mana}/${player.maxMana}`,
          });

        const nextFloorButton = new ButtonBuilder()
          .setCustomId("nextfloor")
          .setLabel(`Continue to Floor ${dungeon.floor + 1}`)
          .setStyle(ButtonStyle.Primary);
        const leaveButton = new ButtonBuilder()
          .setCustomId("leavedungeon")
          .setLabel("Leave Dungeon")
          .setStyle(ButtonStyle.Danger);

        const row = new ActionRowBuilder().addComponents(
          nextFloorButton,
          leaveButton,
        );
        return interaction.update({ embeds: [embed], components: [row] });
      }

      const monsterStatusMsgs = processStatusEffects(dungeon.monster);
      if (monsterStatusMsgs.length > 0)
        description += monsterStatusMsgs.join("\n") + "\n";

      const monsterStunned =
        dungeon.monster.statusEffects.stun &&
        dungeon.monster.statusEffects.stun.duration > 0;
      const monsterFrozen =
        dungeon.monster.statusEffects.freeze &&
        dungeon.monster.statusEffects.freeze.duration > 0;

      if (monsterStunned || monsterFrozen) {
        if (monsterStunned) {
          description += `\n⚡ ${dungeon.monster._name} is stunned and cannot attack!`;
          dungeon.monster.statusEffects.stun.duration--;
        } else {
          description += `\n❄️ ${dungeon.monster._name} is frozen and cannot attack!`;
          dungeon.monster.statusEffects.freeze.duration--;
        }
      } else {
        const enemyDmg = Math.max(1, dungeon.monster.attack - player.defense);
        player.HP -= enemyDmg;
        if (player.HP < 0) player.HP = 0;
        description += `\n${dungeon.monster._name} attacks for **${enemyDmg} damage**!`;
      }

      const embed = new EmbedBuilder()
        .setTitle(`⚔️ Floor ${dungeon.floor}: ${dungeon.monster._name}`)
        .setDescription(description)
        .setColor(0x3498db)
        .setFooter({
          text: `HP: ${player.HP}/${player.maxHP} | Mana: ${player.Mana}/${player.maxMana}`,
        });

      if (player.HP <= 0) {
        delete dungeonRuns[userId];
        player.HP = Math.floor(player.maxHP * 0.5);
        saveData();
        embed.setTitle("💀 Defeated!");
        embed.setDescription("You were defeated... HP restored to 50%.");
        return interaction.update({ embeds: [embed], components: [] });
      }

      saveData();
      return interaction.update({
        embeds: [embed],
        components: interaction.message.components,
      });
    }

    if (action === "nextfloor") {
      const userId = interaction.user.id;
      const player = getPlayer(userId);
      if (!player)
        return interaction.update({
          content: "Player not found.",
          components: [],
          embeds: [],
        });

      const dungeon = dungeonRuns[userId] || {};
      const nextFloor = (dungeon.floor || player.dungeonFloor) + 1;
      player.dungeonFloor = Math.max(player.dungeonFloor, nextFloor);

      const monster = generateDungeonEncounter(nextFloor);
      monster._maxHP = monster.HP;
      dungeonRuns[userId] = { floor: nextFloor, monster };

      const embed = new EmbedBuilder()
        .setTitle(
          `🗡️ Floor ${nextFloor}: ${monster._name} ${monster._isBoss ? "(BOSS)" : ""}`,
        )
        .setDescription(
          `A wild **${monster._name}** appears!\nHP: ${monster.HP} | Attack: ${monster.attack} | Defense: ${monster.defense}`,
        )
        .setColor(monster._isBoss ? 0xe74c3c : 0x3498db)
        .setFooter({
          text: `Your HP: ${player.HP}/${player.maxHP} | Mana: ${player.Mana}/${player.maxMana}`,
        });

      const buttons = player.spells
        .slice(0, 5)
        .map((spell) =>
          new ButtonBuilder()
            .setCustomId(`dungeonattack_${spell}`)
            .setLabel(spell)
            .setStyle(ButtonStyle.Primary),
        );

      const rows = [];
      for (let i = 0; i < buttons.length; i += 5) {
        rows.push(
          new ActionRowBuilder().addComponents(buttons.slice(i, i + 5)),
        );
      }

      saveData();
      return interaction.update({ embeds: [embed], components: rows });
    }

    if (action === "leavedungeon") {
      delete dungeonRuns[interaction.user.id];
      return interaction.update({
        content: "You left the dungeon safely.",
        components: [],
        embeds: [],
      });
    }

    if (action === "buyitem") {
      const itemName = params.join("_").replace(/_/g, " ");
      const player = getPlayer(interaction.user.id);
      if (!player)
        return interaction.update({
          content: "Player not found.",
          components: [],
          embeds: [],
        });

      const item = itemDatabase[itemName];
      if (!item)
        return interaction.update({
          content: "Item not found.",
          components: interaction.message.components,
          embeds: interaction.message.embeds,
        });

      if (player.Gold < item.cost) {
        return interaction.update({
          content: `Not enough gold! Need ${item.cost} gold.`,
          components: interaction.message.components,
          embeds: interaction.message.embeds,
        });
      }

      player.Gold -= item.cost;
      if (!player.inventory[itemName]) player.inventory[itemName] = 0;
      player.inventory[itemName]++;
      saveData();

      return interaction.update({
        content: `✅ Purchased **${itemName}** for ${item.cost} gold!`,
        components: interaction.message.components,
        embeds: interaction.message.embeds,
      });
    }
  }

  if (interaction.isStringSelectMenu()) {
    if (interaction.customId === "start_select") {
      const chosen = interaction.values[0];
      const userId = interaction.user.id;

      if (players[userId]) {
        return interaction.update({
          content: "You have already started!",
          components: [],
          embeds: [],
        });
      }

      if (chosen === "Divine" && interaction.user.id !== OWNER_ID) {
        return interaction.update({
          content: "Divine element is owner-only.",
          components: [],
          embeds: [],
        });
      }

      createPlayer(userId, interaction.user.username, chosen);
      const player = getPlayer(userId);
      player.quests = generateQuests();
      saveData();

      const embed = new EmbedBuilder()
        .setTitle("🪄 Adventure Begins!")
        .setDescription(
          `Welcome, ${interaction.user.username}!\n\n**Element:** ${chosen}\n**Passive:** ${passives[chosen]}\n**Starting Spells:** ${player.spells.join(", ")}\n\nUse \`/dungeon\` to start your journey!`,
        )
        .setColor(0x3498db);

      return interaction.update({ embeds: [embed], components: [] });
    }

    if (interaction.customId.startsWith("pvp_select_")) {
      const parts = interaction.customId.split("_");
      const targetId = parts[2];
      const player = getPlayer(interaction.user.id);
      const targetPlayer = getPlayer(targetId);

      if (!player || !targetPlayer) {
        return interaction.update({
          content: "Player not found.",
          components: [],
          embeds: [],
        });
      }

      const idsSorted = [interaction.user.id, targetId].sort();
      const battleId = `${idsSorted[0]}_${idsSorted[1]}`;

      if (!battles[battleId]) {
        let order = [idsSorted[0], idsSorted[1]];
        const pA = getPlayer(idsSorted[0]);
        const pB = getPlayer(idsSorted[1]);

        if (pA.element === "Light" && pB.element !== "Light")
          order = [idsSorted[0], idsSorted[1]];
        else if (pB.element === "Light" && pA.element !== "Light")
          order = [idsSorted[1], idsSorted[0]];
        else
          order =
            Math.random() < 0.5
              ? [idsSorted[0], idsSorted[1]]
              : [idsSorted[1], idsSorted[0]];

        battles[battleId] = { players: order, turn: 0 };
      }

      const battle = battles[battleId];
      if (battle.players[battle.turn] !== interaction.user.id) {
        return interaction.update({
          content: "Not your turn!",
          components: interaction.message.components,
          embeds: [],
        });
      }

      const playerStunned =
        player.statusEffects.stun && player.statusEffects.stun.duration > 0;
      const playerFrozen =
        player.statusEffects.freeze && player.statusEffects.freeze.duration > 0;

      if (playerStunned || playerFrozen) {
        if (playerStunned) {
          player.statusEffects.stun.duration--;
        } else {
          player.statusEffects.freeze.duration--;
        }

        const statusMsgs = processStatusEffects(player);
        battle.turn = (battle.turn + 1) % 2;

        const embed = new EmbedBuilder()
          .setTitle(playerStunned ? "⚡ Stunned!" : "❄️ Frozen!")
          .setDescription(
            `${player.username} is ${playerStunned ? "stunned" : "frozen"}!\n${statusMsgs.join("\n")}\n\n${player.username}: ${player.HP}/${player.maxHP}\n${targetPlayer.username}: ${targetPlayer.HP}/${targetPlayer.maxHP}`,
          )
          .setColor(0xe74c3c);

        saveData();
        return interaction.update({
          embeds: [embed],
          components: interaction.message.components,
        });
      }

      const spell = interaction.values[0];
      const cost = getSpellCost(spell);
      let damage = calculateDamage(player, targetPlayer, spell);

      if (player.Mana < cost) {
        if (player.Mana === 0) damage = Math.floor(damage / 2);
        else {
          const factor = player.Mana / cost;
          damage = Math.floor(damage * factor);
          player.Mana = 0;
        }
      } else {
        player.Mana -= cost;
      }

      let description = "";

      if (damage < 0) {
        const healAmt = -damage;
        applyHealing(player, healAmt);
        description += `${player.username} cast **${spell}** and healed **${healAmt} HP**!\n`;
      } else {
        const actualDmg = applyDamageToPlayer(targetPlayer, damage);
        description += `${player.username} cast **${spell}** for **${actualDmg} damage**!\n`;

        if (player._lastCrit)
          description = "💥 **Critical Hit!**\n" + description;

        if (player._lastStatusEffect) {
          applyStatusEffect(targetPlayer, player._lastStatusEffect);
          description += `✨ Applied ${player._lastStatusEffect} to ${targetPlayer.username}!\n`;
        }

        if (player.element === "Dark") {
          const heal = Math.floor(actualDmg * 0.2);
          applyHealing(player, heal);
          description += `🩸 ${player.username} stole ${heal} HP!\n`;
        }
      }

      const statusMsgs = processStatusEffects(player);
      const targetStatusMsgs = processStatusEffects(targetPlayer);
      if (statusMsgs.length > 0) description += statusMsgs.join("\n") + "\n";
      if (targetStatusMsgs.length > 0)
        description += targetStatusMsgs.join("\n") + "\n";

      player.Mana = Math.min(player.Mana + 10, player.maxMana);

      description += `\n${player.username}: ${player.HP}/${player.maxHP} | Mana: ${player.Mana}/${player.maxMana}\n${targetPlayer.username}: ${targetPlayer.HP}/${targetPlayer.maxHP} | Mana: ${targetPlayer.Mana}/${targetPlayer.maxMana}`;

      const embed = new EmbedBuilder()
        .setTitle("⚔️ PvP Battle")
        .setDescription(description)
        .setColor(0x9b59b6);

      if (player.HP <= 0 || targetPlayer.HP <= 0) {
        const winner = player.HP > 0 ? player : targetPlayer;
        const loser = player.HP > 0 ? targetPlayer : player;

        winner.pvpPoints += 50;
        winner.Gold += 100;
        winner.stats.pvpWins++;
        loser.stats.pvpLosses++;

        if (winner.quests && winner.quests.daily_pvp) {
          winner.quests.daily_pvp.progress++;
        }

        if (
          !winner.achievements.includes("first_blood") &&
          winner.stats.pvpWins === 1
        ) {
          winner.achievements.push("first_blood");
          winner.Gold += achievements.first_blood.reward.gold;
        }

        delete battles[battleId];
        saveData();

        embed.setTitle("🏆 Battle Over!");
        embed.setDescription(
          `${winner.username} wins!\n+50 PvP Points | +100 Gold`,
        );
        return interaction.update({ embeds: [embed], components: [] });
      }

      battle.turn = (battle.turn + 1) % 2;
      const nextPlayer = getPlayer(battle.players[battle.turn]);
      embed.setFooter({ text: `Next turn: ${nextPlayer.username}` });

      saveData();
      return interaction.update({
        embeds: [embed],
        components: interaction.message.components,
      });
    }
  }

  if (!interaction.isChatInputCommand()) return;

  const { commandName, user } = interaction;

  if (commandName === "start") {
    if (players[user.id]) {
      return interaction.reply({
        content: "You already started!",
        ephemeral: true,
      });
    }

    const options = Object.keys(elementSpells)
      .map((e) => {
        if (e === "Divine" && user.id !== OWNER_ID) return null;
        return { label: e, value: e, description: passives[e] };
      })
      .filter(Boolean);

    const row = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("start_select")
        .setPlaceholder("Choose your element")
        .addOptions(
          options.map((o) =>
            new StringSelectMenuOptionBuilder()
              .setLabel(o.label)
              .setValue(o.value)
              .setDescription(o.description),
          ),
        ),
    );

    return interaction.reply({
      content: "Choose your starting element:",
      components: [row],
      ephemeral: true,
    });
  }

  if (commandName === "profile") {
    const player = getPlayer(user.id);
    if (!player)
      return interaction.reply({
        content: "Use /start first!",
        ephemeral: true,
      });

    recalculateStats(player);

    const embed = new EmbedBuilder()
      .setTitle(`📊 ${player.username}'s Profile`)
      .setDescription(
        `**Element:** ${player.element}\n**Level:** ${player.Level} | **Prestige:** ${player.prestige}\n**HP:** ${player.HP}/${player.maxHP}\n**Mana:** ${player.Mana}/${player.maxMana}\n**Attack:** ${player.attack} | **Defense:** ${player.defense}\n**Gold:** ${player.Gold} | **EXP:** ${player.EXP}/${player.Level * 100}\n\n**Spells:** ${player.spells.join(", ")}\n**Passive:** ${player.passive}\n\n**Equipment:**\nWeapon: ${player.equipment.weapon || "None"}\nArmor: ${player.equipment.armor || "None"}\nAccessory: ${player.equipment.accessory || "None"}\n\n**Stats:**\nPvP Wins: ${player.stats.pvpWins} | Losses: ${player.stats.pvpLosses}\nMonsters Defeated: ${player.stats.monstersDefeated}\nBosses Defeated: ${player.stats.bossesDefeated}\nHighest Floor: ${player.dungeonFloor}`,
      )
      .setColor(0x3498db);

    return interaction.reply({ embeds: [embed] });
  }

  if (commandName === "dungeon") {
    const player = getPlayer(user.id);
    if (!player)
      return interaction.reply({
        content: "Use /start first!",
        ephemeral: true,
      });

    const floor = player.dungeonFloor;
    const monster = generateDungeonEncounter(floor);
    monster._maxHP = monster.HP;
    dungeonRuns[user.id] = { floor, monster };

    const embed = new EmbedBuilder()
      .setTitle(
        `🗡️ Floor ${floor}: ${monster._name} ${monster._isBoss ? "(BOSS)" : ""}`,
      )
      .setDescription(
        `A wild **${monster._name}** appears!\nHP: ${monster.HP} | Attack: ${monster.attack} | Defense: ${monster.defense}`,
      )
      .setColor(monster._isBoss ? 0xe74c3c : 0x3498db)
      .setFooter({
        text: `Your HP: ${player.HP}/${player.maxHP} | Mana: ${player.Mana}/${player.maxMana}`,
      });

    const buttons = player.spells
      .slice(0, 5)
      .map((spell) =>
        new ButtonBuilder()
          .setCustomId(`dungeonattack_${spell}`)
          .setLabel(spell)
          .setStyle(ButtonStyle.Primary),
      );

    const rows = [];
    for (let i = 0; i < buttons.length; i += 5) {
      rows.push(new ActionRowBuilder().addComponents(buttons.slice(i, i + 5)));
    }

    return interaction.reply({ embeds: [embed], components: rows });
  }

  if (commandName === "inventory") {
    const player = getPlayer(user.id);
    if (!player)
      return interaction.reply({
        content: "Use /start first!",
        ephemeral: true,
      });

    let invText = "";
    Object.keys(player.inventory).forEach((item) => {
      if (player.inventory[item] > 0) {
        invText += `${item} x${player.inventory[item]}\n`;
      }
    });

    if (!invText) invText = "Your inventory is empty.";

    const embed = new EmbedBuilder()
      .setTitle("🎒 Inventory")
      .setDescription(invText)
      .setColor(0xf39c12);

    return interaction.reply({ embeds: [embed] });
  }

  if (commandName === "shop") {
    const items = Object.keys(itemDatabase).slice(0, 25);
    const embed = new EmbedBuilder()
      .setTitle("🏪 Item Shop")
      .setDescription("Click a button to purchase an item:")
      .setColor(0xf39c12);

    items.forEach((itemName) => {
      const item = itemDatabase[itemName];
      embed.addFields({
        name: itemName,
        value: `${item.desc} - **${item.cost} Gold**`,
        inline: true,
      });
    });

    const buttons = items.slice(0, 5).map((itemName) =>
      new ButtonBuilder()
        .setCustomId(`buyitem_${itemName.replace(/ /g, "_")}`)
        .setLabel(`${itemName} (${itemDatabase[itemName].cost}g)`)
        .setStyle(ButtonStyle.Success),
    );

    const rows = [];
    for (let i = 0; i < buttons.length; i += 5) {
      rows.push(new ActionRowBuilder().addComponents(buttons.slice(i, i + 5)));
    }

    return interaction.reply({ embeds: [embed], components: rows });
  }

  if (commandName === "equip") {
    const player = getPlayer(user.id);
    if (!player)
      return interaction.reply({
        content: "Use /start first!",
        ephemeral: true,
      });

    const itemName = interaction.options.getString("item");
    const slot = interaction.options.getString("slot");

    if (!player.inventory[itemName] || player.inventory[itemName] === 0) {
      return interaction.reply({
        content: "You don't have that item!",
        ephemeral: true,
      });
    }

    const item = itemDatabase[itemName];
    if (!item)
      return interaction.reply({ content: "Item not found!", ephemeral: true });

    if (item.type !== slot) {
      return interaction.reply({
        content: `${itemName} cannot be equipped in ${slot} slot!`,
        ephemeral: true,
      });
    }

    if (player.equipment[slot]) {
      if (!player.inventory[player.equipment[slot]])
        player.inventory[player.equipment[slot]] = 0;
      player.inventory[player.equipment[slot]]++;
    }

    player.equipment[slot] = itemName;
    player.inventory[itemName]--;

    recalculateStats(player);
    saveData();

    return interaction.reply({
      content: `✅ Equipped **${itemName}** in ${slot} slot!`,
    });
  }

  if (commandName === "use") {
    const player = getPlayer(user.id);
    if (!player)
      return interaction.reply({
        content: "Use /start first!",
        ephemeral: true,
      });

    const itemName = interaction.options.getString("item");

    if (!player.inventory[itemName] || player.inventory[itemName] === 0) {
      return interaction.reply({
        content: "You don't have that item!",
        ephemeral: true,
      });
    }

    const item = itemDatabase[itemName];
    if (!item || item.type !== "consumable") {
      return interaction.reply({
        content: "That item cannot be used!",
        ephemeral: true,
      });
    }

    player.inventory[itemName]--;

    if (item.effect.HP) {
      applyHealing(player, item.effect.HP);
    }
    if (item.effect.Mana) {
      player.Mana = Math.min(player.Mana + item.effect.Mana, player.maxMana);
    }

    saveData();

    return interaction.reply({
      content: `✅ Used **${itemName}**! ${item.effect.HP ? `+${item.effect.HP} HP` : ""} ${item.effect.Mana ? `+${item.effect.Mana} Mana` : ""}`,
    });
  }

  if (commandName === "quest") {
    const player = getPlayer(user.id);
    if (!player)
      return interaction.reply({
        content: "Use /start first!",
        ephemeral: true,
      });

    if (!player.quests || Object.keys(player.quests).length === 0) {
      player.quests = generateQuests();
      saveData();
    }

    let questText = "";
    Object.keys(player.quests).forEach((qid) => {
      const quest = player.quests[qid];
      const complete = quest.progress >= quest.goal;
      questText += `${complete ? "✅" : "⏳"} **${quest.desc}**\nProgress: ${quest.progress}/${quest.goal}\nReward: ${quest.reward.gold}g, ${quest.reward.exp} EXP\n\n`;

      if (complete && !quest.claimed) {
        player.Gold += quest.reward.gold;
        player.EXP += quest.reward.exp;
        tryLevelUp(player);
        quest.claimed = true;
        saveData();
      }
    });

    const embed = new EmbedBuilder()
      .setTitle("📜 Quests")
      .setDescription(questText || "No quests available.")
      .setColor(0xe67e22);

    return interaction.reply({ embeds: [embed] });
  }

  if (commandName === "guild") {
    const player = getPlayer(user.id);
    if (!player)
      return interaction.reply({
        content: "Use /start first!",
        ephemeral: true,
      });

    const action = interaction.options.getString("action");

    if (action === "create") {
      const name = interaction.options.getString("name");
      if (!name)
        return interaction.reply({
          content: "Provide a guild name!",
          ephemeral: true,
        });
      if (player.guildId)
        return interaction.reply({
          content: "You are already in a guild!",
          ephemeral: true,
        });
      if (player.Gold < 500)
        return interaction.reply({
          content: "Need 500 gold to create a guild!",
          ephemeral: true,
        });

      const guildId = `guild_${Date.now()}`;
      guilds[guildId] = {
        name,
        leader: user.id,
        members: [user.id],
        gold: 0,
        level: 1,
      };
      player.guildId = guildId;
      player.Gold -= 500;
      saveData();

      return interaction.reply({ content: `✅ Created guild **${name}**!` });
    }

    if (action === "info") {
      if (!player.guildId)
        return interaction.reply({
          content: "You are not in a guild!",
          ephemeral: true,
        });
      const guild = guilds[player.guildId];
      if (!guild)
        return interaction.reply({
          content: "Guild not found!",
          ephemeral: true,
        });

      const memberNames = guild.members
        .map((id) => players[id]?.username || "Unknown")
        .join(", ");

      const embed = new EmbedBuilder()
        .setTitle(`🏰 ${guild.name}`)
        .setDescription(
          `**Level:** ${guild.level}\n**Gold:** ${guild.gold}\n**Members:** ${memberNames}`,
        )
        .setColor(0x9b59b6);

      return interaction.reply({ embeds: [embed] });
    }

    if (action === "leave") {
      if (!player.guildId)
        return interaction.reply({
          content: "You are not in a guild!",
          ephemeral: true,
        });
      const guild = guilds[player.guildId];
      if (guild.leader === user.id) {
        delete guilds[player.guildId];
        guild.members.forEach((id) => {
          if (players[id]) players[id].guildId = null;
        });
      } else {
        guild.members = guild.members.filter((id) => id !== user.id);
      }
      player.guildId = null;
      saveData();

      return interaction.reply({ content: "Left the guild." });
    }

    return interaction.reply({
      content: "Guild system active! Use create/info/leave actions.",
      ephemeral: true,
    });
  }

  if (commandName === "prestige") {
    const player = getPlayer(user.id);
    if (!player)
      return interaction.reply({
        content: "Use /start first!",
        ephemeral: true,
      });

    if (player.Level < 50) {
      return interaction.reply({
        content: "You must be level 50 to prestige!",
        ephemeral: true,
      });
    }

    player.prestige++;
    player.Level = 1;
    player.EXP = 0;
    player.Gold = 0;
    player.dungeonFloor = 1;
    player.spells = elementSpells[player.element].slice(0, 2);

    recalculateStats(player);
    player.HP = player.maxHP;
    player.Mana = player.maxMana;

    checkAchievements(player);
    saveData();

    return interaction.reply({
      content: `🌟 You have prestiged! Prestige level: ${player.prestige}\nYou gained permanent stat bonuses!`,
    });
  }

  if (commandName === "achievements") {
    const player = getPlayer(user.id);
    if (!player)
      return interaction.reply({
        content: "Use /start first!",
        ephemeral: true,
      });

    let achText = "";
    Object.keys(achievements).forEach((id) => {
      const ach = achievements[id];
      const unlocked = player.achievements.includes(id);
      achText += `${unlocked ? "🏆" : "🔒"} **${ach.name}**\n${ach.desc}\n\n`;
    });

    const embed = new EmbedBuilder()
      .setTitle("🏆 Achievements")
      .setDescription(achText)
      .setColor(0xf1c40f);

    return interaction.reply({ embeds: [embed] });
  }

  if (commandName === "pvp") {
    const player = getPlayer(user.id);
    if (!player)
      return interaction.reply({
        content: "Use /start first!",
        ephemeral: true,
      });

    const opponent = interaction.options.getUser("opponent");
    const opponentPlayer = getPlayer(opponent.id);
    if (!opponentPlayer)
      return interaction.reply({
        content: "Opponent has not started yet!",
        ephemeral: true,
      });

    const row = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`pvp_select_${opponent.id}`)
        .setPlaceholder("Choose your spell")
        .addOptions(
          player.spells.slice(0, 25).map((spell) =>
            new StringSelectMenuOptionBuilder()
              .setLabel(spell)
              .setValue(spell)
              .setDescription(`Cost: ${getSpellCost(spell)} Mana`),
          ),
        ),
    );

    return interaction.reply({
      content: `⚔️ PvP Battle: ${player.username} vs ${opponentPlayer.username}!\n${player.username}, choose your spell:`,
      components: [row],
    });
  }

  if (commandName === "leaderboard") {
    const type = interaction.options.getString("type");
    const arr = Object.values(players);
    let sorted = [];

    if (type === "overall") {
      sorted = arr
        .sort((a, b) => {
          const scoreA = a.Level * 100 + a.pvpPoints + a.dungeonFloor * 20;
          const scoreB = b.Level * 100 + b.pvpPoints + b.dungeonFloor * 20;
          return scoreB - scoreA;
        })
        .slice(0, 10);
    } else if (type === "pvp") {
      sorted = arr
        .sort((a, b) => (b.pvpPoints || 0) - (a.pvpPoints || 0))
        .slice(0, 10);
    } else if (type === "dungeon") {
      sorted = arr
        .sort((a, b) => (b.dungeonFloor || 0) - (a.dungeonFloor || 0))
        .slice(0, 10);
    } else {
      sorted = arr
        .sort((a, b) => (b.prestige || 0) - (a.prestige || 0))
        .slice(0, 10);
    }

    const embed = new EmbedBuilder()
      .setTitle(`🏆 Leaderboard: ${type}`)
      .setDescription(
        sorted
          .map(
            (p, i) =>
              `${i + 1}. **${p.username}** - L${p.Level} (${p.element})`,
          )
          .join("\n") || "No players yet",
      )
      .setColor(0xf1c40f);

    return interaction.reply({ embeds: [embed] });
  }

  if (commandName === "bestow") {
    if (user.id !== OWNER_ID) {
      return interaction.reply({ content: "Owner only!", ephemeral: true });
    }

    const target = interaction.options.getUser("target");
    const targetPlayer = getPlayer(target.id);
    if (!targetPlayer)
      return interaction.reply({
        content: "Target not found!",
        ephemeral: true,
      });

    const action = interaction.options.getString("action");
    const value = interaction.options.getInteger("value") || 0;

    switch (action) {
      case "setHP":
        targetPlayer.HP = Math.min(value, targetPlayer.maxHP);
        break;
      case "setMana":
        targetPlayer.Mana = Math.min(value, targetPlayer.maxMana);
        break;
      case "addGold":
        targetPlayer.Gold += value;
        break;
      case "addSpell": {
        const spell = interaction.options.getString("spell");
        if (spell && !targetPlayer.spells.includes(spell)) {
          targetPlayer.spells.push(spell);
        }
        break;
      }
      case "setElement": {
        const element = interaction.options.getString("element");
        if (element && elementSpells[element]) {
          targetPlayer.element = element;
          targetPlayer.spells = elementSpells[element].slice(0, 2);
          targetPlayer.passive = passives[element];
        }
        break;
      }
      case "setLevel":
        if (value > 0) {
          targetPlayer.Level = value;
          recalculateStats(targetPlayer);
        }
        break;
      default:
        return interaction.reply({
          content: "Unknown action!",
          ephemeral: true,
        });
    }

    saveData();
    return interaction.reply({
      content: `✅ Applied **${action}** to ${target.username}.`,
      ephemeral: true,
    });
  }
});

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

client
  .login(TOKEN)
  .then(() => console.log("✅ Bot online!"))
  .catch((err) => console.error("❌ Login failed:", err));

setInterval(saveData, 60000);

process.on("SIGINT", () => {
  console.log("Saving data...");
  saveData();
  server.close();
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("Saving data...");
  saveData();
  server.close();
  process.exit(0);
});
