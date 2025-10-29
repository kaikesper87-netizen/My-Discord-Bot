// src/commands/pvp.js

import { 
    SlashCommandBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle 
} from "discord.js";
// Import global state and utilities
import { players, battles } from "../index.js"; 
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
export async function execute(interaction, client) {
    const opponentUser = interaction.options.getUser("opponent");
    const challengerId = interaction.user.id;
    const opponentId = opponentUser.id;
    const channelId = interaction.channelId;

    // --- Validation Checks ---
    if (!players[challengerId]) return interaction.reply({ content: "Please use **/start** first to begin your adventure.", ephemeral: true });
    if (!players[opponentId]) return interaction.reply({ content: `${opponentUser.username} hasn't started their adventure yet!`, ephemeral: true });
    if (challengerId === opponentId) return interaction.reply({ content: "You can't challenge yourself!", ephemeral: true });
    if (battles[channelId]) return interaction.reply({ content: "There is already a battle active in this channel! Finish it first.", ephemeral: true });
    // --- End Validation ---
    
    // Deferral is CRITICAL here since the user is waiting for a response!
    await interaction.deferReply(); 

    // Create the challenge buttons
    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            // Custom ID includes action type, and the ID of the challenger
            .setCustomId(`pvp_accept_${challengerId}`) 
            .setLabel("Accept Duel")
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId(`pvp_decline_${challengerId}`)
            .setLabel("Decline")
            .setStyle(ButtonStyle.Danger),
    );
    
    // Send the challenge message
    return interaction.editReply({ 
        content: `⚔️ **${opponentUser}**, you have been challenged to an Elemental Duel by **${interaction.user.username}**!`, 
        components: [row] 
    });
}

// --- 3. COMPONENT HANDLER (pvp_accept, pvp_decline, fight_...) ---
export async function handleComponent(interaction, client, battles) {
    const customId = interaction.customId;
    const userId = interaction.user.id;
    const [actionType, actionDetail, challengerId] = customId.split('_'); 
    
    // Check if a battle is even supposed to be happening in this channel
    const battle = battles[interaction.channelId];

    // --- A. Handle Challenge Buttons (Accept/Decline) ---
    if (actionType === "pvp") {
        // Find the opponent (the person who was challenged, i.e., the current user)
        const opponentUser = interaction.message.mentions.users.find(u => u.id !== challengerId);
        
        // Security Check: Only the challenged user can respond
        if (!opponentUser || userId !== opponentUser.id) {
            return interaction.reply({ content: "This challenge isn't for you.", ephemeral: true });
        }

        if (actionDetail === "decline") {
            await interaction.update({ content: `✅ **${interaction.user.username}** has **declined** the duel.`, components: [] });
            // Clean up any potential lingering state if needed
            return;
        } 
        
        else if (actionDetail === "accept") {
            const challenger = players[challengerId];
            const opponent = players[userId];
            const channelId = interaction.channelId;

            // Initialize the battle state
            battles[channelId] = {
                challengerId: challengerId,
                opponentId: opponent.id,
                currentTurnId: challengerId, // Challenger goes first
                A_currentHP: challenger.maxStats.hp,
                B_currentHP: opponent.maxStats.hp,
                A_defending: false,
                B_defending: false,
                lastActionText: `⚔️ **${challenger.element} ${interaction.guild.members.cache.get(challengerId)?.user.username}** vs. **${opponent.element} ${opponentUser.username}** has begun!`,
            };
            
            // Generate the initial fight message and buttons
            const { message, components } = generateBattleMessage(battle, client);

            // Update the challenge message to the battle interface
            await interaction.update({ 
                content: message,
                components: components 
            });
            return;
        }
    }

    // --- B. Handle Combat Buttons (fight_attack, fight_defend, etc.) ---
    if (actionType === "fight") {
        if (!battle) {
             await interaction.update({ content: "This battle has expired or finished.", components: [] });
             return;
        }
        
        // Check if it is the user's turn
        if (userId !== battle.currentTurnId) {
            return interaction.reply({ content: "It's not your turn!", ephemeral: true });
        }
        
        // --- Process Turn Logic (We will build this function next) ---
        processCombatTurn(actionDetail, battle, players, client); 
        
        // Check for win condition
        if (battle.A_currentHP <= 0 || battle.B_currentHP <= 0) {
            // End battle and declare winner
            await interaction.update({ content: endBattle(battle, players, client), components: [] });
            delete battles[channelId];
        } else {
            // Continue battle - Update message
            const { message, components } = generateBattleMessage(battle, client);
            await interaction.update({ content: message, components: components });
        }
        return;
    }

    // Default return if customId is unknown but starts with pvp/fight
    return interaction.reply({ content: "An unknown battle action occurred.", ephemeral: true });
}

