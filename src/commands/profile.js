// src/commands/profile.js
import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getUser } from '../utils/database.js';

export const data = new SlashCommandBuilder()
  .setName('profile')
  .setDescription('View your stats, items, and progression.');

export const execute = async (interaction) => {
  const player = getUser(interaction.user.id);
  if (!player) return interaction.reply({ content: 'Start your adventure first with /start!', ephemeral: true });

  const embed = new EmbedBuilder()
    .setTitle(`${player.username}'s Profile`)
    .setColor('Random')
    .addFields(
      { name: 'Element', value: player.element, inline: true },
      { name: 'HP', value: `${player.HP}/${player.maxHP}`, inline: true },
      { name: 'Mana', value: `${player.Mana}/${player.maxMana}`, inline: true },
      { name: 'Attack', value: `${player.attack}`, inline: true },
      { name: 'Defense', value: `${player.defense}`, inline: true },
      { name: 'Gold', value: `${player.Gold}`, inline: true },
      { name: 'Rank', value: player.Rank, inline: true },
      { name: 'Items', value: player.items.length ? player.items.join(', ') : 'None', inline: false }
    );

  await interaction.reply({ embeds: [embed], ephemeral: true });
};
