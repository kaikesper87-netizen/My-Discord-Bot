// src/commands/pvp.js

import { 
    SlashCommandBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle 
} from "discord.js";
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
export async function execute(interaction, client, players, guilds, battles) {
    const opponentUser = interaction.options.getUser("opponent");
    const challengerId = interaction.user.id;
    const opponentId = opponentUser.id;
    const channelId = interaction.channelId;

    // --- Validation Checks ---
    if (!players[challengerId]) return interaction.reply({ content: "Please use **/start** first.", ephemeral: true });
    if (!players[opponentId]) return interaction.reply({ content: `${opponentUser.username} hasn't started yet!`, ephemeral: true });
    if (challengerId === opponentId) return interaction.reply({ content: "You can't challenge yourself!", ephemeral: true });
    if (battles[channelId]) return interaction.reply({ content: "There is already a battle active in this channel! Finish it first.", ephemeral: true });

    await interaction.deferReply();

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`pvp_accept`)
            .setLabel("Accept Duel")
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId(`pvp_decline`)
            .setLabel("Decline")
            .setStyle(ButtonStyle.Danger),
    );

    try {
        await interaction.editReply({ 
            content: `⚔️ **${opponentUser}**, you have been challenged to an Elemental Duel by **${interaction.user.username}**!`, 
            components: [row] 
        });
    } catch (error) {
        console.error("Failed to send PvP challenge:", error);
    }
}

// --- 3. COMPONENT HANDLER ---
export async function handleComponent(interaction, client, battles, players) {
    const customId = interaction.customId;
    const userId = interaction.user.id;
    const [actionType, actionDetail] = customId.split('_'); 

    const battle = battles[interaction.channelId];

    // --- A. Handle Challenge Buttons ---
    if (actionType === "pvp") {
        if (!battle) {
            try { await interaction.update({ content: "This challenge has expired.", components: [] }); } catch(e) { console.error(e); }
            return;
        }

        const challengerPlayer = players[battle.challengerId];
        const opponentPlayer = players[battle.opponentId];

        if (!challengerPlayer || !opponentPlayer) {
            try { await interaction.update({ content: "Error: Player data could not be loaded. Battle aborted.", components: [] }); } catch(e) { console.error(e); }
            return;
        }

        // Ensure only the challenged user can accept/decline
        if (userId !== battle.opponentId) {
            try { await interaction.reply({ content: "This challenge isn't for you.", ephemeral: true }); } catch(e) { console.error(e); }
            return;
        }

        if (actionDetail === "decline") {
            try { await interaction.update({ content: `✅ **${interaction.user.username}** has **declined** the duel.`, components: [] }); } catch(e) { console.error(e); }
            return;
        } 
        
        if (actionDetail === "accept") {
            const challenger = players[battle.challengerId];
            const opponent = players[battle.opponentId];
            const channelId = interaction.channelId;

            // Initialize battle state
            battles[channelId] = {
                challengerId: battle.challengerId,
                opponentId: battle.opponentId,
                currentTurnId: battle.challengerId,
                A_currentHP: challenger.maxStats.hp,
                B_currentHP: opponent.maxStats.hp,
                A_defending: false,
                B_defending: false,
                lastActionText: `⚔️ **${challenger.element} ${await getUsername(client, challenger)}** vs **${opponent.element} ${await getUsername(client, opponent)}** has begun!`,
            };

            const { message, components } = await generateBattleMessage(battles[channelId], client, players);

            try { await interaction.update({ content: message, components }); } catch(e) { console.error(e); }
            return;
        }
    }

    // --- B. Handle Combat Buttons ---
    if (actionType === "fight") {
        if (!battle) {
            try { await interaction.update({ content: "This battle has expired.", components: [] }); } catch(e) { console.error(e); }
            return;
        }

        if (userId !== battle.currentTurnId) {
            try { await interaction.reply({ content: "It's not your turn!", ephemeral: true }); } catch(e) { console.error(e); }
            return;
        }

        await processCombatTurn(actionDetail, battle, players, client);

        // Check win condition
        if (battle.A_currentHP <= 0 || battle.B_currentHP <= 0) {
            const result = await endBattle(battle, players, client);
            try { await interaction.update({ content: result, components: [] }); } catch(e) { console.error(e); }
            delete battles[interaction.channelId];
        } else {
            const { message, components } = await generateBattleMessage(battle, client, players);
            try { await interaction.update({ content: message, components }); } catch(e) { console.error(e); }
        }
    }
}

// --- 4. HELPERS ---
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
    const user = currentTurnId === battle.challengerId ? 'A' : 'B';
    const opp = user === 'A' ? 'B' : 'A';

    const currentUser = players[currentTurnId];
    const opponentPlayer = players[opponentId];

    // Reset defending
    battle[`${opp}_defending`] = false;

    if (action === "attack") {
        const baseDamage = currentUser.maxStats.attack * (1 + (Math.random() * 0.2 - 0.1));
        let damageTaken = Math.max(1, baseDamage - opponentPlayer.maxStats.defense);

        if (battle[`${user}_defending`]) damageTaken *= 0.5;

        if (opp === 'A') battle.A_currentHP = Math.max(0, battle.A_currentHP - damageTaken);
        else battle.B_currentHP = Math.max(0, battle.B_currentHP - damageTaken);

        const attackerName = await getUsername(client, currentUser);
        battle.lastActionText = `💥 ${attackerName} attacked for ${Math.round(damageTaken)} damage!`;
    } else if (action === "defend") {
        battle[`${user}_defending`] = true;
        const defenderName = await getUsername(client, currentUser);
        battle.lastActionText = `🛡️ ${defenderName} prepares to defend! Damage taken next turn is halved.`;
    }

    // Switch turn
    battle.currentTurnId = opponentId;
}

async function endBattle(battle, players, client) {
    let winnerId, loserId;
    if (battle.A_currentHP <= 0) {
        winnerId = battle.opponentId;
        loserId = battle.challengerId;
    } else {
        winnerId = battle.challengerId;
        loserId = battle.opponentId;
    }

    const winner = players[winnerId];
    const loser = players[loserId];

    const winnerUsername = await getUsername(client, winner);
    const loserUsername = await getUsername(client, loser);

    const moneyReward = 50;
    const xpReward = 100;

    winner.money += moneyReward;
    winner.experience += xpReward;

    return `🏆 **${winnerUsername}** has defeated **${loserUsername}**!
💰 **${winnerUsername}** gained ${xpReward} XP and ${moneyReward} money.`;
}

// Helper: Safely get a player's username
async function getUsername(client, player) {
    try {
        const userId = player.id || player.userId || player.discordId;
        const user = await client.users.fetch(userId);
        return user.username;
    } catch {
        return "Unknown Player";
    }
}
