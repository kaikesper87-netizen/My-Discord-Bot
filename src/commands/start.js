// src/commands/start.js
import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getUser, createUser } from '../utils/database.js';
import { ELEMENTS } from '../utils/constants.js';

export const data = new SlashCommandBuilder()
  .setName('start')
  .setDescription('Begin your magical journey!');

export const execute = async (interaction) => {
  const userId = interaction.user.id;
  if (getUser(userId)) return interaction.reply({ content: 'You have already started!', ephemeral: true });

  const embed = new EmbedBuilder()
    .setTitle('Choose Your Element 🌟')
    .setDescription('Select one of the elements below to begin your adventure!')
    .setColor('Random');

  const row = new ActionRowBuilder().addComponents(
    ...ELEMENTS.slice(0, 5).map((el) =>
      new ButtonBuilder().setCustomId(`element_${el}`).setLabel(el).setStyle(ButtonStyle.Primary)
    )
  );

  const msg = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

  const collector = msg.createMessageComponentCollector({ time: 30000 });

  collector.on('collect', async (i) => {
    if (!i.customId.startsWith('element_')) return;
    const chosenElement = i.customId.replace('element_', '');

    createUser(userId, interaction.user.username, chosenElement);

    await i.update({ content: `You chose **${chosenElement}**! Your journey begins.`, embeds: [], components: [] });
  });
};
