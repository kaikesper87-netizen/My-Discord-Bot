// src/commands/pvp.js
import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getPlayer, players, battles, setBattle, deleteBattle } from '../utils/database.js';

export const data = new SlashCommandBuilder()
  .setName('pvp')
  .setDescription('Challenge another player to a duel!')
  .addUserOption(option => option.setName('opponent').setDescription('Choose your opponent').setRequired(true));

export async function execute(interaction) {
  const challengerId = interaction.user.id;
  const opponent = interaction.options.getUser('opponent');
  const opponentId = opponent.id;

  if (!players[challengerId] || !players[opponentId]) {
    return interaction.reply({ content: 'Both players must have started their journey!', ephemeral: true });
  }

  const battleId = `${challengerId}_${opponentId}`;
  setBattle(battleId, { challengerId, opponentId, turn: challengerId });

  const embed = new EmbedBuilder()
    .setTitle('PvP Challenge!')
    .setDescription(`${interaction.user.username} has challenged ${opponent.username} to a duel!`)
    .setColor('Random');

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder().setCustomId(`pvp_accept_${battleId}`).setLabel('Accept').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`pvp_decline_${battleId}`).setLabel('Decline').setStyle(ButtonStyle.Danger)
    );

  await interaction.reply({ embeds: [embed], components: [row] });
}

// Handle PvP buttons
export async function handleComponent(interaction) {
  const [action, type, battleId] = interaction.customId.split('_');
  const battle = battles[battleId];

  if (!battle) return interaction.reply({ content: 'Battle not found!', ephemeral: true });

  if (type === 'accept') {
    await interaction.update({ content: '⚔️ Battle started!', components: [], embeds: [] });
  } else if (type === 'decline') {
    deleteBattle(battleId);
    await interaction.update({ content: '❌ Battle declined.', components: [], embeds: [] });
  }
}
