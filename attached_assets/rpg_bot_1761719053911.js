'use strict';
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  Routes,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  EmbedBuilder
} = require('discord.js');
const { REST } = require('@discordjs/rest');

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const OWNER_ID = process.env.OWNER_ID;

if (!TOKEN) {
  console.error('❌ TOKEN not set in .env');
  process.exit(1);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// ===== Persistence =====
const PLAYERS_FILE = path.join(__dirname, '..', 'players.json');

let players = {};
function loadPlayers() {
  try {
    if (fs.existsSync(PLAYERS_FILE)) {
      const raw = fs.readFileSync(PLAYERS_FILE, 'utf8');
      players = JSON.parse(raw);
      console.log('✅ Loaded players from disk');
    } else {
      players = {};
    }
  } catch (e) {
    console.error('❌ Failed to load players.json:', e);
    players = {};
  }
}

function savePlayers() {
  try {
    fs.writeFileSync(PLAYERS_FILE, JSON.stringify(players, null, 2), 'utf8');
  } catch (e) {
    console.error('❌ Failed to save players.json:', e);
  }
}

loadPlayers();

// ===== Game State =====nlet battles = {}; // in-memory PvP state

// ===== Elements, spells, passives =====nconst elementSpells = {
  Fire: ['Fireball', 'Flame Wave', 'Inferno', 'Heal'],
  Water: ['Water Jet', 'Tsunami', 'Aqua Shield', 'Healing Rain'],
  Wind: ['Wind Slash', 'Gale Force', 'Tornado', 'Haste'],
  Lightning: ['Lightning Bolt', 'Thunder Strike', 'Static Shock', 'Chain'],
  Earth: ['Rock Throw', 'Earthquake', 'Stone Wall', 'Shield Wall'],
  Light: ['Holy Light', 'Radiant Beam', 'Solar Flare', 'Purify'],
  Dark: ['Shadow Bolt', 'Umbral Wave', 'Nightmare', 'Drain'],
  Ice: ['Ice Shard', 'Frost Nova', 'Blizzard', 'Chill Ward'],
  Poison: ['Poison Dart', 'Venom Cloud', 'Corrupt', 'Toxin Trap'],
  Arcane: ['Arcane Missiles', 'Mana Burst', 'Leyline', 'Arcane Shield'],
  Nature: ['Thorn Strike', 'Entangle', 'Regrowth', 'Overgrowth'],
  Metal: ['Iron Fist', 'Metal Barrage', 'Reflective Shield', 'Fortify'],
  Divine: ['Divine Bolt', 'Radiant Judgement', 'Sanctify', 'Aegis of Dawn']
};

const passives = {
  Fire: 'Burn Damage',
  Water: 'Healing Boost',
  Wind: 'Evasion',
  Lightning: 'Chance to stun',
  Earth: 'Bonus HP',
  Light: 'First Strike & Critical',
  Dark: 'Life Steal',
  Ice: 'Freeze Chance',
  Poison: 'Damage over time',
  Arcane: 'Mana Efficiency',
  Nature: 'Natural Regen',
  Metal: 'Armor/Reflect',
  Divine: 'Owner Boon'
};

const spellCosts = {
  Fireball: 15, 'Flame Wave': 10, Inferno: 30, 'Lightning Bolt': 25, 'Wind Slash': 10, Tsunami: 25, 'Water Jet': 10,
  'Rock Throw': 8, Earthquake: 20,
  'Holy Light': 18, 'Radiant Beam': 22, 'Solar Flare': 30, Purify: 20,
  'Shadow Bolt': 18, 'Umbral Wave': 22, Nightmare: 28, Drain: 20,
  'Ice Shard': 12, 'Frost Nova': 18, Blizzard: 26, 'Chill Ward': 15,
  'Poison Dart': 10, 'Venom Cloud': 18, Corrupt: 22, 'Toxin Trap': 12,
  'Arcane Missiles': 12, 'Mana Burst': 20, Leyline: 25, 'Arcane Shield': 15,
  'Thorn Strike': 10, Entangle: 18, Regrowth: 20, Overgrowth: 28,
  'Iron Fist': 12, 'Metal Barrage': 22, 'Reflective Shield': 18, Fortify: 15,
  'Divine Bolt': 20, 'Radiant Judgement': 30, Sanctify: 25, 'Aegis of Dawn': 15
};

function getSpellCost(spell) { return spellCosts[spell] || 10; }

