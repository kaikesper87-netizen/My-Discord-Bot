// src/commands/profile.js

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

// --- Command Definition ---
export const data = new SlashCommandBuilder()
    .setName('profile')
    .setDescription('Displays your character status, level, stats, and gold.');

// --- Command Execution Logic ---
export async function execute(interaction, players) {
    // The player's unique ID is used as the key in the global 'players' object
    const playerId = interaction.user.id;
    const playerTag = interaction.user.tag;

    // 1. Check if the player exists in the data
    if (!players[playerId]) {
        // If the player is new, prompt them to register
        return interaction.reply({ 
            content: `You don't have a profile yet! Use the \`/register\` command to start your adventure.`, 
            ephemeral: true 
        });
    }

    const player = players[playerId];
    
    // 2. Build the Embed to display the profile data
    const profileEmbed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle(`🌟 ${playerTag}'s Profile 🌟`)
        .setDescription(`**Level ${player.level}** - ${player.class || 'Adventurer'}`)
        .setThumbnail(interaction.user.displayAvatarURL())
        .addFields(
            { name: '💰 Gold', value: `${player.gold.toLocaleString()}`, inline: true },
            { name: '⚔️ Attack', value: `${player.stats.attack}`, inline: true },
            { name: '🛡️ Defense', value: `${player.stats.defense}`, inline: true },
            { name: '❤️ Health', value: `${player.stats.health}`, inline: true },
            { name: '✨ Experience', value: `${player.xp} / ${player.xp_to_next_level}`, inline: true },
            // Add more fields here as you expand your player data
        )
        .setTimestamp()
        .setFooter({ text: 'The adventure continues!' });

    // 3. Send the profile data
    await interaction.reply({ embeds: [profileEmbed] });
}
