// src/commands/pvp.js
import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js';
import { getUser, updateUser } from '../utils/database.js';
import { SPELL_DATA, ELEMENTS } from '../utils/constants.js';

export const data = new SlashCommandBuilder()
  .setName('pvp')
  .setDescription('Challenge another player to a PvP duel!')
  .addUserOption(option =>
    option.setName('target')
      .setDescription('The player you want to duel')
      .setRequired(true)
  );

export const execute = async (interaction) => {
  const attackerId = interaction.user.id;
  const targetUser = interaction.options.getUser('target');
  const defenderId = targetUser.id;

  if (attackerId === defenderId) return interaction.reply({ content: "You can't duel yourself!", ephemeral: true });

  const attacker = getUser(attackerId);
  const defender = getUser(defenderId);

  if (!attacker || !defender) return interaction.reply({ content: 'Both players must have a profile to duel.', ephemeral: true });

  // Clone HP/Mana so we don't directly modify original until battle ends
  let atkHP = attacker.HP, atkMana = attacker.Mana;
  let defHP = defender.HP, defMana = defender.Mana;

  const battleLog = [];

  const elementMultiplier = (attackerElem, defenderElem) => {
    // Simple elemental system: Fire > Wind > Earth > Water > Fire
    if ((attackerElem === 'Fire' && defenderElem === 'Wind') ||
        (attackerElem === 'Wind' && defenderElem === 'Earth') ||
        (attackerElem === 'Earth' && defenderElem === 'Water') ||
        (attackerElem === 'Water' && defenderElem === 'Fire')) {
      return 1.5; // strong
    } else if ((defenderElem === 'Fire' && attackerElem === 'Wind') ||
               (defenderElem === 'Wind' && attackerElem === 'Earth') ||
               (defenderElem === 'Earth' && attackerElem === 'Water') ||
               (defenderElem === 'Water' && attackerElem === 'Fire')) {
      return 0.75; // weak
    }
    return 1; // neutral
  };

  const calculateDamage = (attacker, defender, useSpell = null) => {
    let baseAttack = attacker.attack;
    let manaCost = 0;
    let spellName = null;

    if (useSpell) {
      const spell = SPELL_DATA[useSpell];
      if (!spell || attacker.Mana < spell.manaCost) return { damage: 0, spellName: null, manaCost: 0 };
      baseAttack *= spell.basePower;
      manaCost = spell.manaCost;
      spellName = spell.name;
    }

    const mult = elementMultiplier(attacker.element, defender.element);
    const variance = 0.85 + Math.random() * 0.3; // 85%–115%
    const damage = Math.max(0, Math.round((baseAttack - defender.defense) * mult * variance));
    return { damage, spellName, manaCost };
  };

  // Turn-based loop
  let turn = 0; // 0 = attacker, 1 = defender
  while (atkHP > 0 && defHP > 0 && battleLog.length < 20) { // max 20 turns
    if (turn === 0) {
      // Attacker turn
      const { damage, spellName, manaCost } = calculateDamage(attacker, defender, null); // For now normal attack
      defHP -= damage;
      atkMana -= manaCost;
      battleLog.push(`${attacker.username} attacks ${defender.username}${spellName ? ` with ${spellName}` : ''} for **${damage}** damage!`);
      turn = 1;
    } else {
      // Defender turn
      const { damage, spellName, manaCost } = calculateDamage(defender, attacker, null);
      atkHP -= damage;
      defMana -= manaCost;
      battleLog.push(`${defender.username} attacks ${attacker.username}${spellName ? ` with ${spellName}` : ''} for **${damage}** damage!`);
      turn = 0;
    }
  }

  // Determine winner
  let winner, loser;
  if (atkHP <= 0 && defHP <= 0) {
    winner = null;
    battleLog.push("It's a draw!");
  } else if (atkHP > 0) {
    winner = attacker;
    loser = defender;
  } else {
    winner = defender;
    loser = attacker;
  }

  // Reward winner
  if (winner) {
    const goldReward = Math.floor(Math.random() * 50) + 50;
    winner.Gold += goldReward;
    updateUser(winner.id, winner);
    battleLog.push(`${winner.username} wins and earns **${goldReward} Gold**!`);
  }

  // Update HP/Mana
  attacker.HP = atkHP > 0 ? atkHP : 1;
  attacker.Mana = atkMana > 0 ? atkMana : 0;
  defender.HP = defHP > 0 ? defHP : 1;
  defender.Mana = defMana > 0 ? defMana : 0;
  updateUser(attacker.id, attacker);
  updateUser(defender.id, defender);

  // Send embed
  const embed = new EmbedBuilder()
    .setTitle('PvP Battle')
    .setDescription(battleLog.join('\n'))
    .setColor('Random');

  await interaction.reply({ embeds: [embed] });
};