// ===== Helper functions =====nfunction createPlayer(userId, username, element) {
  const baseMax = 100;
  const maxHP = baseMax;
  const maxMana = baseMax;
  players[userId] = {
    username,
    element,
    HP: maxHP,
    Mana: maxMana,
    maxHP,
    maxMana,
    Rank: 'Novice Mage',
    Gold: 0,
    EXP: 0,
    Level: 1,
    spells: (elementSpells[element] || ['Basic Strike']).slice(0, 2),
    passive: passives[element] || 'None',
    cooldowns: {},
    prestige: 0,
    pvpPoints: 0
  };
  savePlayers();
}

function getPlayer(id) { return players[id]; }

function applyHealing(player, amount) { player.HP = Math.min(player.HP + amount, player.maxHP); }
function applyDamageToPlayer(player, dmg) { player.HP -= dmg; if (player.HP < 0) player.HP = 0; }
function manaDamageBonus(mana) { return Math.floor(mana / 5); }

function calculateDamage(attacker, defender, spell) {
  let baseDamage = 20;
  attacker._lastCrit = false; attacker._lastFrozen = false; attacker._lastLifeSteal = 0;
  if (!spell) spell = 'Basic Strike';
  if (/fire/i.test(spell)) baseDamage = 25;
  if (/lightning|thunder/i.test(spell)) baseDamage = 28;
  if (/water|tidal|aqua/i.test(spell)) baseDamage = 18;
  if (/wind|gale|haste/i.test(spell)) baseDamage = 15;
  if (/earth|rock/i.test(spell)) baseDamage = 22;
  if (/heal|regrowth|sanctify|purify/i.test(spell)) baseDamage = -Math.max(10, Math.floor(attacker.maxHP * 0.25));
  if (/ice|frost/i.test(spell)) baseDamage = 18;
  if (/poison|venom/i.test(spell)) baseDamage = 16;
  if (/arcane/i.test(spell)) baseDamage = 20;
  if (/divine|radiant/i.test(spell)) baseDamage = 30;
  if (baseDamage > 0) baseDamage += manaDamageBonus(attacker.Mana);
  if (attacker.element === 'Fire' && attacker.HP <= Math.floor(attacker.maxHP * 0.5) && baseDamage > 0) baseDamage = Math.floor(baseDamage * 1.3);
  if (attacker.element === 'Wind' && attacker.HP <= Math.floor(attacker.maxHP * 0.2) && baseDamage > 0) baseDamage = Math.floor(baseDamage * 1.5);
  if (attacker.element === 'Light' && baseDamage > 0) { if (Math.random() < 0.25) { baseDamage = Math.floor(baseDamage * 1.5); attacker._lastCrit = true; } }
  if (attacker.element === 'Ice' && baseDamage > 0) { if (Math.random() < 0.12) attacker._lastFrozen = true; }
  return baseDamage;
}

function tryLevelUp(player) {
  while (true) {
    const required = 100 * player.Level;
    if (player.EXP < required) break;
    player.EXP -= required;
    player.Level += 1;
    player.maxHP = Math.min(100 + player.Level * 10, 1000);
    player.maxMana = Math.min(100 + player.Level * 10, 1000);
    player.HP = Math.min(player.HP, player.maxHP);
    player.Mana = Math.min(player.Mana, player.maxMana);
  }
  savePlayers();
}

// ===== Commands registration =====nconst elementChoices = Object.keys(elementSpells).filter(e => e !== 'Divine').map(e => ({ name: e, value: e }));
const commands = [
  new SlashCommandBuilder().setName('start').setDescription('Start your RPG journey').toJSON(),
  new SlashCommandBuilder().setName('dungeon').setDescription('Enter a random dungeon').toJSON(),
  new SlashCommandBuilder().setName('bestow').setDescription('Admin: grant items / levels / element')
    .addUserOption(o => o.setName('target').setDescription('Target player').setRequired(true))
    .addStringOption(o => o.setName('action').setDescription('Action').setRequired(true)
      .addChoices(
        { name: 'setHP', value: 'setHP' },
        { name: 'setMana', value: 'setMana' },
        { name: 'addGold', value: 'addGold' },
        { name: 'addSpell', value: 'addSpell' },
        { name: 'setElement', value: 'setElement' },
        { name: 'setLevel', value: 'setLevel' }
      ))
    .addIntegerOption(o => o.setName('value').setDescription('Value (optional)'))
    .addStringOption(o => o.setName('spell').setDescription('Spell to add'))
    .addStringOption(o => o.setName('element').setDescription('Element to set').addChoices(...elementChoices))
    .toJSON(),
  new SlashCommandBuilder().setName('leaderboard').setDescription('View leaderboards')
    .addStringOption(o => o.setName('type').setDescription('Which leaderboard').setRequired(true)
      .addChoices(
        { name: 'overall', value: 'overall' },
        { name: 'pvp', value: 'pvp' },
        { name: 'dungeon', value: 'dungeon' },
        { name: 'prestige', value: 'prestige' }
      )).toJSON()
];

