const { SlashCommandBuilder, MessageEmbed } = require('discord.js');
const db = require('../database.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pvp')
        .setDescription('Challenge another player to a duel')
        .addUserOption(option => option.setName('target').setDescription('The player you want to fight').setRequired(true)),

    async execute(interaction) {
        const challengerId = interaction.user.id;
        const targetUser = interaction.options.getUser('target');
        const targetId = targetUser.id;

        if (!db[challengerId] || !db[targetId]) {
            return interaction.reply({ content: 'Both players must have profiles.', ephemeral: true });
        }

        const embed = new MessageEmbed()
            .setTitle('PvP Challenge!')
            .setDescription(`${interaction.user.username} challenges ${targetUser.username} to a duel!`)
            .setColor('RED');

        await interaction.reply({ embeds: [embed] });
    }
};
