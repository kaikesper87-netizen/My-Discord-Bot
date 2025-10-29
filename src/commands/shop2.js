import {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from "discord.js";
import { itemDatabase } from "../index.js"; // import the shared item list

export const data = new SlashCommandBuilder()
  .setName("shop2")
  .setDescription("View the full item shop (includes all items)");

export async function execute(interaction) {
  // Get all shop items (no slice limit)
  const items = Object.keys(itemDatabase);
  
  const embed = new EmbedBuilder()
    .setTitle("🏪 Extended Mage Shop")
    .setDescription("Click a button below to purchase an item:")
    .setColor(0xf39c12);

  // Show item descriptions in the embed
  items.forEach((itemName) => {
    const item = itemDatabase[itemName];
    embed.addFields({
      name: itemName,
      value: `${item.desc} — **${item.cost} Gold**`,
      inline: true,
    });
  });

  // Create a button for each item
  const buttons = items.map((itemName) =>
    new ButtonBuilder()
      .setCustomId(`buyitem_${itemName.replace(/ /g, "_")}`)
      .setLabel(`${itemName} (${itemDatabase[itemName].cost}g)`)
      .setStyle(ButtonStyle.Success)
  );

  // Discord allows max 5 buttons per row → split into chunks
  const rows = [];
  for (let i = 0; i < buttons.length; i += 5) {
    rows.push(new ActionRowBuilder().addComponents(buttons.slice(i, i + 5)));
  }

  await interaction.reply({ embeds: [embed], components: rows });
       } 
