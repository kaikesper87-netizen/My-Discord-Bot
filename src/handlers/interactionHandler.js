// src/handlers/interactionHandler.js
import fs from 'fs';
import path from 'path';

const commandsDir = path.join('./src/commands');
const commands = new Map();

// Auto-load commands
for (const file of fs.readdirSync(commandsDir).filter(f => f.endsWith('.js'))) {
    const { data, execute, handleComponent } = await import(`../commands/${file}`);
    commands.set(data.name, { execute, handleComponent });
}

export async function handleInteraction(interaction, players, guilds, battles, client) {
    try {
        // Slash command
        if (interaction.isChatInputCommand()) {
            const cmd = commands.get(interaction.commandName);
            if (!cmd) return;

            await cmd.execute(interaction, client);
        }

        // Component (buttons / select menus)
        else if (interaction.isButton() || interaction.isStringSelectMenu()) {
            const customId = interaction.customId;
            const cmdName = customId.split('_')[0]; // first part = command name
            const cmd = commands.get(cmdName);

            if (!cmd || !cmd.handleComponent) return;

            await cmd.handleComponent(interaction, client, battles, players);
        }
    } catch (err) {
        console.error('❌ Error handling interaction:', err);

        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: '❌ Something went wrong!', ephemeral: true });
        }
    }
}
