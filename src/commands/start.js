// src/commands/start.js
import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js';
import { ELEMENTS, SPELLS, RANKS } from '../utils/constants.js';
import { players, setPlayer } from '../database.js';

export const data = new SlashCommandBuilder()
    .setName('start')
    .setDescription('Begin your journey as a mage!');

export async function execute(interaction) {
    const userId = interaction.user.id;

    if (players[userId]) {
        return interaction.reply({ content: 'You have already started your journey!', ephemeral: true });
    }

    // Create player skeleton
    const player = {
        username: interaction.user.username,
        element: null,
        rank: RANKS[0],
        HP: 100,
        maxHP: 100,
        Mana: 100,
        maxMana: 100,
        attack: 10,
        defense: 5,
        gold: 100,
        spells: [],
    };

    // Save temporarily
    setPlayer(userId, player);

    // Element selection embed
    const embed = new EmbedBuilder()
        .setTitle('Choose Your Element')
        .setDescription('Select your mage element from the menu below:')
        .setColor('Random')
        .setFooter({ text: 'This will define your powers!' });

    // Select menu
    const select = new StringSelectMenuBuilder()
        .setCustomId('start_select')
        .setPlaceholder('Pick your element')
        .addOptions(ELEMENTS.map(e => ({ label: e, value: e, description: `Start as ${e} mage` })));

    const row = new ActionRowBuilder().addComponents(select);

    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
}

// Component handler for selection
export async function handleComponent(interaction) {
    const userId = interaction.user.id;
    const player = players[userId];

    if (!player) return interaction.reply({ content: 'Start your journey first using /start.', ephemeral: true });

    const element = interaction.values[0];
    player.element = element;

    // Assign first spell for element
    const spell = Object.values(SPELLS).find(s => s.element === element);
    if (spell) player.spells.push(spell);

    setPlayer(userId, player);

    await interaction.update({
        content: `✅ Your element is **${element}**! You’ve learned your first spell **${player.spells[0].emoji}**!`,
        embeds: [],
        components: []
    });
      }
