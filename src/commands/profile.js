const { SlashCommandBuilder, MessageEmbed } = require('discord.js');
const db = require('../database.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('profile')
        .setDescription('View your mage profile'),

    async execute(interaction) {
        const userId = interaction.user.id;
        const player = db[userId];

        if (!player) {
            return interaction.reply({ content: 'You do not have a profile yet. Use /start to create one.', ephemeral: true });
        }

        const embed = new MessageEmbed()
            .setTitle(`${player.username}'s Profile`)
            .addField('Element', player.element, true)
            .addField('HP', `${player.HP}/${player.maxHP}`, true)
            .addField('Mana', `${player.Mana}/${player.maxMana}`, true)
            .addField('Rank', player.Rank, true)
            .addField('Gold', `${player.Gold}`, true)
            .setColor('GREEN');

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
