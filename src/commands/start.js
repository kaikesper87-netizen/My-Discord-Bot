const { SlashCommandBuilder, MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');
const { ELEMENTS } = require('../utils/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('start')
        .setDescription('Start your adventure!'),

    async execute(interaction) {
        const row = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId('choose_element')
                    .setLabel('Choose Your Element')
                    .setStyle('PRIMARY')
            );

        const embed = new MessageEmbed()
            .setTitle('Welcome to MageBit!')
            .setDescription('Click the button below to choose your element and start your journey.')
            .setColor('BLUE');

        await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    }
};
