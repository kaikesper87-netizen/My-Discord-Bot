// src/handlers/interactionHandler.js
import fs from 'fs';
import path from 'path';

const commandsDir = path.join('./src/commands');
const commandFiles = fs.readdirSync(commandsDir).filter(f => f.endsWith('.js'));

// Load commands dynamically
const commands = {};
for (const file of commandFiles) {
  const { data, execute, handleComponent } = await import(`../commands/${file}`);
  commands[data.name] = { data, execute, handleComponent };
}

export async function handleInteraction(interaction) {
  try {
    // Slash commands
    if (interaction.isChatInputCommand()) {
      const cmd = commands[interaction.commandName];
      if (!cmd) return;
      await cmd.execute(interaction);
    }

    // Component interactions (buttons, selects)
    if (interaction.isButton() || interaction.isStringSelectMenu()) {
      const [base, , battleIdOrSelect] = interaction.customId?.split('_') || [];
      // Determine the command from customId or by convention
      let cmd;

      if (interaction.isStringSelectMenu() && interaction.customId === 'start_select') {
        cmd = commands['start'];
      } else if (interaction.isButton() && (base === 'pvp')) {
        cmd = commands['pvp'];
      }

      if (!cmd || !cmd.handleComponent) {
        return interaction.reply({ content: '⚠️ This component cannot be handled.', ephemeral: true });
      }

      await cmd.handleComponent(interaction);
    }

  } catch (err) {
    console.error('❌ Interaction error:', err);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: 'Something went wrong!', ephemeral: true });
    }
  }
}