const rest = new REST({ version: '10' }).setToken(TOKEN);
(async () => {
  try {
    if (!CLIENT_ID) throw new Error('CLIENT_ID not set in .env');
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log('✅ Slash commands registered!');
  } catch (err) {
    console.error('❌ Failed to register commands:', err);
  }
})();

// ===== PvP select-menu handler =====nclient.on('interactionCreate', async interaction => {
  if (interaction.isStringSelectMenu() && interaction.customId && interaction.customId.startsWith('pvp_select_')) {
    const parts = interaction.customId.split('_');
    const targetId = parts[2];
    const player = getPlayer(interaction.user.id);
    const targetPlayer = getPlayer(targetId);
    if (!player || !targetPlayer) return interaction.update({ content: 'Error: player not found.', components: interaction.message.components, embeds: [] });
    const idsSorted = [interaction.user.id, targetId].sort();
    const battleId = `${idsSorted[0]}_${idsSorted[1]}`;
    if (!battles[battleId]) {
      const pA = getPlayer(idsSorted[0]);
      const pB = getPlayer(idsSorted[1]);
      let order = [idsSorted[0], idsSorted[1]];
      if ((pA && pA.element === 'Light') && !(pB && pB.element === 'Light')) order = [idsSorted[0], idsSorted[1]];
      else if ((pB && pB.element === 'Light') && !(pA && pA.element === 'Light')) order = [idsSorted[1], idsSorted[0]];
      else if (pA && pA.element === 'Divine' && interaction.user.id === OWNER_ID && !(pB && pB.element === 'Divine')) order = [idsSorted[0], idsSorted[1]];
      else if (pB && pB.element === 'Divine') order = [idsSorted[1], idsSorted[0]];
      else order = Math.random() < 0.5 ? [idsSorted[0], idsSorted[1]] : [idsSorted[1], idsSorted[0]];
      battles[battleId] = { players: order, turn: 0 };
    }
    const battle = battles[battleId];
    if (battle.players[battle.turn] !== interaction.user.id) return interaction.update({ content: "It's not your turn!", components: interaction.message.components, embeds: [] });
    const spell = interaction.values[0];
    const cost = getSpellCost(spell);
    const now = Date.now();
    if (!player.cooldowns) player.cooldowns = {};
    const readyAt = player.cooldowns[spell] || 0;
    if (now < readyAt) return interaction.update({ content: `Spell **${spell}** is on cooldown.`, components: interaction.message.components, embeds: [] });
    let damage;
    if (player.Mana < cost) {
      if (player.Mana === 0) return interaction.update({ content: `Not enough Mana to cast **${spell}**!`, components: interaction.message.components, embeds: [] });
      const factor = player.Mana / cost; player.Mana = 0; damage = Math.floor(calculateDamage(player, targetPlayer, spell) * factor);
    } else { player.Mana -= cost; damage = calculateDamage(player, targetPlayer, spell); player.cooldowns[spell] = now + 3000; }
    let embedDescription = '';
    if (damage < 0) { const healAmt = -damage; applyHealing(player, healAmt); embedDescription += `${player.username} used **${spell}** and healed **${healAmt} HP**!\n`; }
    else { applyDamageToPlayer(targetPlayer, damage); embedDescription += `${player.username} used **${spell}**!\n${targetPlayer.username} took **${damage} damage**!\n`; if (player.element === 'Dark' && damage > 0) { const heal = Math.floor(damage * 0.2); applyHealing(player, heal); player._lastLifeSteal = heal; embedDescription += `${player.username} stole **${heal} HP** from the enemy!\n`; } }
    if (player._lastCrit) embedDescription = '💥 **Critical Hit!**\n' + embedDescription;
    if (player._lastFrozen) embedDescription += `❄️ ${targetPlayer.username} is chilled.\n`;
    let winner = null; if (player.HP <= 0) winner = targetPlayer; if (targetPlayer.HP <= 0) winner = player;
    const embed = new EmbedBuilder().setTitle('⚔️ PvP Battle Turn').setDescription(embedDescription + `${player.username} HP: ${player.HP}/${player.maxHP} | Mana: ${player.Mana}/${player.maxMana}\n${targetPlayer.username} HP: ${targetPlayer.HP}/${targetPlayer.maxHP} | Mana: ${targetPlayer.Mana}/${targetPlayer.maxMana}`).setColor(damage < 0 ? 0x2ecc71 : 0xe74c3c);
    if (winner) { embed.setTitle('🏆 Battle Finished!'); embed.setDescription(`${winner.username} has won the battle! 🎉`); delete battles[battleId]; savePlayers(); return interaction.update({ content: 'Battle ended!', embeds: [embed], components: interaction.message.components }); }
    battle.turn = (battle.turn + 1) % 2; const nextPlayerId = battle.players[battle.turn]; const nextPlayer = getPlayer(nextPlayerId); embed.setFooter({ text: `Next: ${nextPlayer.username}` }); savePlayers(); return interaction.update({ content: 'Move registered!', embeds: [embed], components: interaction.message.components });
  }
  if (interaction.isStringSelectMenu() && interaction.customId === 'start_select') {
    const chosen = interaction.values[0];
    const userId = interaction.user.id;
    if (players[userId]) return interaction.update({ content: 'You have already started!', ephemeral: true, components: [] });
    if (chosen === 'Divine' && interaction.user.id !== OWNER_ID) return interaction.update({ content: 'That element is restricted.', ephemeral: true, components: [] });
    createPlayer(userId, interaction.user.username, chosen);
    const embed = new EmbedBuilder().setTitle('🪄 Player Created!').setDescription(`Welcome, ${interaction.user.username}!\nYour element is **${chosen}**.\nYour journey begins!`).setColor(0x3498db);
    return interaction.update({ embeds: [embed], ephemeral: true, components: [] });
  }
});

