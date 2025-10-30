// src/handlers/interactionHandler.js
import fs from 'fs';
import path from 'path';

// Auto-load commands
const commandsDir = path.join(process.cwd(), 'src/commands');
const commandFiles = fs.readdirSync(commandsDir).filter(f => f.endsWith('.js'));
const commands = new Map();

for (const file of commandFiles) {
    const { data, execute, handleComponent } = await import(`../commands/${file}`);
    commands.set(data.name, { execute, handleComponent });
}

export async function handleInteraction(interaction, players, guilds, battles, client) {
    try {
        if (interaction.isChatInputCommand()) {
            const cmd = commands.get(interaction.commandName);
            if (!cmd) return;

            await cmd.execute(interaction, client);
        }
        else if (interaction.isStringSelectMenu() || interaction.isButton()) {
            // Determine which command the component belongs to
            const [prefix, ...rest] = interaction.customId.split('_');
            
            // Example: 'start_select' => 'start'
            const commandName = prefix;
            const cmd = commands.get(commandName);
            if (!cmd) return;

            // Only call handleComponent if it exists
            if (cmd.handleComponent) {
                await cmd.handleComponent(interaction, client, battles, players);
            }
        }
    } catch (err) {
        console.error('❌ Interaction error:', err);

        // Try safe reply if not already acknowledged
        if (!interaction.replied && !interaction.deferred) {
            try {
                await interaction.reply({ content: '❌ Something went wrong.', ephemeral: true });
            } catch {}
        }
    }
}
