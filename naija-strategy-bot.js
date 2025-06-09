/*
  Naija Strategy Games - Telegram Bot Implementation
  
  This is the complete BJS (Bots.Business JavaScript) code for the Naija Strategy Games bot.
  Copy this code to your bot command in Bots.Business.
  
  Commands handled:
  /start - Main menu
  /play - Game selection
  /majority - Start majority vote game
  /balance - Check balance
  /daily - Claim daily bonus
  /vip - VIP status
  /stats - Player statistics
  /help - Help information
*/

// Initialize or get user data
let userId = user.id;
let userData = Bot.getProperty("user_" + userId);

if (!userData) {
    userData = {
        id: userId,
        username: user.username || "Player",
        stars: 100,
        xp: 0,
        vipLevel: 1,
        lastDailyBonus: null,
        gamesPlayed: 0,
        gamesWon: 0,
        totalEarnings: 0,
        createdAt: Date.now()
    };
    Bot.setProperty("user_" + userId, userData);
}

// Handle incoming messages and callback queries
let command = "";
let callbackData = "";

if (request.callback_query) {
    callbackData = request.callback_query.data;
    Api.answerCallbackQuery({
        callback_query_id: request.callback_query.id
    });
} else {
    command = message.toLowerCase().trim();
}

// Route commands and callbacks
if (callbackData) {
    handleCallback(callbackData);
} else {
    handleCommand(command);
}

function handleCommand(cmd) {
    switch(cmd) {
        case "/start":
            showMainMenu();
            break;
        case "/play":
            showGameSelection();
            break;
        case "/majority":
            startMajorityGame();
            break;
        case "/balance":
            showBalance();
            break;
        case "/daily":
            claimDailyBonus();
            break;
        case "/vip":
            showVIPStatus();
            break;
        case "/stats":
            showStatistics();
            break;
        case "/help":
            showHelp();
            break;
        default:
            // Check if it's a vote for an active game
            handlePossibleVote(cmd);
            break;
    }
}

function handleCallback(data) {
    if (data.startsWith("game_")) {
        let gameMode = data.replace("game_", "");
        startGame(gameMode);
    } else if (data.startsWith("vote_")) {
        let option = data.replace("vote_", "");
        castVote(option);
    } else if (data === "revote") {
        handleRevote();
    } else {
        switch(data) {
            case "start": showMainMenu(); break;
            case "play": showGameSelection(); break;
            case "balance": showBalance(); break;
            case "daily": claimDailyBonus(); break;
            case "vip": showVIPStatus(); break;
            case "stats": showStatistics(); break;
            case "help": showHelp(); break;
        }
    }
}

function showMainMenu() {
    let keyboard = {
        inline_keyboard: [
            [
                { text: "🎮 Play Games", callback_data: "play" },
                { text: "💰 Balance", callback_data: "balance" }
            ],
            [
                { text: "🎁 Daily Bonus", callback_data: "daily" },
                { text: "👑 VIP Status", callback_data: "vip" }
            ],
            [
                { text: "📊 Statistics", callback_data: "stats" },
                { text: "❓ Help", callback_data: "help" }
            ]
        ]
    };

    let welcomeText = `🎮 *Welcome to Naija Strategy Games!*\n\n` +
                     `Vote smart, win big! 🇳🇬\n\n` +
                     `💰 Balance: ${userData.stars} Stars\n` +
                     `⚡ XP: ${userData.xp}\n` +
                     `👑 VIP Level: ${userData.vipLevel}\n\n` +
                     `Choose an option below:`;

    Api.sendMessage({
        text: welcomeText,
        parse_mode: "Markdown",
        reply_markup: keyboard
    });
}

function showGameSelection() {
    let keyboard = {
        inline_keyboard: [
            [
                { text: "🟩 Elect Majority (3 ⭐)", callback_data: "game_majority" }
            ],
            [
                { text: "🟦 Elect Minority (Coming Soon)", callback_data: "game_minority" }
            ],
            [
                { text: "🟥 Influence Market (Coming Soon)", callback_data: "game_market" }
            ],
            [
                { text: "🏠 Main Menu", callback_data: "start" }
            ]
        ]
    };

    let gameText = `🎮 *Choose Your Game Mode*\n\n` +
                  `🟩 *Elect Majority*\n` +
                  `Vote for what most people will choose\n` +
                  `Entry Fee: 3 Stars\n\n` +
                  `🟦 *Elect Minority*\n` +
                  `Vote for what least people will choose\n` +
                  `Coming Soon!\n\n` +
                  `🟥 *Influence Market*\n` +
                  `Strategic voting with live updates\n` +
                  `Coming Soon!\n\n` +
                  `💰 Your Balance: ${userData.stars} Stars`;

    Api.sendMessage({
        text: gameText,
        parse_mode: "Markdown",
        reply_markup: keyboard
    });
}

