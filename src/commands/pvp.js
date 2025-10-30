// src/commands/pvp.js
import { SlashCommandBuilder } from 'discord.js';
import { getPlayer, saveDatabase } from '../utils/database.js';
import { SPELL_DATA } from '../utils/constants.js';

export const data = new SlashCommandBuilder()
  .setName('pvp')
  .setDescription('Challenge another player to a duel.')
  .addUserOption(option =>
    option.setName('target')
      .setDescription('The player you want to fight')
      .setRequired(true)
  );

export async function execute(interaction) {
  const attackerId = interaction.user.id;
  const targetUser = interaction.options.getUser('target');
  const defenderId = targetUser.id;

  // Fetch both players
  const attacker = getPlayer(attackerId);
  const defender = getPlayer(defenderId);

  if (!attacker) return interaction.reply({ content: 'You need to /start first!', ephemeral: true });
  if (!defender) return interaction.reply({ content: 'Target player has not started yet!', ephemeral: true });

  // Simple duel logic
  let battleLog = `⚔️ **${attacker.username}** challenged **${defender.username}**!\n\n`;

  // Each attacks once (for demo simplicity)
  const attackerMove = SPELL_DATA[Object.keys(SPELL_DATA)[0]]; // first spell
  const defenderMove = SPELL_DATA[Object.keys(SPELL_DATA)[1]]; // second spell

  const attackerDamage = Math.floor(attacker.attack * attackerMove.basePower);
  const defenderDamage = Math.floor(defender.attack * defenderMove.basePower);

  defender.HP -= attackerDamage;
  attacker.HP -= defenderDamage;

  battleLog += `${attacker.username} used ${Object.keys(SPELL_DATA)[0]} dealing **${attackerDamage}** damage!\n`;
  battleLog += `${defender.username} used ${Object.keys(SPELL_DATA)[1]} dealing **${defenderDamage}** damage!\n`;

  // Determine outcome
  if (attacker.HP <= 0 && defender.HP <= 0) battleLog += `It's a tie! Both are knocked out!`;
  else if (attacker.HP <= 0) battleLog += `${defender.username} wins the duel!`;
  else if (defender.HP <= 0) battleLog += `${attacker.username} wins the duel!`;
  else battleLog += `Both are still standing!`;

  // Save database
  saveDatabase();

  await interaction.reply({ content: battleLog });
}
