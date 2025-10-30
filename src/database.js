// In-memory database (JSON-based can be added later)
export const players = {};
export const guilds = {};
export const battles = {};

// Player helper functions
export function getPlayer(id) {
    return players[id] || null;
}

export function setPlayer(id, data) {
    players[id] = data;
}

export function getAllPlayers() {
    return players;
}