// --- 4. HELPER FUNCTIONS (To be built separately) ---

/** Helper: Generates the entire battle message and button interface */
function generateBattleMessage(battle, client) {
    const A = players[battle.challengerId];
    const B = players[battle.opponentId];
    
    // Find usernames for display
    const userA = client.guilds.cache.get(battle.channelId)?.members.cache.get(battle.challengerId)?.user.username || "Challenger";
    const userB = client.guilds.cache.get(battle.channelId)?.members.cache.get(battle.opponentId)?.user.username || "Opponent";

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
            new ButtonBuilder().setCustomId("fight_defend").setLabel("Defend").setStyle(ButtonStyle.Secondary),
            // new ButtonBuilder().setCustomId("fight_spell").setLabel("Spell").setStyle(ButtonStyle.Success).setDisabled(true), // Implement later
        )
    ];

    return { message, components };
}

/** Helper: Processes the actual combat turn */
function processCombatTurn(action, battle, players, client) {
    const currentTurnId = battle.currentTurnId;
    const opponentId = currentTurnId === battle.challengerId ? battle.opponentId : battle.challengerId;
    
    const user = currentTurnId === battle.challengerId ? 'A' : 'B';
    const opp = user === 'A' ? 'B' : 'A';
    
    const currentUser = players[currentTurnId];
    const opponentPlayer = players[opponentId];
    
    // Reset opponent's defense status from their last turn
    battle[`${opp}_defending`] = false; 

    if (action === "attack") {
        // Implement damage calculation logic here (Base Damage, Element Advantage, Defense, etc.)
        const baseDamage = currentUser.maxStats.attack * (1 + (Math.random() * 0.2 - 0.1)); // Random variance
        
        let damageTaken = Math.max(1, baseDamage - opponentPlayer.maxStats.defense);
        
        // Apply defense reduction from *their* current defense status
        if (battle[`${user}_defending`]) { // Wait, the opponent is defending against THIS attack
             damageTaken = damageTaken * 0.5; // Example: 50% damage reduction
        }
        
        // Update HP
        if (opp === 'A') {
            battle.A_currentHP = Math.max(0, battle.A_currentHP - damageTaken);
        } else {
            battle.B_currentHP = Math.max(0, battle.B_currentHP - damageTaken);
        }
        
        const username = client.guilds.cache.get(battle.channelId)?.members.cache.get(currentTurnId)?.user.username || "Player";
        battle.lastActionText = `💥 ${username} attacked for ${Math.round(damageTaken)} damage!`;
        
    } else if (action === "defend") {
        // Set the current user's defense status for the OPPONENT's next attack
        battle[`${user}_defending`] = true;
        
        const username = client.guilds.cache.get(battle.channelId)?.members.cache.get(currentTurnId)?.user.username || "Player";
        battle.lastActionText = `🛡️ ${username} prepares to defend! Damage taken next turn is halved.`;
    }
    
    // Switch Turn
    battle.currentTurnId = opponentId;
}

/** Helper: Handles winner declaration, cleanup, and rewards */
function endBattle(battle, players, client) {
    const channelId = battle.channelId;
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
    
    const winnerUsername = client.guilds.cache.get(channelId)?.members.cache.get(winnerId)?.user.username || "Winner";
    const loserUsername = client.guilds.cache.get(channelId)?.members.cache.get(loserId)?.user.username || "Loser";

    // Reward Logic: Example XP and Money
    const moneyReward = 50;
    const xpReward = 100;

    winner.money += moneyReward;
    winner.experience += xpReward;
    
    // We would need to add a levelUp check here, probably imported from a stats utility.

    return `🏆 **${winnerUsername}** has defeated ${loserUsername}! 
    \n💰 **${winnerUsername}** gained ${xpReward} XP and ${moneyReward} money.`;
}

// NOTE: We need to update interactionHandler.js to properly route to this module!
          
