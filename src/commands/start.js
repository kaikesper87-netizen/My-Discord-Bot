// src/commands/start.js
import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import { getUser, createUser } from '../utils/database.js';
import { ELEMENTS } from '../utils/constants.js';

export const data = new SlashCommandBuilder()
    .setName('start')
    .setDescription('Start your adventure and choose your element.');

export const execute = async (interaction) => {
    const userId = interaction.user.id;
    
    if (getUser(userId)) {
        return interaction.reply({ content: 'You already started your journey!', ephemeral: true });
    }

    const row = new ActionRowBuilder().addComponents(
        ...ELEMENTS.map(e =>
            new ButtonBuilder()
                .setCustomId(`element_${e}`)
                .setLabel(e)
                .setStyle(ButtonStyle.Primary)
        )
    );

    const embed = new EmbedBuilder()
        .setTitle('Choose your element')
        .setDescription('Click a button to select your element!')
        .setColor('Random');

    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
};
