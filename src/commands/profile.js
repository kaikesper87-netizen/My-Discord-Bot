// src/commands/profile.js
import { SlashCommandBuilder } from '@discordjs/builders';
import { MessageEmbed } from 'discord.js';
import { getPlayer } from '../utils/database.js';

export const data = new SlashCommandBuilder()
  .setName('profile')
  .setDescription('View your RPG profile');

export const execute = async (interaction) => {
  const userId = interaction.user.id;
  const player = getPlayer(userId);

  if (!player) {
    return interaction.reply({ content: 'You have not started your journey yet! Use /start first.', ephemeral: true });
  }

  const embed = new MessageEmbed()
    .setTitle(`${player.username}'s Profile`)
    .addFields(
      { name: 'Element', value: player.element, inline: true },
      { name: 'Rank', value: player.Rank, inline: true },
      { name: 'HP', value: `${player.HP} / ${player.maxHP}`, inline: true },
      { name: 'Mana', value: `${player.Mana} / ${player.maxMana}`, inline: true },
      { name: 'Attack', value: player.attack.toString(), inline: true },
      { name: 'Defense', value: player.defense.toString(), inline: true },
      { name: 'Gold', value: player.gold.toString(), inline: true },
      { name: 'Spells', value: player.spells.length > 0 ? player.spells.join(', ') : 'None', inline: false }
    )
    .setColor('GREEN');

  await interaction.reply({ embeds: [embed], ephemeral: true });
};
