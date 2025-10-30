// src/utils/constants.js

export const ELEMENTS = [
    "Fire", "Water", "Wind", "Lightning", "Earth", "Light", "Dark", "Ice", "Poison", "Arcane", "Nature", "Metal", "Divine"
];

// Elemental Passives: Enhance stats or give effects
export const ELEMENT_PASSIVES = {
    Fire: { attackBoost: 5, burnChance: 0.2 },        // 20% chance to burn
    Water: { manaRegen: 5, healBoost: 0.1 },         // +5 mana regen per turn, +10% healing
    Wind: { dodgeChance: 0.15, speedBoost: 5 },
    Lightning: { critChance: 0.2, attackBoost: 3 },
    Earth: { defenseBoost: 5, hpBoost: 20 },
    Light: { healBoost: 0.2, manaBoost: 10 },
    Dark: { lifesteal: 0.1, attackBoost: 2 },
    Ice: { slowChance: 0.2, defenseBoost: 3 },
    Poison: { poisonChance: 0.25 },
    Arcane: { manaBoost: 15, spellDamageBoost: 0.15 },
    Nature: { regenHP: 5, regenMana: 5 },
    Metal: { defenseBoost: 7, attackBoost: 2 },
    Divine: { allBoost: 10 } // OP: boosts all stats by 10
};

// Spells: Base attack spells with element, mana, power, emoji
export const SPELLS = {
    Fireball: { name: 'Fireball', element: 'Fire', manaCost: 10, basePower: 1.5, emoji: '🔥' },
    WaterJet: { name: 'Water Jet', element: 'Water', manaCost: 8, basePower: 1.4, emoji: '💧' },
    LightningStrike: { name: 'Lightning Strike', element: 'Lightning', manaCost: 12, basePower: 1.6, emoji: '⚡' },
    EarthSmash: { name: 'Earth Smash', element: 'Earth', manaCost: 10, basePower: 1.5, emoji: '🪨' },
    DivineWrath: { name: 'Divine Wrath', element: 'Divine', manaCost: 5, basePower: 2.0, emoji: '✨' }, // OP spell
};
