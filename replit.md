# Discord RPG Bot

## Overview
A comprehensive Discord RPG bot featuring turn-based combat, elemental magic, dungeons, inventory management, quests, guilds, and more.

## Features
- **13 Elemental Classes**: Fire, Water, Wind, Lightning, Earth, Light, Dark, Ice, Poison, Arcane, Nature, Metal, Divine
- **Combat Systems**: PvP battles and PvE dungeon crawling
- **Progression**: Level up, unlock spells, earn achievements
- **Inventory & Equipment**: Weapons, armor, accessories with stat bonuses
- **Shop System**: Purchase potions, equipment, and spell scrolls
- **Quest System**: Daily and weekly objectives with rewards
- **Guild System**: Team up with other players
- **Status Effects**: Burn, freeze, poison, stun mechanics
- **Prestige System**: Reset for permanent bonuses
- **Achievements**: Track player milestones

## Project Structure
- `src/index.js` - Main bot file with all game logic
- `data/` - JSON storage for players, guilds, quests
- `.env` - Environment variables (TOKEN, CLIENT_ID, OWNER_ID)

## Setup
1. Create a Discord bot at https://discord.com/developers/applications
2. Copy your bot token, client ID, and your user ID
3. Add them to the Secrets tab or create a `.env` file
4. Install dependencies: `npm install`
5. Run the bot: `npm start`

## Recent Changes
- Expanded dungeon system with multiple floors and bosses
- Added inventory and equipment with stat bonuses
- Implemented shop for purchasing items
- Created quest system for daily/weekly objectives
- Built guild system for team gameplay
- Added status effects and enhanced combat
- Implemented prestige system
- Created achievement tracking

## Commands
- `/start` - Begin your RPG journey
- `/profile` - View your character stats
- `/dungeon` - Enter a dungeon (PvE)
- `/inventory` - View your items and equipment
- `/shop` - Browse and purchase items
- `/quest` - View available quests
- `/guild` - Manage guild (create, join, leave)
- `/prestige` - Reset for permanent bonuses
- `/achievements` - View your achievements
- `/leaderboard` - View rankings
- `/bestow` - Admin commands (owner only)
