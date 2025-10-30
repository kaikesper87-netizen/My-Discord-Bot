// src/handlers/interactionHandler.js
import fs from 'fs';
import path from 'path';

const commandsPath = path.join(process.cwd(), 'src', 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));

// Load commands into a Map
const commands = new Map();
for (const file of commandFiles) {
    const { data, execute, handleComponent } = await import(`${commandsPath}/${file}`);
    commands.set(data.name, { execute, handleComponent });
}

export async function handleInteraction(interaction, players, guilds, battles, client) {
    try {
        if (interaction.isChatInputCommand()) {
            const cmd = commands.get(interaction.commandName);
            if (!cmd) return;
            await cmd.execute(interaction, client, players, guilds, battles);
        } else if (
            interaction.isStringSelectMenu() ||
            interaction.isButton()
        ) {
            // Determine the command based on customId prefix
            const cmdName = interaction.customId.split('_')[0];
            const cmd = commands.get(cmdName);
            if (!cmd || !cmd.handleComponent) return;
            await cmd.handleComponent(interaction, client, players, guilds, battles);
        }
    } catch (err) {
        console.error('❌ Interaction error:', err);
        try {
            if (!interaction.replied) {
                await interaction.reply({ content: 'Something went wrong!', ephemeral: true });
            }
        } catch {}
    }
}
