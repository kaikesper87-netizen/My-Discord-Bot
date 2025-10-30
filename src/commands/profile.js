import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { database } from '../database.js';

export const data = new SlashCommandBuilder()
    .setName('profile')
    .setDescription('Check your stats and progression.');

export const execute = async (interaction) => {
    const userId = interaction.user.id;
    const player = database.players[userId];

    if (!player) {
        return interaction.reply({ content: 'You have not started yet! Use /start.', ephemeral: true });
    }

    const embed = new EmbedBuilder()
        .setTitle(`${player.username}'s Profile`)
        .addFields(
            { name: 'Element', value: player.element, inline: true },
            { name: 'HP', value: `${player.HP}/${player.maxHP}`, inline: true },
            { name: 'Mana', value: `${player.Mana}/${player.maxMana}`, inline: true },
            { name: 'Attack', value: `${player.attack}`, inline: true },
            { name: 'Defense', value: `${player.defense}`, inline: true },
            { name: 'Gold', value: `${player.Gold}`, inline: true },
            { name: 'Rank', value: player.Rank, inline: true }
        )
        .setColor('Random');

    await interaction.reply({ embeds: [embed], ephemeral: true });
};
