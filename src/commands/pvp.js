// src/commands/pvp.js
import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getUser, updateUser } from '../utils/database.js';
import { SPELL_DATA, ELEMENTS } from '../utils/constants.js';

// Track active battles
const activeBattles = new Map();

export const data = new SlashCommandBuilder()
  .setName('pvp')
  .setDescription('Challenge another player to a duel!');

export const execute = async (interaction) => {
  const challengerId = interaction.user.id;
  const challenger = getUser(challengerId);
  if (!challenger) return interaction.reply({ content: 'Start your journey first with /start!', ephemeral: true });

  const targetUser = interaction.options.getUser('target');
  if (!targetUser) return interaction.reply({ content: 'You must mention a player to challenge.', ephemeral: true });
  if (targetUser.id === challengerId) return interaction.reply({ content: 'You cannot fight yourself.', ephemeral: true });

  const opponent = getUser(targetUser.id);
  if (!opponent) return interaction.reply({ content: 'Your target has not started yet!', ephemeral: true });

  // Check if already in battle
  if (activeBattles.has(challengerId) || activeBattles.has(opponent.id)) {
    return interaction.reply({ content: 'One of you is already in a battle!', ephemeral: true });
  }

  // Create battle state
  const battle = {
    players: [challenger, opponent],
    turn: 0,
    message: null,
    finished: false,
  };
  activeBattles.set(challengerId, battle);
  activeBattles.set(opponent.id, battle);

  const embed = new EmbedBuilder()
    .setTitle(`⚔ PvP Battle!`)
    .setDescription(`${challenger.username} challenged ${opponent.username}!\nWaiting for acceptance...`)
    .setColor('Random');

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('accept').setLabel('Accept').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('decline').setLabel('Decline').setStyle(ButtonStyle.Danger)
  );

  const msg = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });
  battle.message = msg;

  // Collector for buttons
  const collector = msg.createMessageComponentCollector({ time: 30000 });

  collector.on('collect', async (i) => {
    if (i.user.id !== opponent.id) return i.reply({ content: 'Only the challenged player can respond!', ephemeral: true });

    if (i.customId === 'decline') {
      await i.update({ content: `${opponent.username} declined the challenge.`, embeds: [], components: [] });
      activeBattles.delete(challengerId);
      activeBattles.delete(opponent.id);
      return collector.stop();
    }

    if (i.customId === 'accept') {
      // Start battle
      await i.update({ content: `The duel begins!`, embeds: [], components: [] });
      runBattle(battle);
      collector.stop();
    }
  });
};

// Battle loop
async function runBattle(battle) {
  while (!battle.finished) {
    const player = battle.players[battle.turn % 2];
    const opponent = battle.players[(battle.turn + 1) % 2];

    const embed = new EmbedBuilder()
      .setTitle(`⚔ PvP Battle`)
      .setDescription(`${player.username}'s turn! Choose an action.`)
      .addFields(
        { name: player.username, value: `HP: ${player.HP}/${player.maxHP}\nMana: ${player.Mana}/${player.maxMana}`, inline: true },
        { name: opponent.username, value: `HP: ${opponent.HP}/${opponent.maxHP}\nMana: ${opponent.Mana}/${opponent.maxMana}`, inline: true }
      )
      .setColor('Random');

    const row = new ActionRowBuilder().addComponents(
      ...Object.keys(SPELL_DATA).slice(0, 5).map((spell) =>
        new ButtonBuilder().setCustomId(`spell_${spell}`).setLabel(`${SPELL_DATA[spell].emoji} ${spell}`).setStyle(ButtonStyle.Primary)
      )
    );

    const msg = await battle.message.edit({ embeds: [embed], components: [row] });

    const filter = (i) => i.user.id === player.id;
    const collector = msg.createMessageComponentCollector({ filter, max: 1, time: 30000 });

    const choice = await new Promise((resolve) => {
      collector.on('collect', async (i) => {
        await i.deferUpdate();
        resolve(i.customId);
      });
      collector.on('end', (collected) => {
        if (collected.size === 0) resolve(null);
      });
    });

    if (!choice) {
      battle.finished = true;
      await battle.message.edit({ content: `${player.username} did not respond in time. Battle ended.`, components: [], embeds: [] });
      activeBattles.delete(player.id);
      activeBattles.delete(opponent.id);
      break;
    }

    const spellName = choice.replace('spell_', '');
    const spell = SPELL_DATA[spellName];
    const damage = Math.floor(player.attack * spell.basePower);

    opponent.HP -= damage;
    if (opponent.HP <= 0) {
      battle.finished = true;
      await battle.message.edit({ content: `${player.username} wins the duel!`, components: [], embeds: [] });
      activeBattles.delete(player.id);
      activeBattles.delete(opponent.id);
      break;
    }

    battle.turn++;
  }
        }