function startGame(mode) {
    if (mode === "minority" || mode === "market") {
        Api.sendMessage({
            text: `🚧 This game mode is coming soon!\n\nTry 🟩 Elect Majority for now!`
        });
        return;
    }

    if (mode === "majority") {
        startMajorityGame();
    }
}

function startMajorityGame() {
    let entryFee = getEntryFee("majority");
    
    if (userData.stars < entryFee) {
        Api.sendMessage({
            text: `❌ You need ${entryFee} Stars to play!\n\n` +
                  `💰 Your Balance: ${userData.stars} Stars\n` +
                  `🎁 Use /daily to get free Stars!`
        });
        return;
    }

    // Check for existing active game
    let activeGame = Bot.getProperty("game_active");
    if (activeGame && activeGame.endTime > Date.now()) {
        joinExistingGame(activeGame);
        return;
    }

    // Create new game
    createNewGame("majority", entryFee);
}

function createNewGame(mode, entryFee) {
    // Deduct entry fee
    userData.stars -= entryFee;
    Bot.setProperty("user_" + userId, userData);

    let gameOptions = [
        "Naija", "Lagos", "Jollof", "Afrobeat", "Buka",
        "Eko", "Wahala", "Sabi", "Gidi", "Danfo"
    ];

    let gameDuration = 180000; // 3 minutes
    let adminSettings = Bot.getProperty("admin_settings");
    if (adminSettings && adminSettings.gameDuration) {
        gameDuration = adminSettings.gameDuration;
    }

    let newGame = {
        id: "game_" + Date.now(),
        mode: mode,
        active: true,
        startTime: Date.now(),
        endTime: Date.now() + gameDuration,
        prizePool: entryFee,
        votes: [],
        options: gameOptions,
        players: [userId],
        creator: userId
    };

    Bot.setProperty("game_active", newGame);
    
    // Schedule game end
    Bot.runCommand({
        command: "endGame",
        options: { gameId: newGame.id },
        run_after: Math.floor(gameDuration / 1000)
    });

    // Add simulated players after 2 seconds
    Bot.runCommand({
        command: "addSimulatedPlayers",
        options: { gameId: newGame.id },
        run_after: 2
    });

    showVotingInterface(newGame);
}

function joinExistingGame(game) {
    if (!game.players.includes(userId)) {
        let entryFee = getEntryFee(game.mode);
        
        if (userData.stars < entryFee) {
            Api.sendMessage({
                text: `❌ You need ${entryFee} Stars to join!\n\n` +
                      `💰 Your Balance: ${userData.stars} Stars`
            });
            return;
        }

        userData.stars -= entryFee;
        Bot.setProperty("user_" + userId, userData);
        
        game.prizePool += entryFee;
        game.players.push(userId);
        Bot.setProperty("game_active", game);
    }

    showVotingInterface(game);
}

function showVotingInterface(game) {
    let timeLeft = Math.max(0, game.endTime - Date.now());
    let minutes = Math.floor(timeLeft / 60000);
    let seconds = Math.floor((timeLeft % 60000) / 1000);

    let keyboard = {
        inline_keyboard: []
    };

    // Create voting options (2 per row)
    for (let i = 0; i < game.options.length; i += 2) {
        let row = [];
        
        let emoji1 = getOptionEmoji(game.options[i]);
        row.push({
            text: `${emoji1} ${game.options[i]}`,
            callback_data: `vote_${game.options[i]}`
        });
        
        if (i + 1 < game.options.length) {
            let emoji2 = getOptionEmoji(game.options[i + 1]);
            row.push({
                text: `${emoji2} ${game.options[i + 1]}`,
                callback_data: `vote_${game.options[i + 1]}`
            });
        }
        
        keyboard.inline_keyboard.push(row);
    }

    // Add action buttons
    keyboard.inline_keyboard.push([
        { text: "🔄 Revote (2 ⭐)", callback_data: "revote" },
        { text: "🏠 Menu", callback_data: "start" }
    ]);

    let userVote = getUserCurrentVote(game, userId);
    let voteStatus = userVote ? `\n✅ Your vote: ${userVote}` : `\n⏳ Choose your option above`;

    let gameText = `🟩 *Elect Majority Game*\n\n` +
                  `📋 Vote for the word you think will get the most votes!\n\n` +
                  `⏰ Time Left: ${minutes}:${seconds.toString().padStart(2, '0')}\n` +
                  `🏆 Prize Pool: ${game.prizePool} Stars\n` +
                  `👥 Players: ${game.players.length}${voteStatus}`;

    Api.sendMessage({
        text: gameText,
        parse_mode: "Markdown",
        reply_markup: keyboard
    });
}

