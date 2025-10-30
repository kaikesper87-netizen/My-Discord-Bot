// src/commands/profile.js
import { players } from '../database.js'; // wherever you store player data
import { EmbedBuilder } from 'discord.js';

export default {
    data: {
        name: 'profile',
        description: 'View your player profile',
    },

    async execute(interaction) {
        try {
            const player = players[interaction.user.id];

            // If no player exists
            if (!player) {
                // ephemeral message so only the user sees it
                return await interaction.reply({ 
                    content: "❌ You don't have a profile yet! Use `/start` first.", 
                    ephemeral: true 
                });
            }

            // Build profile embed
            const profileEmbed = new EmbedBuilder()
                .setTitle(`${player.username}'s Profile`)
                .addFields(
                    { name: 'Element', value: player.element, inline: true },
                    { name: 'Rank', value: player.Rank || 'Novice', inline: true },
                    { name: 'HP', value: `${player.HP}/${player.maxHP}`, inline: true },
                    { name: 'Mana', value: `${player.Mana}/${player.maxMana}`, inline: true },
                    { name: 'Gold', value: player.Gold.toString(), inline: true }
                )
                .setColor('Random');

            // Send the embed
            await interaction.reply({ embeds: [profileEmbed], ephemeral: true });

        } catch (err) {
            console.error(err);

            // If we already replied (or deferred), use editReply
            if (interaction.replied || interaction.deferred) {
                await interaction.editReply({ content: '❌ An error occurred while loading your profile.' });
            } else {
                await interaction.reply({ content: '❌ An error occurred while loading your profile.', ephemeral: true });
            }
        }
    }
};
