// src/commands/start.js

import { SlashCommandBuilder, StringSelectMenuBuilder, ActionRowBuilder, EmbedBuilder } from 'discord.js';
import { ELEMENTS, ELEMENT_PASSIVES } from '../utils/constants.js'; // We'll assume you have passives here

export const data = new SlashCommandBuilder()
    .setName('start')
    .setDescription('Start your adventure and choose your element.');

// --- Helper: create element select menu ---
function createElementMenu() {
    const options = ELEMENTS.map(el => ({
        label: el,
        value: el
    }));

    const menu = new StringSelectMenuBuilder()
        .setCustomId('choose_element')
        .setPlaceholder('Select your element')
        .addOptions(options);

    return new ActionRowBuilder().addComponents(menu);
}

// --- Execute command ---
export async function execute(interaction, client, players, saveData) {
    const userId = interaction.user.id;

    if (players[userId]) {
        return interaction.reply({ content: "You have already started your adventure!", ephemeral: true });
    }

    const embed = new EmbedBuilder()
        .setTitle('🌟 Choose Your Element')
        .setDescription('Select an element from the menu below to begin your journey!')
        .setColor(0x00FF99);

    await interaction.reply({ embeds: [embed], components: [createElementMenu()], ephemeral: true });
}

// --- Handle element selection ---
export async function handleComponent(interaction, client, players, saveData) {
    if (!interaction.isStringSelectMenu()) return;
    if (interaction.customId !== 'choose_element') return;

    const userId = interaction.user.id;
    const selectedElement = interaction.values[0];

    if (players[userId]) {
        return interaction.update({ content: "You have already started your adventure!", components: [], embeds: [], ephemeral: true });
    }

    // Initialize player stats
    players[userId] = {
        username: interaction.user.username,
        element: selectedElement,
        passive: ELEMENT_PASSIVES[selectedElement] || "None",
        Level: 1,
        experience: 0,
        money: 100,
        currentStats: {
            hp: 100,
            mana: 100
        },
        maxStats: {
            hp: 100,
            mana: 100,
            attack: 10,
            defense: 5,
            luck: 1
        },
        spells: []
    };

    saveData();

    const embed = new EmbedBuilder()
        .setTitle('🎉 Adventure Started!')
        .setDescription(`You are now a **Level 1 ${selectedElement}** elemental with the passive: **${players[userId].passive}**.`)
        .setColor(0x00FF99);

    await interaction.update({ embeds: [embed], components: [] });
}
