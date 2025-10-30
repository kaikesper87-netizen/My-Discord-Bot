// src/commands/pvp.js
import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getPlayer, getBattle, setBattle, deleteBattle } from '../database.js';

export const data = new SlashCommandBuilder()
    .setName('pvp')
    .setDescription('Challenge another player to a duel!')
    .addUserOption(option => option.setName('opponent').setDescription('Choose your opponent').setRequired(true));

export async function execute(interaction) {
    const challengerId = interaction.user.id;
    const opponent = interaction.options.getUser('opponent');
    const opponentId = opponent.id;

    const challenger = getPlayer(challengerId);
    const opponentPlayer = getPlayer(opponentId);

    if (!challenger || !opponentPlayer) {
        return interaction.reply({ content: 'Both players must have started their journey!', ephemeral: true });
    }

    const battleId = `${challengerId}_${opponentId}`;
    setBattle(battleId, { challengerId, opponentId, turn: challengerId });

    const embed = new EmbedBuilder()
        .setTitle('⚔️ PvP Challenge!')
        .setDescription(`${challenger.username} has challenged ${opponentPlayer.username} to a duel!`)
        .setColor('Random');

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`pvp_accept_${battleId}`).setLabel('Accept').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`pvp_decline_${battleId}`).setLabel('Decline').setStyle(ButtonStyle.Danger)
    );

    await interaction.reply({ embeds: [embed], components: [row] });
}

export async function handleComponent(interaction) {
    const [action, type, battleId] = interaction.customId.split('_');
    const battle = getBattle(battleId);

    if (!battle) return interaction.reply({ content: 'Battle not found!', ephemeral: true });

    if (type === 'accept') {
        await interaction.update({ content: '⚔️ Battle started!', components: [], embeds: [] });
        // Combat logic will be implemented later
    } else if (type === 'decline') {
        deleteBattle(battleId);
        await interaction.update({ content: '❌ Battle declined.', components: [], embeds: [] });
    }
}
