// src/commands/profile.js
import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { loadDatabase } from '../utils/database.js';

export const data = new SlashCommandBuilder()
  .setName('profile')
  .setDescription('View your mage profile.');

export async function execute(interaction) {
  const db = await loadDatabase();
  const userId = interaction.user.id;

  const player = db[userId];
  if (!player) {
    return interaction.reply({ content: "You haven't started your adventure yet! Use /start.", ephemeral: true });
  }

  const embed = new EmbedBuilder()
    .setTitle(`${player.username}'s Profile`)
    .addFields(
      { name: 'Element', value: player.element, inline: true },
      { name: 'HP', value: `${player.HP} / ${player.maxHP}`, inline: true },
      { name: 'Mana', value: `${player.Mana} / ${player.maxMana}`, inline: true },
      { name: 'Attack', value: `${player.attack}`, inline: true },
      { name: 'Defense', value: `${player.defense}`, inline: true },
      { name: 'Rank', value: player.Rank, inline: true },
      { name: 'Gold', value: `${player.Gold}`, inline: true },
      { name: 'Spells', value: Object.keys(player.spells).join(', ') || 'None' }
    )
    .setColor('Purple')
    .setTimestamp();

  await interaction.reply({ embeds: [embed], ephemeral: true });
}
