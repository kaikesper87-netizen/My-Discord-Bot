// Elements & Passives
export const ELEMENTS = ["Fire", "Water", "Wind", "Lightning", "Earth", "Light", "Dark", "Ice", "Poison", "Arcane", "Nature", "Metal", "Divine"];

export const ELEMENT_PASSIVES = {
    Fire: 'Burn chance +10%',
    Water: 'Heal +5%',
    Wind: 'Evasion +5%',
    Lightning: 'Critical +5%',
    Earth: 'Defense +5%',
    Light: 'Holy damage +5%',
    Dark: 'Lifesteal +5%',
    Ice: 'Freeze chance +5%',
    Poison: 'Poison damage +5%',
    Arcane: 'Mana regen +5%',
    Nature: 'HP regen +5%',
    Metal: 'Attack +5%',
    Divine: 'All stats +2%'
};

// Player Ranks
export const RANKS = ["Novice Mage", "Apprentice", "Adept", "Master", "Archmage", "Divine"];

// Base Spells
export const SPELLS = {
    Fireball: { type: 'attack', manaCost: 10, basePower: 1.5, element: 'Fire', emoji: '🔥' },
    WaterJet: { type: 'attack', manaCost: 10, basePower: 1.5, element: 'Water', emoji: '💧' },
    LightningStrike: { type: 'attack', manaCost: 12, basePower: 1.7, element: 'Lightning', emoji: '⚡' }
};
