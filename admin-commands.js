/*
  BJS Admin Commands for Naija Strategy Games
  
  These commands should be set up as separate admin-only commands in Bots.Business.
  Restrict access to these commands to admin users only.
*/

// Command: /admin_settings
// Allows admins to view and modify game settings
if (message === "/admin_settings") {
    // Check if user is admin (replace with your admin user ID)
    let adminIds = ["123456789"]; // Add your Telegram user ID here
    
    if (!adminIds.includes(user.id.toString())) {
        Api.sendMessage({
            text: "❌ Access denied. Admin only command."
        });
        return;
    }

    let settings = Bot.getProperty("admin_settings") || getDefaultAdminSettings();
    
    let keyboard = {
        inline_keyboard: [
            [
                { text: "⏰ Game Duration", callback_data: "admin_duration" },
                { text: "💰 Entry Fees", callback_data: "admin_fees" }
            ],
            [
                { text: "🏆 Prize Distribution", callback_data: "admin_prizes" },
                { text: "🎁 Daily Bonus", callback_data: "admin_bonus" }
            ],
            [
                { text: "🤖 Simulated Players", callback_data: "admin_bots" },
                { text: "📊 Game Stats", callback_data: "admin_stats" }
            ],
            [
                { text: "🔄 Reset Settings", callback_data: "admin_reset" }
            ]
        ]
    };

    let settingsText = `🔧 *Admin Settings Panel*\n\n` +
                      `⏰ Game Duration: ${settings.gameDuration / 1000}s\n` +
                      `💰 Entry Fees: Majority ${settings.entryFees.majority}⭐\n` +
                      `🏆 Prize Pool: ${settings.poolSplit.prize}%\n` +
                      `🎁 Daily Bonus: ${settings.dailyBonusAmount}⭐\n` +
                      `🤖 Simulated Players: ${settings.simulatedPlayers ? 'ON' : 'OFF'}\n\n` +
                      `Choose a setting to modify:`;8 

    Api.sendMessage({
        text: settingsText,
        parse_mode: "Markdown",
        reply_markup: keyboard
    });
}

// Command: /admin_stats
// Shows comprehensive game statistics
if (message === "/admin_stats") {
    let adminIds = ["123456789"];
    
    if (!adminIds.includes(user.id.toString())) {
        Api.sendMessage({
            text: "❌ Access denied."
        });
        return;
    }

    let totalUsers = 0;
    let totalStars = 0;
    let totalGames = 0;
    let totalWins = 0;
    let vipDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    // This would need to be implemented with proper user enumeration
    // For now, showing structure
    
    let statsText = `📊 *Game Statistics*\n\n` +
                   `👥 Total Users: ${totalUsers}\n` +
                   `💰 Stars in Circulation: ${totalStars}\n` +
                   `🎮 Total Games Played: ${totalGames}\n` +
                   `🏆 Total Wins: ${totalWins}\n\n` +
                   `👑 *VIP Distribution:*\n` +
                   `VIP 1: ${vipDistribution[1]} users\n` +
                   `VIP 2: ${vipDistribution[2]} users\n` +
                   `VIP 3: ${vipDistribution[3]} users\n` +
                   `VIP 4: ${vipDistribution[4]} users\n` +
                   `VIP 5: ${vipDistribution[5]} users`;

    Api.sendMessage({
        text: statsText,
        parse_mode: "Markdown"
    });
}

// Command: /admin_user
// Allows admins to modify specific user data
if (message.startsWith("/admin_user ")) {
    let adminIds = ["123456789"];
    
    if (!adminIds.includes(user.id.toString())) {
        Api.sendMessage({
            text: "❌ Access denied."
        });
        return;
    }

    let parts = message.split(" ");
    if (parts.length < 2) {
        Api.sendMessage({
            text: "Usage: /admin_user <user_id>\nExample: /admin_user 123456789"
        });
        return;
    }

    let targetUserId = parts[1];
    let targetUser = Bot.getProperty("user_" + targetUserId);
    
    if (!targetUser) {
        Api.sendMessage({
            text: "❌ User not found."
        });
        return;
    }

    let keyboard = {
        inline_keyboard: [
            [
                { text: "+100 Stars", callback_data: `admin_add_stars_${targetUserId}` },
                { text: "+500 XP", callback_data: `admin_add_xp_${targetUserId}` }
            ],
            [
                { text: "Reset User", callback_data: `admin_reset_user_${targetUserId}` },
                { text: "Ban User", callback_data: `admin_ban_user_${targetUserId}` }
            ]
        ]
    };

    let userText = `👤 *User Management*\n\n` +
                  `🆔 ID: ${targetUser.id}\n` +
                  `👤 Username: ${targetUser.username}\n` +
                  `💰 Stars: ${targetUser.stars}\n` +
                  `⚡ XP: ${targetUser.xp}\n` +
                  `👑 VIP: ${targetUser.vipLevel}\n` +
                  `🎮 Games: ${targetUser.gamesPlayed}\n` +
                  `🏆 Wins: ${targetUser.gamesWon}`;

    Api.sendMessage({
        text: userText,
        parse_mode: "Markdown",
        reply_markup: keyboard
    });
}

