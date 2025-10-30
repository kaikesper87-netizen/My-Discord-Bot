// src/commands/start.js
import { players } from '../database.js'; // your player storage
import { ELEMENTS, ELEMENT_PASSIVES } from '../utils/constants.js';
import { EmbedBuilder } from 'discord.js';

export default {
    data: {
        name: 'start',
        description: 'Create your player profile',
    },

    async execute(interaction) {
        try {
            // Check if player already exists
            if (players[interaction.user.id]) {
                return await interaction.reply({
                    content: "❌ You already have a profile! Use `/profile` to view it.",
                    ephemeral: true
                });
            }

            // Randomly assign an element
            const element = ELEMENTS[Math.floor(Math.random() * ELEMENTS.length)];

            // Create the new player
            players[interaction.user.id] = {
                username: interaction.user.username,
                element,
                HP: 100,
                maxHP: 100,
                Mana: 100,
                maxMana: 100,
                attack: 0,
                defense: 0,
                Rank: 'Novice Mage',
                Gold: 100,
                passive: ELEMENT_PASSIVES[element]
            };

            // Profile embed
            const startEmbed = new EmbedBuilder()
                .setTitle('🪄 Profile Created!')
                .setDescription(`Welcome ${interaction.user.username}!\nYou have been assigned the **${element}** element.`)
                .addFields(
                    { name: 'HP', value: '100/100', inline: true },
                    { name: 'Mana', value: '100/100', inline: true },
                    { name: 'Gold', value: '100', inline: true },
                    { name: 'Passive', value: ELEMENT_PASSIVES[element], inline: false }
                )
                .setColor('Random');

            await interaction.reply({ embeds: [startEmbed], ephemeral: true });

        } catch (err) {
            console.error(err);

            if (interaction.replied || interaction.deferred) {
                await interaction.editReply({ content: '❌ An error occurred while creating your profile.' });
            } else {
                await interaction.reply({ content: '❌ An error occurred while creating your profile.', ephemeral: true });
            }
        }
    }
};
