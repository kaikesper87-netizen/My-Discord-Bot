// src/utils/constants.js

export const ELEMENTS = [
  "Fire", "Water", "Wind", "Lightning", "Earth",
  "Light", "Dark", "Ice", "Poison", "Arcane",
  "Nature", "Metal", "Divine"
];

export const ELEMENT_PASSIVES = {
  Fire: { attack: 5 },
  Water: { defense: 5 },
  Wind: { speed: 5 },
  Lightning: { critChance: 5 },
  Earth: { maxHP: 20 },
  Light: { healingBonus: 5 },
  Dark: { lifesteal: 5 },
  Ice: { freezeChance: 5 },
  Poison: { poisonDamage: 5 },
  Arcane: { manaBonus: 10 },
  Nature: { regen: 5 },
  Metal: { defense: 10 },
  Divine: { attack: 10, defense: 10 }
};

// Basic sample spells for each element
export const SPELL_DATA = {
  Fireball: {
    name: "Fireball",
    type: "attack",
    manaCost: 10,
    basePower: 1.5,
    element: "Fire",
    description: "A basic fire attack.",
    emoji: "🔥"
  },
  WaterJet: {
    name: "Water Jet",
    type: "attack",
    manaCost: 10,
    basePower: 1.5,
    element: "Water",
    description: "A basic water attack.",
    emoji: "💧"
  },
  Gust: {
    name: "Gust",
    type: "attack",
    manaCost: 8,
    basePower: 1.3,
    element: "Wind",
    description: "A basic wind attack.",
    emoji: "💨"
  },
  LightningStrike: {
    name: "Lightning Strike",
    type: "attack",
    manaCost: 12,
    basePower: 1.7,
    element: "Lightning",
    description: "A basic lightning attack.",
    emoji: "⚡"
  },
  RockSmash: {
    name: "Rock Smash",
    type: "attack",
    manaCost: 10,
    basePower: 1.5,
    element: "Earth",
    description: "A basic earth attack.",
    emoji: "🪨"
  },
  HealLight: {
    name: "Heal Light",
    type: "healing",
    manaCost: 10,
    basePower: 1.5,
    element: "Light",
    description: "Basic healing spell.",
    emoji: "✨"
  },
  ShadowBolt: {
    name: "Shadow Bolt",
    type: "attack",
    manaCost: 12,
    basePower: 1.6,
    element: "Dark",
    description: "Basic dark attack.",
    emoji: "🌑"
  },
  FrostBlast: {
    name: "Frost Blast",
    type: "attack",
    manaCost: 10,
    basePower: 1.4,
    element: "Ice",
    description: "Basic ice attack.",
    emoji: "❄️"
  },
  PoisonDart: {
    name: "Poison Dart",
    type: "attack",
    manaCost: 10,
    basePower: 1.3,
    element: "Poison",
    description: "Basic poison attack.",
    emoji: "☠️"
  },
  ArcaneMissile: {
    name: "Arcane Missile",
    type: "attack",
    manaCost: 12,
    basePower: 1.5,
    element: "Arcane",
    description: "Basic arcane attack.",
    emoji: "🔮"
  },
  NatureStrike: {
    name: "Nature Strike",
    type: "attack",
    manaCost: 10,
    basePower: 1.4,
    element: "Nature",
    description: "Basic nature attack.",
    emoji: "🌿"
  },
  IronFist: {
    name: "Iron Fist",
    type: "attack",
    manaCost: 10,
    basePower: 1.6,
    element: "Metal",
    description: "Basic metal attack.",
    emoji: "🛡️"
  },
  DivineSmite: {
    name: "Divine Smite",
    type: "attack",
    manaCost: 15,
    basePower: 2,
    element: "Divine",
    description: "Powerful divine attack.",
    emoji: "☀️"
  }
};
