// Elements available for normal players
export const ELEMENTS = [
  "Fire", "Water", "Wind", "Lightning", "Earth",
  "Light", "Dark", "Ice", "Poison", "Arcane",
  "Nature", "Metal"
];

// Passives for each element
export const ELEMENT_PASSIVES = {
  Fire: "Inferno Fury",           // Extra damage over time
  Water: "Aqua Veil",             // Slight healing over time
  Wind: "Gale Swiftness",         // Increased dodge / speed
  Lightning: "Storm Spark",       // Chance to stun
  Earth: "Stonewall",             // Extra defense
  Light: "Radiant Agility",       // Moves faster, quicker actions
  Dark: "Shadow Grip",            // Life steal on attacks
  Ice: "Frozen Edge",             // Chance to freeze enemies
  Poison: "Venomous Strike",      // Damage over time on hit
  Arcane: "Mystic Flow",          // Mana regeneration
  Nature: "Rejuvenation",         // HP regen over time
  Metal: "Iron Resolve",          // Resistance increase
  Divine: "Brilliance"            // Exclusive: HP + Mana regen, boosts attack
};

// Spells for each element with Attack, Defense, and Regen
export const SPELL_DATA = {
  Fire: {
    Attack: { name: "Flame Strike", type: "attack", power: 1.5, manaCost: 10, effect: "Burn chance" },
    Defensive: { name: "Ember Shield", type: "defense", power: 0, manaCost: 8, effect: "Reduces damage" },
    Regen: { name: "Blazing Spirit", type: "regen", power: 0, manaCost: 12, effect: "Small HP regen" }
  },
  Water: {
    Attack: { name: "Water Jet", type: "attack", power: 1.3, manaCost: 10, effect: "Splash damage" },
    Defensive: { name: "Aqua Guard", type: "defense", power: 0, manaCost: 8, effect: "Blocks some damage" },
    Regen: { name: "Healing Mist", type: "regen", power: 0, manaCost: 12, effect: "Heals slightly over time" }
  },
  Wind: {
    Attack: { name: "Gust", type: "attack", power: 1.2, manaCost: 10, effect: "Chance to dodge next attack" },
    Defensive: { name: "Wind Ward", type: "defense", power: 0, manaCost: 8, effect: "Increases evasion" },
    Regen: { name: "Airflow", type: "regen", power: 0, manaCost: 12, effect: "Small mana regen" }
  },
  Lightning: {
    Attack: { name: "Lightning Bolt", type: "attack", power: 1.5, manaCost: 10, effect: "Chance to stun" },
    Defensive: { name: "Static Field", type: "defense", power: 0, manaCost: 8, effect: "Reduces incoming attack speed" },
    Regen: { name: "Electro Surge", type: "regen", power: 0, manaCost: 12, effect: "Mana regen" }
  },
  Earth: {
    Attack: { name: "Rock Throw", type: "attack", power: 1.4, manaCost: 10, effect: "Slight knockback" },
    Defensive: { name: "Stone Skin", type: "defense", power: 0, manaCost: 8, effect: "Extra defense" },
    Regen: { name: "Earthen Recovery", type: "regen", power: 0, manaCost: 12, effect: "HP regen over time" }
  },
  Light: {
    Attack: { name: "Swift Strike", type: "attack", power: 1.3, manaCost: 10, effect: "Extra speed" },
    Defensive: { name: "Luminous Guard", type: "defense", power: 0, manaCost: 8, effect: "Increases dodge" },
    Regen: { name: "Radiant Flow", type: "regen", power: 0, manaCost: 12, effect: "Small HP regen" }
  },
  Dark: {
    Attack: { name: "Life Drain", type: "attack", power: 1.4, manaCost: 10, effect: "Steals HP" },
    Defensive: { name: "Shadow Veil", type: "defense", power: 0, manaCost: 8, effect: "Chance to avoid attacks" },
    Regen: { name: "Dark Pact", type: "regen", power: 0, manaCost: 12, effect: "Mana regen" }
  },
  Ice: {
    Attack: { name: "Ice Shard", type: "attack", power: 1.3, manaCost: 10, effect: "Chance to freeze" },
    Defensive: { name: "Frost Shield", type: "defense", power: 0, manaCost: 8, effect: "Reduces damage" },
    Regen: { name: "Chill Recovery", type: "regen", power: 0, manaCost: 12, effect: "Slow HP regen" }
  },
  Poison: {
    Attack: { name: "Toxic Dart", type: "attack", power: 1.2, manaCost: 10, effect: "Poison over time" },
    Defensive: { name: "Venom Skin", type: "defense", power: 0, manaCost: 8, effect: "Reflects small damage" },
    Regen: { name: "Poison Adapt", type: "regen", power: 0, manaCost: 12, effect: "Mana regen" }
  },
  Arcane: {
    Attack: { name: "Arcane Bolt", type: "attack", power: 1.3, manaCost: 10, effect: "Pierces defense" },
    Defensive: { name: "Mystic Barrier", type: "defense", power: 0, manaCost: 8, effect: "Blocks magic damage" },
    Regen: { name: "Mana Flow", type: "regen", power: 0, manaCost: 12, effect: "Restores mana" }
  },
  Nature: {
    Attack: { name: "Vine Whip", type: "attack", power: 1.2, manaCost: 10, effect: "Slight stun" },
    Defensive: { name: "Nature’s Guard", type: "defense", power: 0, manaCost: 8, effect: "Reduces damage" },
    Regen: { name: "Regrowth", type: "regen", power: 0, manaCost: 12, effect: "HP regen over time" }
  },
  Metal: {
    Attack: { name: "Iron Fist", type: "attack", power: 1.3, manaCost: 10, effect: "Extra defense reduction" },
    Defensive: { name: "Metal Shield", type: "defense", power: 0, manaCost: 8, effect: "Blocks damage" },
    Regen: { name: "Magnetize", type: "regen", power: 0, manaCost: 12, effect: "Mana regen" }
  },
  Divine: {
    Attack: { name: "Divine Smite", type: "attack", power: 1.6, manaCost: 15, effect: "Multi-hit, high crit chance" },
    Defensive: { name: "Sacred Guard", type: "defense", power: 0, manaCost: 12, effect: "Reflects damage, extra defense" },
    Regen: { name: "Brilliance", type: "regen", power: 0, manaCost: 12, effect: "HP + Mana regen, buffs attack" }
  }
};