// Command: /admin_broadcast
// Sends message to all users
if (message.startsWith("/admin_broadcast ")) {
    let adminIds = ["123456789"];
    
    if (!adminIds.includes(user.id.toString())) {
        Api.sendMessage({
            text: "❌ Access denied."
        });
        return;
    }

    let broadcastMessage = message.replace("/admin_broadcast ", "");
    
    if (broadcastMessage.length < 5) {
        Api.sendMessage({
            text: "❌ Message too short. Minimum 5 characters."
        });
        return;
    }

    // This would need implementation to iterate through all users
    // For security, showing structure only
    
    Api.sendMessage({
        text: `📢 Broadcast queued!\n\nMessage: "${broadcastMessage}"\n\n⚠️ This will send to all users. Confirm?`,
        reply_markup: {
            inline_keyboard: [
                [
                    { text: "✅ Send", callback_data: `confirm_broadcast_${btoa(broadcastMessage)}` },
                    { text: "❌ Cancel", callback_data: "cancel_broadcast" }
                ]
            ]
        }
    });
}

// Handle admin callback queries
if (request.callback_query && request.callback_query.data.startsWith("admin_")) {
    let data = request.callback_query.data;
    let adminIds = ["123456789"];
    
    if (!adminIds.includes(user.id.toString())) {
        Api.answerCallbackQuery({
            callback_query_id: request.callback_query.id,
            text: "❌ Access denied"
        });
        return;
    }

    Api.answerCallbackQuery({
        callback_query_id: request.callback_query.id
    });

    if (data === "admin_duration") {
        Api.sendMessage({
            text: "⏰ *Set Game Duration*\n\nSend new duration in seconds (30-600):",
            parse_mode: "Markdown"
        });
        Bot.setProperty("admin_waiting_for", "duration");
        
    } else if (data === "admin_fees") {
        Api.sendMessage({
            text: "💰 *Set Entry Fees*\n\nCurrent fees:\n🟩 Majority: 3⭐\n🟦 Minority: 4⭐\n🟥 Market: 5⭐\n\nSend: majority,minority,market\nExample: 3,4,5",
            parse_mode: "Markdown"
        });
        Bot.setProperty("admin_waiting_for", "fees");
        
    } else if (data === "admin_prizes") {
        Api.sendMessage({
            text: "🏆 *Prize Distribution*\n\nCurrent split:\n🏆 Prize Pool: 70%\n💼 Admin Cut: 20%\n⚡ XP Pool: 10%\n\nSend: prize,admin,xp\nExample: 70,20,10",
            parse_mode: "Markdown"
        });
        Bot.setProperty("admin_waiting_for", "prizes");
        
    } else if (data === "admin_bonus") {
        Api.sendMessage({
            text: "🎁 *Daily Bonus Amount*\n\nCurrent: 10⭐ base\n\nSend new base amount (5-100):",
            parse_mode: "Markdown"
        });
        Bot.setProperty("admin_waiting_for", "bonus");
        
    } else if (data === "admin_bots") {
        let settings = Bot.getProperty("admin_settings") || getDefaultAdminSettings();
        settings.simulatedPlayers = !settings.simulatedPlayers;
        Bot.setProperty("admin_settings", settings);
        
        Api.sendMessage({
            text: `🤖 Simulated Players: ${settings.simulatedPlayers ? 'ENABLED' : 'DISABLED'}`
        });
        
    } else if (data.startsWith("admin_add_stars_")) {
        let targetUserId = data.replace("admin_add_stars_", "");
        let targetUser = Bot.getProperty("user_" + targetUserId);
        
        if (targetUser) {
            targetUser.stars += 100;
            Bot.setProperty("user_" + targetUserId, targetUser);
            
            Api.sendMessage({
                text: `✅ Added 100 Stars to user ${targetUserId}`
            });
            
            // Notify the user
            Api.sendMessage({
                chat_id: targetUserId,
                text: "🎁 Admin granted you 100 Stars!"
            });
        }
        
    } else if (data.startsWith("admin_add_xp_")) {
        let targetUserId = data.replace("admin_add_xp_", "");
        let targetUser = Bot.getProperty("user_" + targetUserId);
        
        if (targetUser) {
            targetUser.xp += 500;
            targetUser.vipLevel = calculateVIPLevel(targetUser.xp);
            Bot.setProperty("user_" + targetUserId, targetUser);
            
            Api.sendMessage({
                text: `✅ Added 500 XP to user ${targetUserId}`
            });
            
            // Notify the user
            Api.sendMessage({
                chat_id: targetUserId,
                text: "⚡ Admin granted you 500 XP!"
            });
        }
    }
}

