import { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js';
import { ELEMENTS, ELEMENT_PASSIVES, SPELL_DATA } from '../utils/constants.js';
import { getPlayer, setPlayer } from '../database.js';

export const data = new SlashCommandBuilder()
    .setName('start')
    .setDescription('Start your MageBit adventure!');

export async function execute(interaction) {
    const userId = interaction.user.id;
    let player = getPlayer(userId);

    if (player) {
        return interaction.reply({ content: '❌ You have already started your adventure!', ephemeral: true });
    }

    player = {
        username: interaction.user.username,
        element: null,
        spells: [],
        passive: {},
        HP: 100,
        Mana: 100,
        maxHP: 100,
        maxMana: 100,
        attack: 10,
        defense: 5,
        Gold: 50,
        Rank: 'Novice Mage'
    };

    setPlayer(userId, player);

    const row = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('start_select')
            .setPlaceholder('Select your element')
            .addOptions(ELEMENTS.map(e => ({ label: e, value: e })))
    );

    await interaction.reply({ content: 'Choose your magical element to begin your journey:', components: [row] });
}

export async function handleComponent(interaction) {
    const userId = interaction.user.id;
    const player = getPlayer(userId);

    if (!player) return interaction.reply({ content: '❌ Please start with /start first.', ephemeral: true });

    const element = interaction.values[0];
    player.element = element;

    const firstSpell = Object.values(SPELL_DATA).find(s => s.element === element);
    if (firstSpell) player.spells.push(firstSpell);

    player.passive = ELEMENT_PASSIVES[element] || {};

    setPlayer(userId, player);

    await interaction.update({
        content: `✅ Your element is **${element}**!\n` +
                 `You’ve learned your first spell **${firstSpell?.emoji} ${firstSpell?.name}**!\n` +
                 `Passive bonus: ${JSON.stringify(player.passive)}`,
        components: [],
    });
}
