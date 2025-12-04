// ================= IMPORTS =================
const mineflayer = require("mineflayer");
const { pathfinder, Movements, goals } = require("mineflayer-pathfinder");
const Vec3 = require("vec3").Vec3;
const crypto = require("crypto");
const fs = require("fs-extra");
const path = require("path");

// Load configuration
require('dotenv').config();

// ================= CONFIGURATION =================
const CONFIG = {
  SERVER: {
    host: process.env.MINECRAFT_HOST || "gameplannet.aternos.me",
    port: parseInt(process.env.MINECRAFT_PORT) || 34286,
    version: process.env.MINECRAFT_VERSION || "1.21.10",
    auth: process.env.MINECRAFT_AUTH || "offline"
  },
  
  BOTS: {
    count: parseInt(process.env.BOT_COUNT) || 4,
    types: (process.env.BOT_TYPES || "builder,explorer,miner,socializer").split(','),
    usernamePrefix: process.env.BOT_USERNAME_PREFIX || "UltimateBot",
    
    personalities: {
      builder: { build: 0.9, explore: 0.3, mine: 0.4, social: 0.2 },
      explorer: { build: 0.2, explore: 0.9, mine: 0.5, social: 0.3 },
      miner: { build: 0.3, explore: 0.4, mine: 0.9, social: 0.1 },
      socializer: { build: 0.1, explore: 0.2, mine: 0.1, social: 0.9 }
    }
  },
  
  NETWORK: {
    proxyRotation: false, // Disable proxy for now to fix connection
    connectionTimeout: 30000,
    maxReconnectAttempts: 5
  }
};

// ================= GLOBAL STATE =================
class GlobalState {
  constructor() {
    this.bots = new Map();
    this.statistics = {
      totalConnections: 0,
      successfulLogins: 0,
      failedLogins: 0
    };
  }
}

const globalState = new GlobalState();

// ================= BOT CLASS =================
class UltimateBot {
  constructor(name, type) {
    this.name = name;
    this.type = type;
    this.bot = null;
    this.state = {
      health: 20,
      food: 20,
      activity: 'initializing',
      isProcessing: false,
      reconnectAttempts: 0
    };
    
    console.log(`🤖 Created ${type} bot: ${name}`);
  }
  
  async connect() {
    return new Promise((resolve, reject) => {
      try {
        globalState.statistics.totalConnections++;
        
        // Simple connection without proxy for now
        const botConfig = {
          host: CONFIG.SERVER.host,
          port: CONFIG.SERVER.port,
          username: this.name + Math.floor(Math.random() * 1000), // Add random number
          version: CONFIG.SERVER.version,
          auth: CONFIG.SERVER.auth,
          // Remove advanced options that might cause issues
          hideErrors: false,
          checkTimeoutInterval: 30000
        };
        
        console.log(`🔗 ${this.name} connecting to ${CONFIG.SERVER.host}:${CONFIG.SERVER.port}...`);
        
        this.bot = mineflayer.createBot(botConfig);
        
        // Setup basic event handlers
        this.bot.once('spawn', () => {
          console.log(`✅ ${this.name} spawned successfully!`);
          globalState.statistics.successfulLogins++;
          resolve(true);
        });
        
        this.bot.on('health', () => {
          this.state.health = this.bot.health;
          this.state.food = this.bot.food;
        });
        
        this.bot.on('chat', (username, message) => {
          if (username === this.bot.username) return;
          console.log(`💬 ${this.name} heard ${username}: ${message}`);
        });
        
        this.bot.once('error', (error) => {
          console.log(`❌ ${this.name} connection error:`, error.message);
          globalState.statistics.failedLogins++;
          reject(error);
        });
        
        // Set timeout
        setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, CONFIG.NETWORK.connectionTimeout);
        
      } catch (error) {
        console.error(`❌ ${this.name} connection failed:`, error.message);
        reject(error);
      }
    });
  }
  
  async startActivity() {
    if (!this.bot || !this.bot.entity) return;
    
    console.log(`🎯 ${this.name} starting ${this.type} activities`);
    
    // Simple activity based on bot type
    switch (this.type) {
      case 'builder':
        this.bot.chat("I'm ready to build!");
        break;
      case 'explorer':
        this.bot.chat("Time to explore!");
        break;
      case 'miner':
        this.bot.chat("Let's mine some resources!");
        break;
      case 'socializer':
        this.bot.chat("Hello everyone!");
        break;
    }
    
    // Start a simple movement pattern
    this.startMovementPattern();
  }
  
  startMovementPattern() {
    if (!this.bot) return;
    
    setInterval(() => {
      if (!this.bot.entity || this.state.isProcessing) return;
      
      try {
        // Simple random movement
        const controls = ['forward', 'back', 'left', 'right', 'jump'];
        const randomControl = controls[Math.floor(Math.random() * controls.length)];
        const randomState = Math.random() > 0.5;
        
        this.bot.setControlState(randomControl, randomState);
        
        setTimeout(() => {
          if (this.bot) {
            this.bot.setControlState(randomControl, false);
          }
        }, 1000 + Math.random() * 2000);
        
      } catch (error) {
        console.log(`⚠️ ${this.name} movement error:`, error.message);
      }
    }, 5000 + Math.random() * 10000);
  }
  
  disconnect() {
    if (this.bot) {
      this.bot.quit();
      this.bot = null;
      console.log(`🔌 ${this.name} disconnected`);
    }
  }
  
  isConnected() {
    return this.bot !== null && this.bot.entity !== null;
  }
  
  getStatus() {
    return {
      name: this.name,
      type: this.type,
      connected: this.isConnected(),
      health: this.state.health,
      food: this.state.food,
      activity: this.state.activity,
      reconnectAttempts: this.state.reconnectAttempts
    };
  }
}

