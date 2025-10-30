// src/commands/profile.js
import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { players } from '../database.js';

export const data = new SlashCommandBuilder()
    .setName('profile')
    .setDescription('View your mage profile!');

export async function execute(interaction) {
    const userId = interaction.user.id;
    const player = players[userId];

    if (!player) {
        return interaction.reply({ content: 'You have not started your journey yet. Use /start!', ephemeral: true });
    }

    const embed = new EmbedBuilder()
        .setTitle(`${player.username}'s Profile`)
        .setColor('Random')
        .addFields(
            { name: 'Element', value: player.element || 'None', inline: true },
            { name: 'Rank', value: player.Rank || 'Novice Mage', inline: true },
            { name: 'HP', value: `${player.HP}/${player.maxHP}`, inline: true },
            { name: 'Mana', value: `${player.Mana}/${player.maxMana}`, inline: true },
            { name: 'Attack', value: `${player.attack}`, inline: true },
            { name: 'Defense', value: `${player.defense}`, inline: true },
            { name: 'Gold', value: `${player.Gold}`, inline: true },
            { name: 'Spells', value: player.spells?.map(s => `${s.emoji} ${s.name}`).join('\n') || 'None' }
        )
        .setFooter({ text: 'MageBit RPG' });

    await interaction.reply({ embeds: [embed], ephemeral: true });
}
