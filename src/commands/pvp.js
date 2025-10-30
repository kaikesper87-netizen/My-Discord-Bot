// src/commands/pvp.js
import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { loadDatabase, saveDatabase } from '../utils/database.js';

export const data = new SlashCommandBuilder()
  .setName('pvp')
  .setDescription('Challenge another player to a duel!')
  .addUserOption(option =>
    option.setName('target')
      .setDescription('The player you want to challenge')
      .setRequired(true)
  );

export async function execute(interaction) {
  const db = await loadDatabase();
  const challengerId = interaction.user.id;
  const targetUser = interaction.options.getUser('target');
  const targetId = targetUser.id;

  // Check if both players exist
  if (!db[challengerId] || !db[targetId]) {
    return interaction.reply({ content: "Both players must have started their adventure (/start).", ephemeral: true });
  }

  const challenger = db[challengerId];
  const target = db[targetId];

  // Create a challenge message with accept/decline buttons
  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`accept_${challengerId}_${targetId}`)
        .setLabel('Accept')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`decline_${challengerId}_${targetId}`)
        .setLabel('Decline')
        .setStyle(ButtonStyle.Danger)
    );

  const embed = new EmbedBuilder()
    .setTitle('Duel Challenge!')
    .setDescription(`${interaction.user.username} has challenged ${target.username} to a duel!`)
    .setColor('Red');

  await interaction.reply({ embeds: [embed], components: [row] });

  const filter = i => i.user.id === targetId && (i.customId.startsWith('accept_') || i.customId.startsWith('decline_'));
  const collector = interaction.channel.createMessageComponentCollector({ filter, time: 15000 });

  collector.on('collect', async i => {
    if (i.customId.startsWith('accept_')) {
      // Simple battle logic (can expand later)
      const winner = Math.random() < 0.5 ? challenger : target;
      const loser = winner === challenger ? target : challenger;

      // Just an example: deduct HP
      loser.HP -= 10;
      if (loser.HP < 0) loser.HP = 0;

      await saveDatabase(db);

      await i.update({ content: `The duel is over! 🏆 ${winner.username} wins!`, embeds: [], components: [] });
      collector.stop();
    } else {
      await i.update({ content: `${target.username} declined the duel.`, embeds: [], components: [] });
      collector.stop();
    }
  });

  collector.on('end', collected => {
    if (collected.size === 0) {
      interaction.editReply({ content: 'The duel invitation expired.', components: [], embeds: [] });
    }
  });
        }