function castVote(option) {
    let activeGame = Bot.getProperty("game_active");
    
    if (!activeGame || !activeGame.active) {
        Api.sendMessage({
            text: "❌ No active game! Use /play to start."
        });
        return;
    }

    if (activeGame.endTime <= Date.now()) {
        Api.sendMessage({
            text: "⏰ Voting has ended!"
        });
        return;
    }

    if (!activeGame.options.includes(option)) {
        Api.sendMessage({
            text: "❌ Invalid voting option!"
        });
        return;
    }

    // Update or add vote
    let existingVoteIndex = activeGame.votes.findIndex(v => v.userId === userId);
    
    if (existingVoteIndex >= 0) {
        activeGame.votes[existingVoteIndex].option = option;
        activeGame.votes[existingVoteIndex].timestamp = Date.now();
    } else {
        activeGame.votes.push({
            userId: userId,
            option: option,
            timestamp: Date.now()
        });
    }

    Bot.setProperty("game_active", activeGame);

    Api.sendMessage({
        text: `✅ You voted for: *${option}*\n\nYou can change your vote anytime!`,
        parse_mode: "Markdown"
    });
}

function handleRevote() {
    let revoteCost = 2;
    
    if (userData.stars < revoteCost) {
        Api.sendMessage({
            text: `❌ You need ${revoteCost} Stars to revote!`
        });
        return;
    }

    let activeGame = Bot.getProperty("game_active");
    if (!activeGame || !activeGame.active) {
        Api.sendMessage({
            text: "❌ No active game!"
        });
        return;
    }

    // Deduct revote cost
    userData.stars -= revoteCost;
    Bot.setProperty("user_" + userId, userData);

    // Remove previous vote
    activeGame.votes = activeGame.votes.filter(v => v.userId !== userId);
    
    // Add to prize pool (70% of revote cost)
    activeGame.prizePool += Math.floor(revoteCost * 0.7);
    Bot.setProperty("game_active", activeGame);

    Api.sendMessage({
        text: `🔄 *Vote Reset!*\n\nChoose your new option above.\n\n-${revoteCost} Stars`,
        parse_mode: "Markdown"
    });
}

function claimDailyBonus() {
    let now = Date.now();
    let dayMs = 24 * 60 * 60 * 1000;
    
    if (userData.lastDailyBonus && (now - userData.lastDailyBonus) < dayMs) {
        let nextBonus = userData.lastDailyBonus + dayMs;
        let hoursLeft = Math.ceil((nextBonus - now) / (60 * 60 * 1000));
        
        Api.sendMessage({
            text: `⏰ Daily bonus already claimed!\n\nNext bonus: ${hoursLeft} hours`
        });
        return;
    }

    // Calculate bonus
    let baseBonus = 10;
    let adminSettings = Bot.getProperty("admin_settings");
    if (adminSettings && adminSettings.dailyBonusAmount) {
        baseBonus = adminSettings.dailyBonusAmount;
    }
    
    let vipMultiplier = 1 + (userData.vipLevel - 1) * 0.5;
    let bonusAmount = Math.floor(baseBonus * vipMultiplier);

    userData.stars += bonusAmount;
    userData.lastDailyBonus = now;
    Bot.setProperty("user_" + userId, userData);

    Api.sendMessage({
        text: `🎁 *Daily Bonus Claimed!*\n\n` +
              `💰 +${bonusAmount} Stars\n` +
              `👑 VIP ${userData.vipLevel} bonus applied\n\n` +
              `Balance: ${userData.stars} Stars`,
        parse_mode: "Markdown"
    });
}

function showBalance() {
    Api.sendMessage({
        text: `💰 *Your Balance*\n\n` +
              `⭐ Stars: ${userData.stars}\n` +
              `⚡ XP: ${userData.xp}\n` +
              `👑 VIP Level: ${userData.vipLevel}\n\n` +
              `💎 Total Earnings: ${userData.totalEarnings}\n` +
              `🎮 Games Played: ${userData.gamesPlayed}\n` +
              `🏆 Games Won: ${userData.gamesWon}`,
        parse_mode: "Markdown"
    });
}