const monsters = { Goblin: { HP: 30, damage: 5, exp: 20, gold: 5 }, Orc: { HP: 50, damage: 10, exp: 40, gold: 10 }, Troll: { HP: 80, damage: 15, exp: 70, gold: 20 }, Dragon: { HP: 200, damage: 30, exp: 200, gold: 100 } };

function enterDungeon(userId) { const player = getPlayer(userId); if (!player) return null; const monsterNames = Object.keys(monsters); const monsterName = monsterNames[Math.floor(Math.random() * monsterNames.length)]; const monster = { ...monsters[monsterName] }; monster._name = monsterName; return { player, monster, monsterName }; }

function battleMonster(player, monster, monsterName, spell) { const cost = getSpellCost(spell); let damage = calculateDamage(player, monster, spell); if (player.Mana < cost) { if (player.Mana === 0) damage = Math.floor(damage / 2); else { const factor = player.Mana / cost; damage = Math.floor(damage * factor); player.Mana = 0; } } else { player.Mana -= cost; }
  if (damage < 0) applyHealing(player, -damage); else { monster.HP -= damage; if (monster.HP < 0) monster.HP = 0; if (player.element === 'Dark' && damage > 0) { const heal = Math.floor(damage * 0.2); applyHealing(player, heal); player._lastLifeSteal = heal; } }
  if (monster.HP > 0) { player.HP -= monster.damage; if (player.HP < 0) player.HP = 0; }
  let expGained = 0; let goldGained = 0; if (monster.HP <= 0) { expGained = monsters[monsterName].exp || 10; goldGained = monsters[monsterName].gold || 5; player.Gold += goldGained; player.EXP += expGained; tryLevelUp(player); savePlayers(); }
  player.Mana = Math.min(player.Mana + 10, player.maxMana);
  return { player, monster, damage, expGained, goldGained, isPlayerDead: player.HP <= 0, isMonsterDead: monster.HP <= 0 };
}

