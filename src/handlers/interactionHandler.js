const fs = require('fs');
const path = require('path');
const { Collection } = require('discord.js');

// Load commands
const commands = new Collection();
const commandsPath = path.join(__dirname, '../commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`../commands/${file}`);
    commands.set(command.data.name, command);
}

const handleInteraction = async (interaction, client) => {
    if (!interaction.isCommand()) return;

    const command = commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction, client);
    } catch (error) {
        console.error('❌ Error handling interaction:', error);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: 'Something went wrong.', ephemeral: true });
        }
    }
};

module.exports = { handleInteraction };
