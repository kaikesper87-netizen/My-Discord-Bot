// src/commands/start.js
import { SlashCommandBuilder } from '@discordjs/builders';
import { MessageActionRow, MessageSelectMenu, MessageEmbed } from 'discord.js';
import { ELEMENTS, ELEMENT_PASSIVES, SPELL_DATA } from '../utils/constants.js';
import { getPlayer, createPlayer } from '../utils/database.js';

export const data = new SlashCommandBuilder()
  .setName('start')
  .setDescription('Start your adventure and choose an element');

export const execute = async (interaction) => {
  const userId = interaction.user.id;
  const existingPlayer = getPlayer(userId);

  if (existingPlayer) {
    return interaction.reply({
      content: 'You have already started your journey!',
      ephemeral: true
    });
  }

  // Create the select menu for elements
  const row = new MessageActionRow().addComponents(
    new MessageSelectMenu()
      .setCustomId('element_select')
      .setPlaceholder('Choose your element')
      .addOptions(
        ELEMENTS.map(el => ({
          label: el,
          value: el,
          description: ELEMENT_PASSIVES[el] || 'Special ability'
        }))
      )
  );

  const embed = new MessageEmbed()
    .setTitle('Choose Your Element')
    .setDescription('Select an element from the menu below to start your adventure.')
    .setColor('BLUE');

  await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });

  // Wait for user's selection
  const filter = i => i.user.id === userId && i.customId === 'element_select';
  const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000, max: 1 });

  collector.on('collect', async i => {
    const element = i.values[0];

    // Default player data
    const playerData = {
      username: interaction.user.username,
      element,
      HP: 100,
      Mana: 100,
      maxHP: 100,
      maxMana: 100,
      attack: 10,
      defense: 5,
      gold: 50,
      spells: [Object.keys(SPELL_DATA).find(sp => SPELL_DATA[sp].element === element)],
      Rank: 'Novice Mage'
    };

    createPlayer(userId, playerData);

    await i.update({
      content: `Welcome, **${interaction.user.username}**! You chose **${element}** as your element. Your adventure begins now!`,
      embeds: [],
      components: []
    });
  });

  collector.on('end', collected => {
    if (collected.size === 0) {
      interaction.editReply({ content: 'You did not select an element in time.', embeds: [], components: [] });
    }
  });
};
