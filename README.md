# Discord RPG Bot 🎮⚔️

A comprehensive Discord RPG bot featuring turn-based combat, elemental magic systems, dungeons, inventory management, quests, guilds, and more!

## 🌟 Features

### Combat Systems
- **13 Elemental Classes**: Fire, Water, Wind, Lightning, Earth, Light, Dark, Ice, Poison, Arcane, Nature, Metal, Divine
- **PvP Battles**: Challenge other players to turn-based combat
- **PvE Dungeon Crawling**: Fight through procedurally generated floors with increasing difficulty
- **Status Effects**: Burn, Freeze, Poison, and Stun mechanics
- **Spell Progression**: Unlock more powerful spells as you level up

### Progression Systems
- **Level System**: Gain EXP and level up to increase stats
- **Prestige System**: Reset at level 50 for permanent stat bonuses
- **Equipment System**: Equip weapons, armor, and accessories for stat boosts
- **Achievement System**: Track your accomplishments and earn rewards

### Game Features
- **Dungeon System**: 
  - Multiple floors with scaling difficulty
  - Boss fights every 5 floors (Goblin King, Ancient Dragon, Void Lord, Primordial Titan)
  - 7 different monster types
  - Loot rewards (Gold and EXP)

- **Inventory & Equipment**:
  - 3 equipment slots: Weapon, Armor, Accessory
  - 15+ items available for purchase
  - Stat bonuses automatically recalculate

- **Shop System**:
  - Health and Mana potions
  - Weapons (Iron Sword → Legendary Sword)
  - Armor (Leather → Dragon Armor)
  - Accessories with special stats

- **Quest System**:
  - Daily quests: Clear dungeons, win PvP battles
  - Weekly quests: Defeat bosses, gain levels
  - Automatic rewards upon completion

- **Guild System**:
  - Create and manage guilds
  - Team up with other players
  - Guild progression and storage

## 📋 Commands

| Command | Description |
|---------|-------------|
| `/start` | Begin your RPG journey and choose your element |
| `/profile` | View your character stats and equipment |
| `/dungeon` | Enter a dungeon for PvE combat |
| `/inventory` | View your items and equipment |
| `/shop` | Browse and purchase items |
| `/equip` | Equip items to your character |
| `/use` | Use consumable items (potions) |
| `/quest` | View available quests and progress |
| `/guild` | Manage your guild (create, join, leave) |
| `/prestige` | Reset your character for permanent bonuses |
| `/achievements` | View your unlocked achievements |
| `/pvp` | Challenge another player to battle |
| `/leaderboard` | View rankings (overall, PvP, dungeon, prestige) |
| `/bestow` | Admin commands (owner only) |

## 🚀 Setup

### Prerequisites
- Node.js 20+
- Discord Bot Token
- Discord Application Client ID

### Installation

1. Clone this repository:
```bash
git clone https://github.com/yourusername/discord-rpg-bot.git
cd discord-rpg-bot
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
   - Create a `.env` file based on `.env.example`
   - Add your Discord bot credentials:
     - `TOKEN` - Your Discord bot token
     - `CLIENT_ID` - Your Discord application client ID
     - `OWNER_ID` - Your Discord user ID (for admin commands)

4. Run the bot:
```bash
npm start
```

### Getting Discord Credentials

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application (or select an existing one)
3. Go to the "Bot" section and click "Reset Token" to get your `TOKEN`
4. Go to "OAuth2" → "General" to find your `CLIENT_ID`
5. Enable Developer Mode in Discord (Settings → Advanced → Developer Mode)
6. Right-click your username and select "Copy ID" to get your `OWNER_ID`

### Bot Permissions

When inviting the bot to your server, ensure it has these permissions:
- Send Messages
- Embed Links
- Use Slash Commands
- Read Message History

### Invite Link Template
```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=277025392704&scope=bot%20applications.commands
```

## 🎯 Elemental System

Each element has unique spells and passive abilities:

- **Fire**: High damage with burn effects
- **Water**: Healing abilities and survivability
- **Wind**: Speed and evasion bonuses
- **Lightning**: Stun chances and high burst damage
- **Earth**: Bonus HP and defensive abilities
- **Light**: Critical hits and first strike advantage
- **Dark**: Life steal mechanics
- **Ice**: Freeze enemies to skip their turns
- **Poison**: Damage over time effects
- **Arcane**: Mana efficiency and versatile spells
- **Nature**: Natural regeneration
- **Metal**: High armor and damage reflection
- **Divine**: All-around powerful (owner only)

## 💾 Data Persistence

All game data is automatically saved:
- Player profiles and stats
- Guild information
- Quest progress
- Inventory and equipment

Data is stored in JSON files in the `data/` directory and auto-saves every 60 seconds.

## 🔄 UptimeRobot Support

The bot includes an HTTP server on port 5000 that responds with bot status information. You can use [UptimeRobot](https://uptimerobot.com/) to monitor and keep your bot alive 24/7.

Monitor endpoint: `http://your-bot-url:5000/`

## 📁 Project Structure

```
discord-rpg-bot/
├── src/
│   └── index.js          # Main bot file
├── data/                 # Game data storage (auto-generated)
│   ├── players.json
│   ├── guilds.json
│   └── quests.json
├── package.json
├── .env.example
├── .gitignore
└── README.md
```

## 🛠️ Development

### Adding New Features

The bot is structured to make adding new features easy:

1. **New Items**: Add to `itemDatabase` object
2. **New Monsters**: Add to `monsters` or `bosses` objects
3. **New Achievements**: Add to `achievements` object
4. **New Commands**: Add to `commands` array and create handler

### Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📜 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

Built with:
- [discord.js](https://discord.js.org/) - Discord API library
- [Node.js](https://nodejs.org/) - JavaScript runtime

## 📞 Support

For issues, questions, or suggestions, please open an issue on GitHub.

---

**Enjoy your adventure!** ⚔️🎮