// ================= BOT MANAGER =================
class BotManager {
  constructor() {
    this.bots = new Map();
    this.active = false;
  }
  
  async initialize() {
    console.log('🤖 Initializing bot manager...');
    
    // Create bots based on configuration
    for (let i = 0; i < CONFIG.BOTS.count; i++) {
      const botType = CONFIG.BOTS.types[i % CONFIG.BOTS.types.length];
      const botName = `${CONFIG.BOTS.usernamePrefix}_${botType}_${i + 1}`;
      
      const bot = new UltimateBot(botName, botType);
      this.bots.set(botName, bot);
      
      // Stagger connections
      setTimeout(async () => {
        try {
          await bot.connect();
          globalState.bots.set(botName, bot);
          console.log(`✅ ${botName} connected and ready`);
          
          // Start activities after a delay
          setTimeout(() => {
            bot.startActivity();
          }, 2000);
          
        } catch (error) {
          console.error(`❌ Failed to connect ${botName}:`, error.message);
          // Try to reconnect
          this.scheduleReconnect(bot);
        }
      }, i * 10000); // 10 seconds between each connection
    }
    
    this.active = true;
    console.log(`✅ Bot manager initialized with ${this.bots.size} bots`);
  }
  
  scheduleReconnect(bot) {
    if (bot.state.reconnectAttempts >= CONFIG.NETWORK.maxReconnectAttempts) {
      console.log(`❌ ${bot.name} max reconnection attempts reached`);
      return;
    }
    
    bot.state.reconnectAttempts++;
    const delay = Math.min(60000, 5000 * Math.pow(2, bot.state.reconnectAttempts));
    
    console.log(`🔄 ${bot.name} reconnecting in ${delay/1000}s...`);
    
    setTimeout(async () => {
      try {
        await bot.connect();
        bot.state.reconnectAttempts = 0;
        bot.startActivity();
      } catch (error) {
        console.error(`❌ ${bot.name} reconnect failed:`, error.message);
        this.scheduleReconnect(bot);
      }
    }, delay);
  }
  
  getBotStatus() {
    const status = [];
    for (const [name, bot] of this.bots) {
      status.push(bot.getStatus());
    }
    return status;
  }
  
  getActiveBots() {
    const active = [];
    for (const [name, bot] of this.bots) {
      if (bot.isConnected()) {
        active.push(bot);
      }
    }
    return active;
  }
  
  stopAll() {
    console.log('🛑 Stopping all bots...');
    for (const [name, bot] of this.bots) {
      bot.disconnect();
    }
    this.active = false;
    console.log('✅ All bots stopped');
  }
}

// ================= MAIN EXECUTION =================
console.log(`
╔══════════════════════════════════════════════════════════╗
║   🎮 ULTIMATE MINECRAFT BOT SYSTEM v7.0                  ║
║   🤖 Starting simplified bot system...                   ║
╚══════════════════════════════════════════════════════════╝
`);

console.log('📋 Configuration:');
console.log(`  Server: ${CONFIG.SERVER.host}:${CONFIG.SERVER.port}`);
console.log(`  Version: ${CONFIG.SERVER.version}`);
console.log(`  Bot Count: ${CONFIG.BOTS.count}`);
console.log(`  Bot Types: ${CONFIG.BOTS.types.join(', ')}`);
console.log('='.repeat(60));

// Create and start bot manager
const botManager = new BotManager();

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Received shutdown signal...');
  botManager.stopAll();
  console.log('🎮 System shutdown complete.');
  process.exit(0);
});

// Start the system
setTimeout(() => {
  botManager.initialize();
}, 2000);

// Export for web server
module.exports = {
  botManager,
  globalState,
  getBotStatus: () => botManager.getBotStatus(),
  getActiveBots: () => botManager.getActiveBots(),
  stopAll: () => botManager.stopAll()
};
