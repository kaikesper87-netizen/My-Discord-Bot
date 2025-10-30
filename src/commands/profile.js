// src/commands/profile.js
import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { getDatabase } from "../utils/database.js";
import { SPELL_DATA } from "../utils/constants.js";

export const data = new SlashCommandBuilder()
  .setName("profile")
  .setDescription("View your mage profile.");

export async function execute(interaction) {
  const db = getDatabase();
  const userId = interaction.user.id;

  const player = db[userId];
  if (!player) {
    await interaction.reply({
      content: "You don't have a character yet. Use /start to create one!",
      ephemeral: true
    });
    return;
  }

  // Build spell list
  const spells = player.spells.map(sp => `${sp} (${SPELL_DATA[sp]?.element || "Unknown"})`).join(", ") || "None";

  // Embed to show profile
  const profileEmbed = new EmbedBuilder()
    .setTitle(`${player.username}'s Profile`)
    .addFields(
      { name: "Element", value: player.element, inline: true },
      { name: "HP", value: `${player.HP}/${player.maxHP}`, inline: true },
      { name: "Mana", value: `${player.Mana}/${player.maxMana}`, inline: true },
      { name: "Attack", value: `${player.attack}`, inline: true },
      { name: "Defense", value: `${player.defense}`, inline: true },
      { name: "Gold", value: `${player.gold}`, inline: true },
      { name: "Passive", value: player.passive, inline: true },
      { name: "Spells", value: spells, inline: false },
      { name: "Regeneration", value: `${player.regeneration} per turn`, inline: true }
    );

  await interaction.reply({ embeds: [profileEmbed], ephemeral: true });
}
