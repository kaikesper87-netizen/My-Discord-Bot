// === ELEMENTS ===
export const ELEMENTS = [
  "Fire", "Water", "Wind", "Lightning", "Earth",
  "Light", "Dark", "Ice", "Poison", "Arcane",
  "Nature", "Metal", "Divine"
];

// === SPELL DATA ===
export const SPELL_DATA = {
  // Fire
  "Fireball": {
    type: "attack",
    manaCost: 10,
    basePower: 1.5,
    element: "Fire",
    description: "Launches a fiery orb that scorches enemies.",
    emoji: "🔥"
  },
  "Inferno Burst": {
    type: "attack",
    manaCost: 25,
    basePower: 2.5,
    element: "Fire",
    description: "Unleashes flames in all directions.",
    emoji: "🌋"
  },
  "Phoenix Rebirth": {
    type: "ultimate",
    manaCost: 45,
    basePower: 3.5,
    element: "Fire",
    description: "Revives you once upon death with 50% HP.",
    emoji: "🔥🕊️"
  },

  // Arcane
  "Arcane Bolt": {
    type: "attack",
    manaCost: 10,
    basePower: 1.6,
    element: "Arcane",
    description: "Pure arcane energy pierces through defense.",
    emoji: "💫"
  },
  "Mana Surge": {
    type: "support",
    manaCost: 20,
    basePower: 2.0,
    element: "Arcane",
    description: "Temporarily boosts mana regeneration.",
    emoji: "🔮"
  },
  "Astral Collapse": {
    type: "ultimate",
    manaCost: 50,
    basePower: 3.8,
    element: "Arcane",
    description: "Crushes the battlefield with raw arcane power.",
    emoji: "🌌"
  },

  // Divine
  "Holy Light": {
    type: "support",
    manaCost: 20,
    basePower: 2.2,
    element: "Divine",
    description: "Restores HP and removes debuffs.",
    emoji: "✨"
  },
  "Judgment": {
    type: "attack",
    manaCost: 25,
    basePower: 2.6,
    element: "Divine",
    description: "Smite enemies with heavenly wrath.",
    emoji: "⚔️"
  },
  "Celestial Nova": {
    type: "ultimate",
    manaCost: 55,
    basePower: 4.0,
    element: "Divine",
    description: "Calls down divine energy to obliterate all foes.",
    emoji: "🌟"
  }
};

// === ITEM DATABASE (Mage Gear) ===
export const ITEM_DATABASE = {
  // === Common Tier ===
  "Apprentice Robe": {
    rarity: "Common",
    type: "armor",
    effect: "+5 Defense, +10 Mana",
    value: 50,
    emoji: "🥼"
  },
  "Basic Wand": {
    rarity: "Common",
    type: "weapon",
    effect: "+5 Attack, +5 Mana Regen",
    value: 60,
    emoji: "🪄"
  },
  "Minor Mana Crystal": {
    rarity: "Common",
    type: "consumable",
    effect: "Restores 50 Mana.",
    value: 25,
    emoji: "🔹"
  },

  // === Rare Tier ===
  "Adept’s Robe": {
    rarity: "Rare",
    type: "armor",
    effect: "+15 Defense, +50 Mana",
    value: 150,
    emoji: "🧥"
  },
  "Arcane Wand": {
    rarity: "Rare",
    type: "weapon",
    effect: "+15 Attack, +10% Spell Power",
    value: 180,
    emoji: "✨"
  },
  "Runed Spellbook": {
    rarity: "Rare",
    type: "artifact",
    effect: "Spells cost 10% less Mana.",
    value: 200,
    emoji: "📖"
  },

  // === Epic Tier ===
  "Sorcerer’s Robe": {
    rarity: "Epic",
    type: "armor",
    effect: "+30 Defense, +100 Mana, +5% Magic Resistance",
    value: 350,
    emoji: "🧙‍♂️"
  },
  "Crystal Staff": {
    rarity: "Epic",
    type: "weapon",
    effect: "+25 Attack, +15% Spell Power, +10 Mana Regen",
    value: 400,
    emoji: "🔮"
  },
  "Orb of Concentration": {
    rarity: "Epic",
    type: "artifact",
    effect: "Increases critical spell damage by 20%.",
    value: 420,
    emoji: "🔵"
  },

  // === Legendary Tier ===
  "Archmage Robe": {
    rarity: "Legendary",
    type: "armor",
    effect: "+50 Defense, +250 Mana, -10% Mana Cost",
    value: 700,
    emoji: "👑"
  },
  "Staff of Infinity": {
    rarity: "Legendary",
    type: "weapon",
    effect: "+50 Attack, +25% Spell Power, +10 Mana Regen",
    value: 800,
    emoji: "♾️"
  },
  "Core of Ashborn": {
    rarity: "Legendary",
    type: "artifact",
    effect: "Boosts Dark and Fire spell power by 30%.",
    value: 1000,
    emoji: "🔥💀"
  },
  "Divine Halo": {
    rarity: "Legendary",
    type: "artifact",
    effect: "Boosts Divine spell healing by 40%.",
    value: 1000,
    emoji: "🌟"
  }
};
