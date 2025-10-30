// src/handlers/interactionHandler.js
import { client } from '../index.js';
import fs from 'fs';
import path from 'path';

// Load all commands dynamically
const commands = new Map();
const commandsDir = path.join(process.cwd(), 'src', 'commands');
fs.readdirSync(commandsDir)
  .filter(file => file.endsWith('.js'))
  .forEach(async file => {
    const { data, execute } = await import(`../commands/${file}`);
    if (data && execute) commands.set(data.name, execute);
  });

client.on('interactionCreate', async (interaction) => {
  try {
    // Slash Command
    if (interaction.isChatInputCommand()) {
      const command = commands.get(interaction.commandName);
      if (!command) return;
      await command(interaction);
    }

    // Button Interaction
    else if (interaction.isButton()) {
      // Example: element selection or shop buy
      const [action, key] = interaction.customId.split('_');
      switch (action) {
        case 'element':
          const { createUser } = await import('../utils/database.js');
          createUser(interaction.user.id, interaction.user.username, key);
          await interaction.update({ content: `You chose **${key}**! Your adventure begins.`, components: [], embeds: [] });
          break;
        case 'buy':
          const { getUser, updateUser } = await import('../utils/database.js');
          const { ITEM_DATABASE } = await import('../utils/constants.js');
          const player = getUser(interaction.user.id);
          const item = ITEM_DATABASE[key];

          if (player.Gold < item.price) {
            return interaction.reply({ content: `Not enough gold for ${item.name}.`, flags: 64 }); // ephemeral alternative
          }

          player.Gold -= item.price;
          player.items.push(item.name);
          updateUser(player);
          await interaction.update({ content: `You purchased **${item.name}**!`, components: [], embeds: [] });
          break;
        // Extend for PvP or spell buttons here
      }
    }

  } catch (error) {
    console.error('❌ Error handling interaction:', error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: 'Something went wrong.', flags: 64 });
    } else {
      await interaction.reply({ content: 'Something went wrong.', flags: 64 });
    }
  }
});
