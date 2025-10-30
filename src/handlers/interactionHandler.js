// src/handlers/interactionHandler.js
import { Collection } from 'discord.js';
import fs from 'fs';
import path from 'path';

const commands = new Collection();

// Load all commands dynamically
const commandsPath = path.join('./src/commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const { data, execute } = await import(`../commands/${file}`);
  if (!data || !execute) {
    console.warn(`⚠️ Command file ${file} is missing data or execute export.`);
    continue;
  }
  commands.set(data.name, { data, execute });
  console.log(`✅ Loaded command: ${data.name}`);
}

// Exported function to handle all interactions
export const handleInteraction = async (interaction) => {
  try {
    if (!interaction.isChatInputCommand()) return;

    const command = commands.get(interaction.commandName);
    if (!command) {
      console.warn(`⚠️ No command matching ${interaction.commandName} found.`);
      return;
    }

    await command.execute(interaction);
  } catch (error) {
    console.error('❌ Error handling interaction:', error);

    // Check if interaction can still be replied to
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: 'Something went wrong while executing this command.',
        ephemeral: true,
      });
    }
  }
};
