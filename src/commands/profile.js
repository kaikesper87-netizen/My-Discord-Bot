// src/commands/profile.js
export async function execute(interaction, client, players, guilds, battles) {
    const userId = interaction.user.id;

    // Check if player exists
    if (!players[userId]) {
        return interaction.reply({ content: 'You need to start first with /start!', ephemeral: true });
    }

    const player = players[userId];

    await interaction.reply({
        content: `**${player.username}**'s Profile\nElement: ${player.element}\nHP: ${player.HP}/${player.maxHP}\nMana: ${player.Mana}/${player.maxMana}\nAttack: ${player.attack}\nDefense: ${player.defense}\nRank: ${player.Rank}\nGold: ${player.Gold}`,
        ephemeral: true
    });
}
