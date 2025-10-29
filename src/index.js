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

// ADDED: Constant for battle and dungeon session timeouts (10 minutes)
const BATTLE_TIMEOUT_MS = 600000;

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

export { itemDatabase };

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
    // FIX: Gave new players base stats to avoid 0 Attack/Defense bug
    attack: 5,
    defense: 5,
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
  // FIX: Recalculate should add base stats to equipment bonuses
  const baseAttack = 5; // Use the same base as in createPlayer
  const baseDefense = 5;
  player.attack = baseAttack + bonus.attack;
  player.defense = baseDefense + bonus.defense;
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
    /ice|frost|blizzard/i.test(spell) && // ADDED Blizzard to Ice spells
    Math.random() < 0.15
  ) {
    attacker._lastStatusEffect = "freeze";
  }
  if (
    attacker.element === "Poison" &&
    /poison|venom|corrupt/i.test(spell) &&
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
    .set
