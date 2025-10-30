// src/commands/pvp.js
import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { recalculateStats } from "../utils/coreFunctions.js";

// --- 1. COMMAND DEFINITION ---
export const data = new SlashCommandBuilder()
  .setName("pvp")
  .setDescription("Challenge another player to a turn-based duel!")
  .addUserOption(option =>
    option.setName("opponent")
      .setDescription("The player you want to challenge")
      .setRequired(true)
  );

// --- 2. SLASH COMMAND EXECUTION (/pvp @opponent) ---
export async function execute(interaction, client, players, battles) {
  const opponentUser = interaction.options.getUser("opponent");
  const challengerId = interaction.user.id;
  const opponentId = opponentUser.id;
  const channelId = interaction.channelId;

  if (!players[challengerId]) return interaction.reply({ content: "Please use **/start** first.", ephemeral: true });
  if (!players[opponentId]) return interaction.reply({ content: `${opponentUser.username} hasn't started yet!`, ephemeral: true });
  if (challengerId === opponentId) return interaction.reply({ content: "You can't challenge yourself!", ephemeral: true });
  if (battles[channelId]) return interaction.reply({ content: "There is already a battle active in this channel!", ephemeral: true });

  // Store a temporary challenge in memory
  battles[channelId] = {
    challengerId,
    opponentId,
    status: "pending"
  };

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("pvp_accept").setLabel("Accept Duel").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId("pvp_decline").setLabel("Decline").setStyle(ButtonStyle.Danger)
  );

  await interaction.reply({ content: `⚔️ ${opponentUser}, you have been challenged to an Elemental Duel by **${interaction.user.username}**!`, components: [row] });
}

// --- 3. COMPONENT HANDLER ---
export async function handleComponent(interaction, client, battles, players) {
  const customId = interaction.customId;
  const userId = interaction.user.id;
  const [actionType, actionDetail] = customId.split("_");
  const channelId = interaction.channelId;
  const battle = battles[channelId];

  if (!battle) return interaction.update({ content: "This challenge/battle has expired.", components: [] });

  if (actionType === "pvp") {
    if (userId !== battle.opponentId) return interaction.reply({ content: "This challenge isn't for you.", ephemeral: true });

    if (actionDetail === "decline") {
      delete battles[channelId];
      return interaction.update({ content: `✅ ${interaction.user.username} has declined the duel.`, components: [] });
    }

    if (actionDetail === "accept") {
      // Initialize battle
      const A = players[battle.challengerId];
      const B = players[battle.opponentId];

      recalculateStats(A);
      recalculateStats(B);

      battles[channelId] = {
        challengerId: battle.challengerId,
        opponentId: battle.opponentId,
        currentTurnId: battle.challengerId,
        A_currentHP: A.maxStats.hp,
        B_currentHP: B.maxStats.hp,
        A_defending: false,
        B_defending: false,
        lastActionText: `⚔️ ${await getUsername(client, A)} vs ${await getUsername(client, B)} has begun!`,
      };

      const { message, components } = await generateBattleMessage(battles[channelId], client, players);
      return interaction.update({ content: message, components });
    }
  }

  if (actionType === "fight") {
    if (userId !== battle.currentTurnId) return interaction.reply({ content: "It's not your turn!", ephemeral: true });

    await processCombatTurn(actionDetail, battle, players, client);

    if (battle.A_currentHP <= 0 || battle.B_currentHP <= 0) {
      const result = await endBattle(battle, players, client);
      delete battles[channelId];
      return interaction.update({ content: result, components: [] });
    }

    const { message, components } = await generateBattleMessage(battle, client, players);
    return interaction.update({ content: message, components });
  }
}

// --- HELPERS ---
async function generateBattleMessage(battle, client, players) {
  const A = players[battle.challengerId];
  const B = players[battle.opponentId];
  const userA = await getUsername(client, A);
  const userB = await getUsername(client, B);
  const turnUser = battle.currentTurnId === battle.challengerId ? userA : userB;

  const message =
`---
**${userA}** (${A.element}) HP: ${battle.A_currentHP}/${A.maxStats.hp} 
**${userB}** (${B.element}) HP: ${battle.B_currentHP}/${B.maxStats.hp} 
---
*${battle.lastActionText}*

It is **${turnUser}'s** turn. Choose your action:`;

  const components = [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("fight_attack").setLabel("Attack").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("fight_defend").setLabel("Defend").setStyle(ButtonStyle.Secondary)
    )
  ];

  return { message, components };
}

async function processCombatTurn(action, battle, players, client) {
  const currentTurnId = battle.currentTurnId;
  const opponentId = currentTurnId === battle.challengerId ? battle.opponentId : battle.challengerId;
  const user = currentTurnId === battle.challengerId ? "A" : "B";
  const opp = user === "A" ? "B" : "A";

  const currentUser = players[currentTurnId];
  const opponentPlayer = players[opponentId];

  battle[`${opp}_defending`] = false;

  if (action === "attack") {
    let damage = Math.max(1, currentUser.maxStats.attack - opponentPlayer.maxStats.defense);
    if (battle[`${user}_defending`]) damage *= 0.5;

    if (opp === "A") battle.A_currentHP = Math.max(0, battle.A_currentHP - damage);
    else battle.B_currentHP = Math.max(0, battle.B_currentHP - damage);

    battle.lastActionText = `💥 ${await getUsername(client, currentUser)} attacked for ${Math.round(damage)} damage!`;
  } else if (action === "defend") {
    battle[`${user}_defending`] = true;
    battle.lastActionText = `🛡️ ${await getUsername(client, currentUser)} prepares to defend! Damage next turn is halved.`;
  }

  battle.currentTurnId = opponentId;
}

async function endBattle(battle, players, client) {
  const winnerId = battle.A_currentHP > 0 ? battle.challengerId : battle.opponentId;
  const loserId = winnerId === battle.challengerId ? battle.opponentId : battle.challengerId;

  const winner = players[winnerId];
  const loser = players[loserId];

  const winnerUsername = await getUsername(client, winner);
  const loserUsername = await getUsername(client, loser);

  winner.money += 50;
  winner.experience += 100;

  return `🏆 **${winnerUsername}** defeated **${loserUsername}**! 💰 +50 Gold, +100 XP`;
}

// --- USERNAME HELPER ---
async function getUsername(client, player) {
  try {
    const userId = player.discordId || player.id || player.userId;
    const user = await client.users.fetch(userId);
    return user.username;
  } catch {
    return "Unknown Player";
  }
}
