import { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js';
import { addUser, getUser } from '../utils/database.js';
import { ELEMENTS } from '../utils/constants.js';

export const data = new SlashCommandBuilder()
    .setName('start')
    .setDescription('Start your adventure!');

export const execute = async (interaction) => {
    const userId = interaction.user.id;
    if (getUser(userId)) {
        return interaction.reply({ content: 'You already started!', flags: 64 });
    }

    const row = new ActionRowBuilder()
        .addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('select_element')
                .setPlaceholder('Choose your element')
                .addOptions(
                    ELEMENTS.slice(0, 5).map(el => ({ label: el, value: el })) // max 5 options
                )
        );

    await interaction.reply({
        content: 'Select your element to begin:',
        components: [row],
        flags: 64
    });
};
