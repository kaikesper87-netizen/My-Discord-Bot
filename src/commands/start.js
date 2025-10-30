// src/commands/start.js
import { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js';
import { ELEMENTS, ELEMENT_PASSIVES, SPELL_DATA } from '../utils/constants.js';
import { getPlayer, setPlayer } from '../utils/database.js';

export const data = new SlashCommandBuilder()
  .setName('start')
  .setDescription('Start your MageBit adventure!');

export async function execute(interaction) {
  const userId = interaction.user.id;
  let player = getPlayer(userId);

  if (player) {
    return interaction.reply({ content: '❌ You have already started your adventure!', ephemeral: true });
  }

  // Initialize player
  player = {
    username: interaction.user.username,
    element: null,
    spells: [],
    passive: {},
    HP: 100,
    Mana: 100,
    maxHP: 100,
    maxMana: 100,
    attack: 10,
    defense: 5,
    Gold: 50,
    Rank: 'Novice Mage'
  };
  setPlayer(userId, player);

  // Element select menu
  const options = ELEMENTS.map(e => ({ label: e, value: e }));
  const row = new ActionRowBuilder()
    .addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('start_select')
        .setPlaceholder('Select your element')
        .addOptions(options)
    );

  await interaction.reply({ content: 'Choose your magical element:', components: [row] });
}

// Handle element selection
export async function handleComponent(interaction) {
  const userId = interaction.user.id;
  const player = getPlayer(userId);

  if (!player) {
    return interaction.reply({ content: '❌ Please start with /start first.', ephemeral: true });
  }

  const element = interaction.values[0];
  player.element = element;

  // Assign first spell and passive
  const firstSpell = Object.values(SPELL_DATA).find(s => s.element === element);
  if (firstSpell) player.spells.push(firstSpell);
  player.passive = ELEMENT_PASSIVES[element] || {};

  setPlayer(userId, player);

  await interaction.update({
    content: `✅ Your element is **${element}**!\n` +
             `You’ve learned your first spell **${firstSpell.emoji} ${firstSpell.name}**!\n` +
             `Your passive bonus: ${JSON.stringify(player.passive)}`,
    components: []
  });
}
