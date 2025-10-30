// src/commands/start.js
import { ELEMENTS } from '../utils/constants.js';

export async function execute(interaction, client, players, guilds, battles) {
    const userId = interaction.user.id;

    // Prevent double start
    if (players[userId]) {
        return interaction.reply({ content: 'You already have a profile!', ephemeral: true });
    }

    // Defer reply for async safety
    if (!interaction.replied && !interaction.deferred) {
        await interaction.deferReply({ ephemeral: true });
    }

    // Initialize player
    players[userId] = {
        username: interaction.user.username,
        element: ELEMENTS[Math.floor(Math.random() * ELEMENTS.length)],
        HP: 100,
        Mana: 100,
        maxHP: 100,
        maxMana: 100,
        attack: 10,
        defense: 5,
        Rank: 'Novice Mage',
        Gold: 100
    };

    await interaction.editReply({ content: `Welcome ${interaction.user.username}! Your element is **${players[userId].element}**.` });
}

// Optional: Component handler if needed for select menus
export async function handleComponent(interaction, client) {
    // Example: Handle start menu selections
    await interaction.reply({ content: 'Component handled!', ephemeral: true });
}
