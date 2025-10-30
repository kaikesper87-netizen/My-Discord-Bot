// src/commands/pvp.js
import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getUser } from '../utils/database.js';
import { SPELL_DATA } from '../constants.js';

export const data = new SlashCommandBuilder()
    .setName('pvp')
    .setDescription('Challenge another player to a duel.')
    .addUserOption(option =>
        option.setName('target')
            .setDescription('Choose a player to duel')
            .setRequired(true)
    );

export const execute = async (interaction) => {
    const userId = interaction.user.id;
    const target = interaction.options.getUser('target');
    const targetId = target.id;

    const player = getUser(userId);
    const enemy = getUser(targetId);

    if (!player) return interaction.reply({ content: 'Start your journey first using /start.', ephemeral: true });
    if (!enemy) return interaction.reply({ content: 'Target has not started their journey.', ephemeral: true });

    // Find player's attack spell based on their element
    const attackSpell = Object.values(SPELL_DATA).find(s => s.element === player.element && s.type === 'attack') || null;

    const embed = new EmbedBuilder()
        .setTitle('⚔️ PvP Duel')
        .setDescription(`${player.username} challenges ${enemy.username} to a duel!`)
        .addFields(
            { name: player.username, value: `HP: ${player.HP} | Attack: ${player.attack}`, inline: true },
            { name: enemy.username, value: `HP: ${enemy.HP} | Attack: ${enemy.attack}`, inline: true },
            { name: 'First Move', value: attackSpell ? attackSpell.element : 'Basic Attack' }
        )
        .setColor('Red');

    await interaction.reply({ embeds: [embed] });
};