function showVIPStatus() {
    let nextLevelXP = getXPRequiredForLevel(userData.vipLevel + 1);
    let progress = Math.min(100, (userData.xp / nextLevelXP) * 100);
    
    let currentBenefits = getVIPBenefits(userData.vipLevel);
    let nextBenefits = getVIPBenefits(userData.vipLevel + 1);
    
    Api.sendMessage({
        text: `👑 *VIP Status*\n\n` +
              `Level: VIP ${userData.vipLevel}\n` +
              `Progress: ${userData.xp}/${nextLevelXP} XP (${progress.toFixed(1)}%)\n\n` +
              `*Current Benefits:*\n${currentBenefits.join('\n')}\n\n` +
              `*Next Level:*\n${nextBenefits.join('\n')}`,
        parse_mode: "Markdown"
    });
}

function showStatistics() {
    let winRate = userData.gamesPlayed > 0 ? 
                 ((userData.gamesWon / userData.gamesPlayed) * 100).toFixed(1) : 0;
    
    Api.sendMessage({
        text: `📊 *Your Statistics*\n\n` +
              `🎮 Games Played: ${userData.gamesPlayed}\n` +
              `🏆 Games Won: ${userData.gamesWon}\n` +
              `📈 Win Rate: ${winRate}%\n` +
              `💰 Total Earnings: ${userData.totalEarnings} Stars\n` +
              `⚡ Total XP: ${userData.xp}\n` +
              `👑 VIP Level: ${userData.vipLevel}`,
        parse_mode: "Markdown"
    });
}

function showHelp() {
    Api.sendMessage({
        text: `🆘 *Help & Commands*\n\n` +
              `*Game Commands:*\n` +
              `/start - Main menu\n` +
              `/play - Game selection\n` +
              `/majority - Quick majority game\n\n` +
              `*Account Commands:*\n` +
              `/balance - Check balance\n` +
              `/daily - Daily bonus\n` +
              `/vip - VIP status\n` +
              `/stats - Statistics\n\n` +
              `*How to Play:*\n` +
              `1. Choose a game mode\n` +
              `2. Pay entry fee\n` +
              `3. Vote for your choice\n` +
              `4. Wait for results\n` +
              `5. Win Stars and XP!\n\n` +
              `Good luck! 🍀`,
        parse_mode: "Markdown"
    });
}

function handlePossibleVote(text) {
    let activeGame = Bot.getProperty("game_active");
    if (activeGame && activeGame.active && activeGame.options.includes(text)) {
        castVote(text);
    } else {
        Api.sendMessage({
            text: "❓ Unknown command. Use /help for available commands."
        });
    }
}

// Helper functions
function getEntryFee(mode) {
    let adminSettings = Bot.getProperty("admin_settings");
    if (adminSettings && adminSettings.entryFees && adminSettings.entryFees[mode]) {
        return adminSettings.entryFees[mode];
    }
    return mode === "majority" ? 3 : (mode === "minority" ? 4 : 5);
}

function getOptionEmoji(option) {
    let emojis = {
        "Naija": "🇳🇬", "Lagos": "🏙️", "Jollof": "🍚", "Afrobeat": "🎵", "Buka": "🍽️",
        "Eko": "🌊", "Wahala": "😅", "Sabi": "🧠", "Gidi": "✨", "Danfo": "🚐"
    };
    return emojis[option] || "⭐";
}

function getUserCurrentVote(game, userId) {
    let vote = game.votes.find(v => v.userId === userId);
    return vote ? vote.option : null;
}

function getXPRequiredForLevel(level) {
    return 100 * Math.pow(2, level - 1);
}

function getVIPBenefits(level) {
    let benefits = {
        1: ['✨ Basic game access', '🎁 Daily bonus eligible'],
        2: ['⚡ +20% XP bonus', '💎 Premium features', '🎁 Enhanced bonus'],
        3: ['🔥 +40% XP bonus', '💰 5% cashback', '⭐ Priority support'],
        4: ['💫 +60% XP bonus', '🏆 Exclusive tournaments', '💎 VIP games'],
        5: ['👑 +100% XP bonus', '🌟 Maximum privileges', '💰 10% cashback']
    };
    return benefits[level] || benefits[1];
}

/*
  Additional commands to create in Bots.Business:
  
  Command: addSimulatedPlayers
  This runs 2 seconds after game creation to add bot players
*/

/*
  Command: endGame
  This runs when the game timer expires to process results
*/