// Handle admin input for settings
let waitingFor = Bot.getProperty("admin_waiting_for");
if (waitingFor && !message.startsWith("/")) {
    let adminIds = ["123456789"];
    
    if (!adminIds.includes(user.id.toString())) {
        return;
    }

    let settings = Bot.getProperty("admin_settings") || getDefaultAdminSettings();
    
    if (waitingFor === "duration") {
        let duration = parseInt(message);
        if (duration >= 30 && duration <= 600) {
            settings.gameDuration = duration * 1000;
            Bot.setProperty("admin_settings", settings);
            Api.sendMessage({
                text: `✅ Game duration set to ${duration} seconds`
            });
        } else {
            Api.sendMessage({
                text: "❌ Invalid duration. Must be 30-600 seconds."
            });
        }
        
    } else if (waitingFor === "fees") {
        let parts = message.split(",");
        if (parts.length === 3) {
            let majority = parseInt(parts[0]);
            let minority = parseInt(parts[1]);
            let market = parseInt(parts[2]);
            
            if (majority > 0 && minority > 0 && market > 0) {
                settings.entryFees = { majority, minority, market };
                Bot.setProperty("admin_settings", settings);
                Api.sendMessage({
                    text: `✅ Entry fees updated:\n🟩 Majority: ${majority}⭐\n🟦 Minority: ${minority}⭐\n🟥 Market: ${market}⭐`
                });
            } else {
                Api.sendMessage({
                    text: "❌ Invalid fees. All must be positive numbers."
                });
            }
        } else {
            Api.sendMessage({
                text: "❌ Invalid format. Use: majority,minority,market"
            });
        }
        
    } else if (waitingFor === "prizes") {
        let parts = message.split(",");
        if (parts.length === 3) {
            let prize = parseInt(parts[0]);
            let admin = parseInt(parts[1]);
            let xp = parseInt(parts[2]);
            
            if (prize + admin + xp === 100 && prize > 0 && admin >= 0 && xp >= 0) {
                settings.poolSplit = { prize, admin, xp };
                Bot.setProperty("admin_settings", settings);
                Api.sendMessage({
                    text: `✅ Prize distribution updated:\n🏆 Prize: ${prize}%\n💼 Admin: ${admin}%\n⚡ XP: ${xp}%`
                });
            } else {
                Api.sendMessage({
                    text: "❌ Invalid distribution. Must total 100%."
                });
            }
        } else {
            Api.sendMessage({
                text: "❌ Invalid format. Use: prize,admin,xp"
            });
        }
        
    } else if (waitingFor === "bonus") {
        let bonus = parseInt(message);
        if (bonus >= 5 && bonus <= 100) {
            settings.dailyBonusAmount = bonus;
            Bot.setProperty("admin_settings", settings);
            Api.sendMessage({
                text: `✅ Daily bonus set to ${bonus}⭐ base amount`
            });
        } else {
            Api.sendMessage({
                text: "❌ Invalid amount. Must be 5-100 Stars."
            });
        }
    }
    
    Bot.setProperty("admin_waiting_for", null);
}

// Helper functions
function getDefaultAdminSettings() {
    return {
        gameDuration: 180000, // 3 minutes
        entryFees: { majority: 3, minority: 4, market: 5 },
        revoteCost: 2,
        poolSplit: { admin: 20, xp: 10, prize: 70 },
        maxPlayers: 100,
        minPlayers: 2,
        simulatedPlayers: true,
        dailyBonusAmount: 10
    };
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