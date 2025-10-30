// src/commands/start.js
import { SlashCommandBuilder } from "discord.js";
import { ELEMENTS, ELEMENT_PASSIVES, SPELL_DATA } from "../utils/constants.js";
import { getDatabase, saveDatabase } from "../utils/database.js";

const DIVINE_USER_ID = "YOUR_DISCORD_ID"; // Only you can pick Divine

export const data = new SlashCommandBuilder()
  .setName("start")
  .setDescription("Begin your adventure as a mage.");

export async function execute(interaction) {
  const db = getDatabase();
  const userId = interaction.user.id;

  // Check if user already has a profile
  if (db[userId]) {
    await interaction.reply({
      content: "You already have a character!",
      ephemeral: true
    });
    return;
  }

  // Build list of selectable elements
  let availableElements = [...ELEMENTS];
  if (userId === DIVINE_USER_ID) availableElements.push("Divine");

  // Ask user to choose element
  await interaction.reply({
    content: `Choose your element: ${availableElements.join(", ")}`,
    ephemeral: true
  });

  // Collect response
  const filter = m => m.author.id === userId;
  const collector = interaction.channel.createMessageCollector({ filter, time: 30000, max: 1 });

  collector.on("collect", async m => {
    const chosen = m.content.trim();
    if (!availableElements.includes(chosen)) {
      await interaction.followUp({ content: "Invalid element selected.", ephemeral: true });
      return;
    }

    // Initialize player data
    db[userId] = {
      username: interaction.user.username,
      element: chosen,
      HP: 100,
      maxHP: 100,
      Mana: 50,
      maxMana: 50,
      attack: 5,
      defense: 5,
      gold: 100,
      spells: Object.keys(SPELL_DATA).filter(sp => SPELL_DATA[sp].element === chosen),
      passive: ELEMENT_PASSIVES[chosen] || "Brilliance", // Divine default
      regeneration: 1 // default regen
    };

    saveDatabase(db);

    await interaction.followUp({
      content: `Welcome, **${interaction.user.username}**! You are a **${chosen} Mage**. Your passive is **${db[userId].passive}**.`,
      ephemeral: true
    });
  });

  collector.on("end", collected => {
    if (collected.size === 0) {
      interaction.followUp({ content: "You did not choose an element in time.", ephemeral: true });
    }
  });
}
