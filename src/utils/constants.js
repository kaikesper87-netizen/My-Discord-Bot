// src/utils/constants.js

export const ELEMENTS = [
  "Fire", "Water", "Wind", "Lightning", "Earth", 
  "Light", "Dark", "Ice", "Poison", "Arcane", 
  "Nature", "Metal"
];

// Passives
export const ELEMENT_PASSIVES = {
  Fire: "Flame Surge",         // Burn extra damage
  Water: "Tidal Flow",         // Minor healing over time
  Wind: "Gale Reflex",         // Increases dodge chance
  Lightning: "Volt Strike",    // Chance to stun
  Earth: "Stonewall",          // Extra defense
  Light: "Blinding Speed",     // Increased action speed
  Dark: "Shadow Drain",        // Life steal on attack
  Ice: "Frostbite",            // Chance to freeze
  Poison: "Venom Touch",       // Damage over time
  Arcane: "Mana Overflow",     // Mana regeneration
  Nature: "Regrowth",          // Minor HP regen
  Metal: "Iron Skin"           // Resistance boost
};

// Divine is exclusive to you
export const DIVINE = {
  name: "Divine",
  passive: "Brilliance",       // Boosts all stats slightly, multi-hit strikes, critical chance
};

// Spell data: Each element has 3 core moves: Attack, Defense, Regeneration
export const SPELL_DATA = {
  Fire: {
    Attack: { type: "attack", manaCost: 10, basePower: 1.5, hits: 1, description: "Basic fire attack." },
    Defense: { type: "defense", manaCost: 8, boost: 0.2, description: "Increase defense temporarily." },
    Regeneration: { type: "regen", manaCost: 6, heal: 15, description: "Heal minor HP over time." }
  },
  Water: {
    Attack: { type: "attack", manaCost: 10, basePower: 1.3, hits: 1, description: "Sharp water attack." },
    Defense: { type: "defense", manaCost: 8, boost: 0.15, description: "Increase defense temporarily." },
    Regeneration: { type: "regen", manaCost: 6, heal: 20, description: "Heals over time." }
  },
  Wind: {
    Attack: { type: "attack", manaCost: 10, basePower: 1.4, hits: 2, description: "Rapid wind strikes." },
    Defense: { type: "defense", manaCost: 7, boost: 0.15, description: "Increase dodge chance." },
    Regeneration: { type: "regen", manaCost: 5, heal: 10, description: "Minor healing over time." }
  },
  Lightning: {
    Attack: { type: "attack", manaCost: 12, basePower: 1.6, hits: 1, description: "Electrifying strike." },
    Defense: { type: "defense", manaCost: 7, boost: 0.1, description: "Temporary resistance to stun." },
    Regeneration: { type: "regen", manaCost: 6, heal: 12, description: "Recover minor HP." }
  },
  Earth: {
    Attack: { type: "attack", manaCost: 10, basePower: 1.5, hits: 1, description: "Solid rock attack." },
    Defense: { type: "defense", manaCost: 8, boost: 0.25, description: "Boosts defense sharply." },
    Regeneration: { type: "regen", manaCost: 6, heal: 10, description: "Recover minor HP." }
  },
  Light: {
    Attack: { type: "attack", manaCost: 10, basePower: 1.4, hits: 2, description: "Blinding fast attack." },
    Defense: { type: "defense", manaCost: 7, boost: 0.15, description: "Shields against attacks." },
    Regeneration: { type: "regen", manaCost: 5, heal: 12, description: "Minor healing over time." }
  },
  Dark: {
    Attack: { type: "attack", manaCost: 11, basePower: 1.5, hits: 1, description: "Drains enemy life." },
    Defense: { type: "defense", manaCost: 7, boost: 0.1, description: "Reduce incoming damage." },
    Regeneration: { type: "regen", manaCost: 6, heal: 15, description: "Heal a portion of own HP." }
  },
  Ice: {
    Attack: { type: "attack", manaCost: 10, basePower: 1.3, hits: 2, description: "Chance to freeze enemy." },
    Defense: { type: "defense", manaCost: 8, boost: 0.2, description: "Increase defense." },
    Regeneration: { type: "regen", manaCost: 5, heal: 10, description: "Recover HP over time." }
  },
  Poison: {
    Attack: { type: "attack", manaCost: 9, basePower: 1.2, hits: 2, description: "Poisons enemy over time." },
    Defense: { type: "defense", manaCost: 7, boost: 0.1, description: "Slight defense boost." },
    Regeneration: { type: "regen", manaCost: 5, heal: 8, description: "Minor recovery." }
  },
  Arcane: {
    Attack: { type: "attack", manaCost: 10, basePower: 1.4, hits: 1, description: "Mystic arcane blast." },
    Defense: { type: "defense", manaCost: 8, boost: 0.1, description: "Magical shield." },
    Regeneration: { type: "regen", manaCost: 6, heal: 15, description: "Restore HP over time." }
  },
  Nature: {
    Attack: { type: "attack", manaCost: 9, basePower: 1.3, hits: 1, description: "Nature strike." },
    Defense: { type: "defense", manaCost: 7, boost: 0.15, description: "Increase defense." },
    Regeneration: { type: "regen", manaCost: 6, heal: 18, description: "Heals over time." }
  },
  Metal: {
    Attack: { type: "attack", manaCost: 11, basePower: 1.5, hits: 1, description: "Heavy metal strike." },
    Defense: { type: "defense", manaCost: 8, boost: 0.25, description: "Sharp defense boost." },
    Regeneration: { type: "regen", manaCost: 6, heal: 12, description: "Minor HP recovery." }
  },
  Divine: {
    Attack: { type: "attack", manaCost: 15, basePower: 2.0, hits: 3, description: "Ultimate multi-strike attack." },
    Defense: { type: "defense", manaCost: 12, boost: 0.3, description: "Massive defense boost." },
    Regeneration: { type: "regen", manaCost: 10, heal: 30, description: "Full HP and mana recovery." }
  }
};
