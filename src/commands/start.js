// src/commands/start.js
import { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder } from 'discord.js';
import { ELEMENTS, ELEMENT_PASSIVES, SPELL_DATA } from '../utils/constants.js';
import { loadDatabase, saveDatabase } from '../utils/database.js';

export const data = new SlashCommandBuilder()
  .setName('start')
  .setDescription('Start your adventure and choose your element.');

export async function execute(interaction) {
  const db = await loadDatabase();
  const userId = interaction.user.id;

  if (db[userId]) {
    return interaction.reply({ content: 'You have already started your journey!', ephemeral: true });
  }

  // Build element select menu
  const row = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('select-element')
      .setPlaceholder('Choose your element')
      .addOptions(
        ELEMENTS.map(el => ({
          label: el,
          value: el,
          description: ELEMENT_PASSIVES[el],
        }))
      )
  );

  await interaction.reply({
    content: 'Choose your element to begin:',
    components: [row],
    ephemeral: true
  });

  // Collector for element selection
  const filter = i => i.user.id === userId;
  const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000, max: 1 });

  collector.on('collect', async i => {
    const selected = i.values[0];

    // Initialize player in database
    db[userId] = {
      username: interaction.user.username,
      element: selected,
      HP: 100,
      Mana: 100,
      maxHP: 100,
      maxMana: 100,
      attack: 10,
      defense: 5,
      Rank: 'Novice Mage',
      Gold: 50,
      spells: SPELL_DATA[selected],
    };

    await saveDatabase(db);

    await i.update({
      content: `Welcome, ${interaction.user.username}! You chose **${selected}**. Your journey begins!`,
      components: []
    });
  });

  collector.on('end', collected => {
    if (collected.size === 0) {
      interaction.editReply({ content: 'You did not select an element in time!', components: [] });
    }
  });
}
