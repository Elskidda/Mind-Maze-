/*
  BJS Command: endGame
  
  This command is called when the game timer expires to process results and distribute rewards.
  Set this up as a separate command in Bots.Business.
*/

let gameId = options.gameId;
let activeGame = Bot.getProperty("game_active");

if (!activeGame || activeGame.id !== gameId || !activeGame.active) {
    return; // Game no longer exists or already ended
}

// Mark game as ended
activeGame.active = false;

// Count votes for each option
let voteCounts = {};
activeGame.options.forEach(option => {
    voteCounts[option] = 0;
});

activeGame.votes.forEach(vote => {
    if (voteCounts.hasOwnProperty(vote.option)) {
        voteCounts[vote.option]++;
    }
});

// Add invisible admin vote for house edge
let randomOption = activeGame.options[Math.floor(Math.random() * activeGame.options.length)];
voteCounts[randomOption]++;

// Find winning option (most votes)
let winningOption = Object.keys(voteCounts).reduce((a, b) => 
    voteCounts[a] > voteCounts[b] ? a : b
);

// Get admin settings for prize distribution
let adminSettings = Bot.getProperty("admin_settings") || {};
let prizePercentage = 0.7; // Default 70% to winners
if (adminSettings.poolSplit && adminSettings.poolSplit.prize) {
    prizePercentage = adminSettings.poolSplit.prize / 100;
}

// Calculate winnings per winner
let winnersCount = voteCounts[winningOption];
let starsPerWinner = winnersCount > 0 ? Math.floor((activeGame.prizePool * prizePercentage) / winnersCount) : 0;

// Process results for all real players (exclude simulated players)
let realPlayers = activeGame.players.filter(playerId => !playerId.startsWith('sim_user_'));

realPlayers.forEach(playerId => {
    let playerData = Bot.getProperty("user_" + playerId);
    if (!playerData) return;

    let userVote = getUserVote(activeGame, playerId);
    let isWinner = userVote === winningOption;

    // Update player statistics
    playerData.gamesPlayed++;
    if (isWinner) {
        playerData.gamesWon++;
        playerData.stars += starsPerWinner;
        playerData.totalEarnings += starsPerWinner;
    }

    // Award XP with VIP bonus
    let baseXP = 5;
    let bonusXP = isWinner ? 10 : 0;
    let vipBonus = 1 + (playerData.vipLevel - 1) * 0.2;
    let finalXP = Math.floor((baseXP + bonusXP) * vipBonus);
    
    playerData.xp += finalXP;

    // Check for VIP level up
    let oldLevel = playerData.vipLevel;
    playerData.vipLevel = calculateVIPLevel(playerData.xp);
    let leveledUp = playerData.vipLevel > oldLevel;

    // Save player data
    Bot.setProperty("user_" + playerId, playerData);

    // Send results to player
    sendGameResults(playerId, winningOption, userVote, isWinner, starsPerWinner, finalXP, leveledUp, voteCounts);
});

// Clear the active game
Bot.setProperty("game_active", null);

// Helper functions
function getUserVote(game, userId) {
    let vote = game.votes.find(v => v.userId === userId);
    return vote ? vote.option : null;
}

function calculateVIPLevel(xp) {
    let level = 1;
    let requiredXP = 100;
    
    while (xp >= requiredXP && level < 5) {
        level++;
        requiredXP = 100 * Math.pow(2, level - 1);
    }
    
    return level;
}

function sendGameResults(playerId, winningOption, userVote, isWinner, starsWon, xpGained, leveledUp, voteCounts) {
    let resultText = `🎉 *Game Results*\n\n`;
    
    // Show vote distribution
    resultText += `📊 *Final Vote Count:*\n`;
    Object.keys(voteCounts).forEach(option => {
        let emoji = option === winningOption ? "👑" : "📊";
        resultText += `${emoji} ${option}: ${voteCounts[option]} votes\n`;
    });
    
    resultText += `\n🏆 *Winner: ${winningOption}*\n`;
    resultText += `🗳️ *Your Vote: ${userVote || 'None'}*\n\n`;
    
    if (isWinner) {
        resultText += `✅ *Congratulations! You Won!*\n`;
        resultText += `💰 Stars Won: +${starsWon}\n`;
        resultText += `⚡ XP Gained: +${xpGained}\n`;
    } else {
        resultText += `❌ *Better luck next time!*\n`;
        resultText += `⚡ XP Gained: +${xpGained}\n`;
        resultText += `🎯 Keep playing to improve your strategy!\n`;
    }
    
    if (leveledUp) {
        resultText += `\n🎊 *VIP LEVEL UP!* 🎊\n`;
        resultText += `👑 You are now VIP Level ${Bot.getProperty("user_" + playerId).vipLevel}!\n`;
    }
    
    let keyboard = {
        inline_keyboard: [
            [
                { text: "🎮 Play Again", callback_data: "game_majority" },
                { text: "💰 Balance", callback_data: "balance" }
            ],
            [
                { text: "📊 Statistics", callback_data: "stats" },
                { text: "🏠 Main Menu", callback_data: "start" }
            ]
        ]
    };
    
    Api.sendMessage({
        chat_id: playerId,
        text: resultText,
        parse_mode: "Markdown",
        reply_markup: keyboard
    });
}