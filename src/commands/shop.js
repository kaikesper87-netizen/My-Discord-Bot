// src/commands/shop.js
import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getUser, updateUser } from '../utils/database.js';
import { ITEM_DATABASE } from '../utils/constants.js';

export const data = new SlashCommandBuilder()
  .setName('shop')
  .setDescription('Buy items, spells, and upgrades.');

export const execute = async (interaction) => {
  const player = getUser(interaction.user.id);
  if (!player) return interaction.reply({ content: 'Start your journey first with /start!', ephemeral: true });

  const items = Object.keys(ITEM_DATABASE).slice(0, 5);
  const embed = new EmbedBuilder()
    .setTitle('MageBit Shop 🛒')
    .setDescription('Select an item to purchase:')
    .setColor('Random');

  const row = new ActionRowBuilder().addComponents(
    ...items.map((key) =>
      new ButtonBuilder()
        .setCustomId(`buy_${key}`)
        .setLabel(`${ITEM_DATABASE[key].name} (${ITEM_DATABASE[key].price} Gold)`)
        .setStyle(ButtonStyle.Primary)
    )
  );

  const msg = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

  const collector = msg.createMessageComponentCollector({ time: 30000 });

  collector.on('collect', async (i) => {
    if (!i.customId.startsWith('buy_')) return;

    const itemKey = i.customId.replace('buy_', '');
    const item = ITEM_DATABASE[itemKey];

    if (player.Gold < item.price) {
      return i.reply({ content: `You do not have enough gold for ${item.name}.`, ephemeral: true });
    }

    player.Gold -= item.price;
    player.items.push(item.name);
    updateUser(player);

    await i.update({ content: `You purchased **${item.name}**!`, embeds: [], components: [] });
  });
};
