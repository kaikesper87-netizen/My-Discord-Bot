import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getPlayer } from '../database.js';

export const data = new SlashCommandBuilder()
    .setName('profile')
    .setDescription('View your mage profile!');

export async function execute(interaction) {
    const userId = interaction.user.id;
    const player = getPlayer(userId);

    if (!player) {
        return interaction.reply({ content: 'You have not started your journey yet. Use /start!', ephemeral: true });
    }

    const embed = new EmbedBuilder()
        .setTitle(`${player.username}'s Profile`)
        .setColor('Random')
        .addFields(
            { name: 'Element', value: player.element || 'None', inline: true },
            { name: 'Rank', value: player.Rank || 'Novice Mage', inline: true },
            { name: 'HP', value: `${player.HP || 0}/${player.maxHP || 0}`, inline: true },
            { name: 'Mana', value: `${player.Mana || 0}/${player.maxMana || 0}`, inline: true },
            { name: 'Attack', value: `${player.attack || 0}`, inline: true },
            { name: 'Defense', value: `${player.defense || 0}`, inline: true },
            { name: 'Gold', value: `${player.Gold || 0}`, inline: true },
            { name: 'Spells', value: player.spells?.map(s => `${s.emoji} ${s.name}`)?.join('\n') || 'None' }
        )
        .setFooter({ text: 'MageBit RPG' });

    await interaction.reply({ embeds: [embed], ephemeral: true });
}
