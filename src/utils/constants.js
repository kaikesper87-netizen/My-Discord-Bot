// src/utils/constants.js

// Elements available for general players (Divine is exclusive)
export const ELEMENTS = [
  "Fire", "Water", "Wind", "Lightning", "Earth",
  "Light", "Dark", "Ice", "Poison", "Arcane",
  "Nature", "Metal"
];

// Passives for each element
export const ELEMENT_PASSIVES = {
  Fire: "Flame Surge",          // Extra burn damage
  Water: "Aqua Shield",         // Boosts defense slightly
  Wind: "Swift Gale",           // Increases dodge chance
  Lightning: "Thunderstrike",   // Chance to stun enemy
  Earth: "Stone Skin",           // Extra defense
  Light: "Radiant Speed",       // Increases speed for faster actions
  Dark: "Shadow Drain",         // Life steal from enemy attacks
  Ice: "Frostbite",             // Chance to freeze enemies
  Poison: "Toxic Cloud",        // Damage over time
  Arcane: "Mana Flow",           // Mana regeneration
  Nature: "Verdant Recovery",    // Gradual HP regen
  Metal: "Iron Will"             // Resistance up
};

// Divine is exclusive, only the owner (you) can select
export const DIVINE = "Divine";
export const DIVINE_PASSIVE = "Brilliance"; // Boosts attack and spell potency

// Spells for each element (Attack, Defensive, Regeneration)
export const SPELL_DATA = {
  // Fire
  Fireball: { type: "attack", manaCost: 10, basePower: 1.5, element: "Fire", description: "Basic fire attack." },
  FlameShield: { type: "defense", manaCost: 8, basePower: 1.2, element: "Fire", description: "Boosts defense with fire aura." },
  EmberRegen: { type: "regen", manaCost: 6, basePower: 1.1, element: "Fire", description: "Gradually regenerates HP." },

  // Water
  WaterJet: { type: "attack", manaCost: 10, basePower: 1.3, element: "Water", description: "Sharp water attack." },
  AquaBarrier: { type: "defense", manaCost: 8, basePower: 1.2, element: "Water", description: "Creates a water shield." },
  HealingRain: { type: "regen", manaCost: 6, basePower: 1.2, element: "Water", description: "Heals HP over time." },

  // Lightning
  ThunderStrike: { type: "attack", manaCost: 12, basePower: 1.4, element: "Lightning", description: "Shocking attack with chance to stun." },
  StaticGuard: { type: "defense", manaCost: 7, basePower: 1.1, element: "Lightning", description: "Reduces incoming damage." },
  ChargeUp: { type: "regen", manaCost: 5, basePower: 1.3, element: "Lightning", description: "Restores mana gradually." },

  // Divine (exclusive)
  DivineLight: { type: "attack", manaCost: 15, basePower: 2.0, element: "Divine", description: "Powerful attack only you can use." },
  BrillianceShield: { type: "defense", manaCost: 12, basePower: 1.5, element: "Divine", description: "Ultimate defensive spell." },
  RadiantAura: { type: "regen", manaCost: 10, basePower: 1.5, element: "Divine", description: "Restores HP and Mana rapidly." }
};
