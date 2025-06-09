/*
  BJS Command: addSimulatedPlayers
  
  This command is called 2 seconds after a game starts to add simulated players.
  Set this up as a separate command in Bots.Business.
*/

let gameId = options.gameId;
let activeGame = Bot.getProperty("game_active");

if (!activeGame || activeGame.id !== gameId || !activeGame.active) {
    return; // Game no longer exists or ended
}

// Check admin settings for simulated players
let adminSettings = Bot.getProperty("admin_settings") || {};
if (adminSettings.simulatedPlayers === false) {
    return; // Simulated players disabled
}

// Generate 5-25 simulated players
let playerCount = Math.floor(Math.random() * 20) + 5;
let entryFee = getEntryFee(activeGame.mode);

for (let i = 0; i < playerCount; i++) {
    let randomOption = activeGame.options[Math.floor(Math.random() * activeGame.options.length)];
    let simulatedUserId = `sim_user_${activeGame.id}_${i}`;
    
    // Check if this simulated user already voted
    let existingVote = activeGame.votes.find(v => v.userId === simulatedUserId);
    if (!existingVote) {
        activeGame.votes.push({
            userId: simulatedUserId,
            option: randomOption,
            timestamp: Date.now() + Math.random() * 1000
        });
        
        // Add this simulated player to the game
        activeGame.players.push(simulatedUserId);
    }
}

// Calculate prize pool addition based on admin settings
let poolPercentage = 0.7; // Default 70% goes to prize pool
if (adminSettings.poolSplit && adminSettings.poolSplit.prize) {
    poolPercentage = adminSettings.poolSplit.prize / 100;
}

let additionalPool = Math.floor(playerCount * entryFee * poolPercentage);
activeGame.prizePool += additionalPool;

// Save updated game
Bot.setProperty("game_active", activeGame);

// Helper function
function getEntryFee(mode) {
    let adminSettings = Bot.getProperty("admin_settings") || {};
    if (adminSettings.entryFees && adminSettings.entryFees[mode]) {
        return adminSettings.entryFees[mode];
    }
    return mode === "majority" ? 3 : (mode === "minority" ? 4 : 5);
}