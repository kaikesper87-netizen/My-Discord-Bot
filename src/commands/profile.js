// src/commands/profile.js

import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { recalculateStats } from "../utils/coreFunctions.js";

// --- 1. COMMAND DEFINITION ---
export const data = new SlashCommandBuilder()
  .setName("profile")
  .setDescription("View your player profile, stats, and gear.")
  .addUserOption(option =>
    option
      .setName("user")
      .setDescription("The user whose profile you want to view (defaults to yourself)")
      .setRequired(false)
  );

// --- 2. SLASH COMMAND EXECUTION (/profile) ---
export async function execute(interaction, client, players) {
  // Determine which user's profile to view
  const targetUser = interaction.options.getUser("user") || interaction.user;
  const targetId = targetUser.id;
  const player = players[targetId];

  // Check if the profile exists
  if (!player) {
    const msg = targetId === interaction.user.id
      ? "You haven't started your adventure yet! Use **/start**."
      : `${targetUser.username} hasn't started their adventure yet.`;
    return interaction.reply({ content: msg, ephemeral: true });
  }

  // Recalculate stats before displaying
  recalculateStats(player);

  // --- Create the Profile Embed ---
  const profileEmbed = new EmbedBuilder()
    .setColor(0x0099FF)
    .setTitle(`⚔️ ${targetUser.username}'s Profile ⚔️`)
    .setDescription(`**The ${player.element} Elemental**`)
    .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
    .addFields(
      // --- General Stats ---
      {
        name: '🧬 Core Status',
        value: `**Level:** ${player.Level}\n**XP:** ${player.experience}\n**Money:** 💰 ${player.money}`,
        inline: true
      },
      // --- Combat Stats ---
      {
        name: '🔥 Combat Attributes',
        value: `**HP:** ${player.currentStats.hp}/${player.maxStats.hp}\n**Mana:** ${player.currentStats.mana}/${player.maxStats.mana}`,
        inline: true
      },
      {
        name: '\u200B', // Invisible Field for spacing
        value: '\u200B',
        inline: false,
      },
      {
        name: '⚔️ Offense & Defense',
        value: `**Attack:** ${player.maxStats.attack}\n**Defense:** ${player.maxStats.defense}\n**Luck:** ${player.maxStats.luck}`,
        inline: true
      },
      // --- Elemental & Passive ---
      {
        name: '✨ Elemental Power',
        value: `**Element:** ${player.element}\n**Passive:** ${player.passive || "None"}`,
        inline: true
      },
      // --- Inventory/Spells ---
      {
        name: '📜 Spells Known',
        value: player.spells && player.spells.length > 0 ? player.spells.join(', ') : "None",
        inline: false
      }
    )
    .setFooter({ text: `Last active: ${new Date().toLocaleDateString()}` });

  return interaction.reply({ embeds: [profileEmbed], ephemeral: false });
};