client.on('interactionCreate', async interaction => { if (!interaction.isChatInputCommand()) return; const { commandName, user } = interaction; if (commandName === 'dungeon') { const dungeonData = enterDungeon(user.id); if (!dungeonData) return interaction.reply({ content: "You haven't started your journey yet! Use /start.", ephemeral: true }); const { player, monster, monsterName } = dungeonData; const spell = player.spells[Math.floor(Math.random() * player.spells.length)]; const result = battleMonster(player, monster, monsterName, spell); const embed = new EmbedBuilder().setTitle(`🗡️ Dungeon Encounter: ${monsterName}`).setDescription(`You used **${spell}**!\n${monsterName} HP: ${monster.HP}\nYour HP: ${player.HP}/${player.maxHP} | Mana: ${player.Mana}/${player.maxMana}\n${result.isMonsterDead ? `\nYou defeated **${monsterName}**! Gained ${result.expGained} EXP and ${result.goldGained} Gold.` : ''}${result.isPlayerDead ? `\nYou were defeated by **${monsterName}**...` : ''}`).setColor(result.isMonsterDead ? 0x2ecc71 : 0xe74c3c); return interaction.reply({ embeds: [embed] }); }
  if (commandName === 'bestow') { if (user.id !== OWNER_ID) return interaction.reply({ content: 'Only the bot owner can use this command.', ephemeral: true }); const target = interaction.options.getUser('target'); if (!target || !players[target.id]) return interaction.reply({ content: 'Target player not found!', ephemeral: true }); const targetPlayer = getPlayer(target.id); const action = interaction.options.getString('action'); const value = interaction.options.getInteger('value') || 0; switch (action) { case 'setHP': targetPlayer.HP = Math.min(value, targetPlayer.maxHP || 1000); break; case 'setMana': targetPlayer.Mana = Math.min(value, targetPlayer.maxMana || 1000); break; case 'addGold': targetPlayer.Gold += value; break; case 'addSpell': { const spell = interaction.options.getString('spell'); if (spell && !targetPlayer.spells.includes(spell)) targetPlayer.spells.push(spell); break; } case 'setElement': { const element = interaction.options.getString('element'); if (!element || !elementSpells[element]) return interaction.reply({ content: 'Invalid element.', ephemeral: true }); if (element === 'Divine' && user.id !== OWNER_ID) return interaction.reply({ content: 'Divine is owner-only.', ephemeral: true }); targetPlayer.element = element; targetPlayer.spells = elementSpells[element].slice(0, 2); targetPlayer.passive = passives[element]; break; } case 'setLevel': if (value > 0) { targetPlayer.Level = value; targetPlayer.maxHP = Math.min(100 + targetPlayer.Level * 10, 1000); targetPlayer.maxMana = Math.min(100 + targetPlayer.Level * 10, 1000); targetPlayer.HP = Math.min(targetPlayer.HP, targetPlayer.maxHP); targetPlayer.Mana = Math.min(targetPlayer.Mana, targetPlayer.maxMana); } break; default: return interaction.reply({ content: 'Unknown admin action!', ephemeral: true }); } savePlayers(); return interaction.reply({ content: `Admin action **${action}** applied to ${target.username}.`, ephemeral: true }); }
  if (commandName === 'start') { if (players[user.id]) return interaction.reply({ content: 'You have already started your journey!', ephemeral: true }); const options = Object.keys(elementSpells).map(e => { if (e === 'Divine' && user.id !== OWNER_ID) return null; return { label: e, value: e }; }).filter(Boolean); const row = new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId('start_select').setPlaceholder('Choose your element').addOptions(...options.map(o => new StringSelectMenuOptionBuilder().setLabel(o.label).setValue(o.value)))); return interaction.reply({ content: 'Choose your starting element:', components: [row], ephemeral: true }); }
  if (commandName === 'leaderboard') { const type = interaction.options.getString('type'); const arr = Object.values(players); let sorted = []; if (type === 'overall') { sorted = arr.sort((a,b)=>{ const pa=(a.Level*10)+(a.Mana/2)+(a.pvpPoints/5)+((a.dungeonRank||0)*20); const pb=(b.Level*10)+(b.Mana/2)+(b.pvpPoints/5)+((b.dungeonRank||0)*20); return pb-pa; }).slice(0,10); } else if (type==='pvp') sorted = arr.sort((a,b)=> (b.pvpPoints||0)-(a.pvpPoints||0)).slice(0,10); else if (type==='dungeon') sorted = arr.sort((a,b)=> (b.dungeonRank||0)-(a.dungeonRank||0)).slice(0,10); else sorted = arr.sort((a,b)=> (b.prestige||0)-(a.prestige||0)).slice(0,10); const embed = new EmbedBuilder().setTitle(`🏆 Leaderboard: ${type}`).setDescription(sorted.map((p,i)=>`${i+1}. **${p.username}** — L${p.Level} (${p.element}) — Power ${(p.Level*10)+(p.Mana/2)}`).join('\n')).setColor(0xf1c40f); return interaction.reply({ embeds: [embed] }); }
});

client.login(TOKEN).then(()=>console.log('✅ Bot online')).catch(err=>console.error('❌ Failed to login:', err));

setInterval(savePlayers, 30000);
process.on('SIGINT', ()=>{ console.log('Saving players...'); savePlayers(); process.exit(0); });
process.on('SIGTERM', ()=>{ console.log('Saving players...'); savePlayers(); process.exit(0); });