// ================= IMPORTS =================
const mineflayer = require("mineflayer");
const { pathfinder, Movements, goals } = require("mineflayer-pathfinder");
const Vec3 = require("vec3").Vec3;
const crypto = require("crypto");
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

// Load configuration
require('dotenv').config();

// ================= CONFIGURATION =================
const CONFIG = {
  // Server settings
  SERVER: {
    host: process.env.MINECRAFT_HOST || "gameplannet.aternos.me",
    port: parseInt(process.env.MINECRAFT_PORT) || 34286,
    version: process.env.MINECRAFT_VERSION || "1.21.10",
    auth: process.env.MINECRAFT_AUTH || "offline"
  },
  
  // Bot settings
  BOTS: {
    count: parseInt(process.env.BOT_COUNT) || 4,
    types: (process.env.BOT_TYPES || "builder,explorer,miner,socializer").split(','),
    usernamePrefix: process.env.BOT_USERNAME_PREFIX || "UltimateBot",
    
    // Personality weights
    personalities: {
      builder: { build: 0.9, explore: 0.3, mine: 0.4, social: 0.2 },
      explorer: { build: 0.2, explore: 0.9, mine: 0.5, social: 0.3 },
      miner: { build: 0.3, explore: 0.4, mine: 0.9, social: 0.1 },
      socializer: { build: 0.1, explore: 0.2, mine: 0.1, social: 0.9 }
    }
  },
  
  // Network settings
  NETWORK: {
    proxyRotation: process.env.PROXY_ROTATION === 'true',
    ipRotationInterval: parseInt(process.env.IP_ROTATION_INTERVAL) || 1800000, // 30 minutes
    connectionTimeout: 30000,
    maxReconnectAttempts: 20
  },
  
  // AI settings
  AI: {
    enabled: process.env.NEURAL_AI !== 'false',
    decisionInterval: 5000,
    learningRate: 0.1,
    explorationRate: 0.3
  },
  
  // Anti-detection
  ANTI_DETECTION: {
    enabled: process.env.ANTI_DETECTION !== 'false',
    patternBreaking: true,
    failureInjection: 0.05, // 5% chance of failure
    humanDelay: { min: 100, max: 3000 }
  },
  
  // Performance
  PERFORMANCE: {
    maxRamMB: parseInt(process.env.MAX_RAM_MB) || 2048,
    gcInterval: 300000, // 5 minutes
    logLevel: process.env.LOG_LEVEL || 'info'
  }
};

// ================= GLOBAL STATE =================
class GlobalState {
  constructor() {
    this.bots = new Map();
    this.proxies = [];
    this.accounts = [];
    this.activities = new Map();
    this.statistics = {
      totalConnections: 0,
      successfulLogins: 0,
      failedLogins: 0,
      structuresBuilt: 0,
      areasExplored: 0,
      oresMined: 0,
      socialInteractions: 0,
      deaths: 0
    };
    this.startTime = Date.now();
    
    // Initialize managers
    this.initManagers();
  }
  
  async initManagers() {
    console.log('🔄 Initializing system managers...');
    
    try {
      // Load proxies
      this.proxies = await this.loadProxies();
      console.log(`✅ Loaded ${this.proxies.length} proxies`);
      
      // Load accounts
      this.accounts = await this.loadAccounts();
      console.log(`✅ Loaded ${this.accounts.length} accounts`);
      
      // Initialize activities
      this.initActivities();
      
    } catch (error) {
      console.error('❌ Failed to initialize managers:', error);
    }
  }
  
  async loadProxies() {
    try {
      const proxyFile = path.join(__dirname, 'config', 'proxies.json');
      if (await fs.pathExists(proxyFile)) {
        return await fs.readJson(proxyFile);
      }
      
      // Generate default proxies
      return this.generateProxies(100);
    } catch (error) {
      console.error('Failed to load proxies:', error);
      return this.generateProxies(50);
    }
  }
  
  async loadAccounts() {
    try {
      const accountFile = path.join(__dirname, 'config', 'accounts.json');
      if (await fs.pathExists(accountFile)) {
        return await fs.readJson(accountFile);
      }
      
      // Generate default accounts
      return this.generateAccounts(10);
    } catch (error) {
      console.error('Failed to load accounts:', error);
      return this.generateAccounts(5);
    }
  }
  
  generateProxies(count) {
    const proxies = [];
    const proxyTypes = ['residential', 'mobile', 'datacenter'];
    const countries = ['US', 'CA', 'UK', 'DE', 'FR', 'AU', 'JP'];
    
    for (let i = 0; i < count; i++) {
      const type = proxyTypes[Math.floor(Math.random() * proxyTypes.length)];
      const country = countries[Math.floor(Math.random() * countries.length)];
      
      proxies.push({
        id: crypto.randomBytes(8).toString('hex'),
        type: type,
        country: country,
        ip: this.generateRandomIP(country),
        port: this.generateRandomPort(type),
        protocol: Math.random() > 0.5 ? 'http' : 'socks5',
        speed: 20 + Math.random() * 80,
        latency: 10 + Math.random() * 100,
        successRate: 0.85 + Math.random() * 0.14,
        lastUsed: null,
        residential: type === 'residential' || type === 'mobile',
        mobile: type === 'mobile'
      });
    }
    
    return proxies;
  }
  
  generateAccounts(count) {
    const accounts = [];
    const emailProviders = ['gmail.com', 'outlook.com', 'yahoo.com', 'protonmail.com'];
    
    for (let i = 0; i < count; i++) {
      const username = this.generateUsername();
      const provider = emailProviders[Math.floor(Math.random() * emailProviders.length)];
      
      accounts.push({
        id: crypto.randomBytes(8).toString('hex'),
        username: username,
        email: `${username}@${provider}`,
        password: this.generatePassword(),
        created: new Date(Date.now() - Math.random() * 31536000000).toISOString(), // Up to 1 year ago
        lastLogin: null,
        totalPlaytime: Math.floor(Math.random() * 1000) * 60,
        servers: Math.floor(Math.random() * 4) + 1
      });
    }
    
    return accounts;
  }
  
  initActivities() {
    this.activities.set('builder', [
      'build_house', 'build_farm', 'build_wall', 'build_tower',
      'decorate_interior', 'plan_city', 'repair_buildings', 'expand_territory'
    ]);
    
    this.activities.set('explorer', [
      'explore_caves', 'map_terrain', 'find_village', 'locate_temple',
      'discover_mineshaft', 'chart_ocean', 'climb_mountain', 'cross_river'
    ]);
    
    this.activities.set('miner', [
      'mine_diamonds', 'mine_iron', 'mine_gold', 'mine_redstone',
      'dig_tunnel', 'create_mine', 'sort_ores', 'smelt_resources'
    ]);
    
    this.activities.set('socializer', [
      'chat_players', 'trade_items', 'help_newbies', 'organize_event',
      'tell_story', 'mediate_conflict', 'share_resources', 'make_friends'
    ]);
  }
  
  generateRandomIP(country) {
    const ranges = {
      US: ['192.168', '10.0', '172.16'],
      CA: ['192.168', '10.0'],
      UK: ['192.168', '10.0'],
      DE: ['192.168', '10.0'],
      FR: ['192.168', '10.0'],
      AU: ['192.168', '10.0'],
      JP: ['192.168', '10.0']
    };
    
    const range = ranges[country] || ['192.168'];
    const base = range[Math.floor(Math.random() * range.length)];
    
    return `${base}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
  }
  
  generateRandomPort(type) {
    const ports = {
      http: [80, 8080, 8888, 3128],
      socks5: [1080, 1081, 1082],
      residential: [8080, 8888]
    };
    
    const typePorts = ports[type] || [8080];
    return typePorts[Math.floor(Math.random() * typePorts.length)];
  }
  
  generateUsername() {
    const prefixes = ['mine', 'craft', 'build', 'explore', 'adventure', 'game'];
    const suffixes = ['master', 'lord', 'king', 'bot', 'pro', 'expert'];
    const numbers = Math.floor(Math.random() * 10000);
    
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    
    return `${prefix}${suffix}${numbers}`;
  }
  
  generatePassword() {
    const length = 12 + Math.floor(Math.random() * 8);
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    for (let i = 0; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    return password;
  }
  
  getNextProxy() {
    if (this.proxies.length === 0) return null;
    
    // Sort by success rate and last used
    this.proxies.sort((a, b) => {
      if (a.successRate !== b.successRate) return b.successRate - a.successRate;
      return (a.lastUsed || 0) - (b.lastUsed || 0);
    });
    
    const proxy = this.proxies[0];
    proxy.lastUsed = Date.now();
    
    return {
      host: proxy.ip,
      port: proxy.port,
      protocol: proxy.protocol
    };
  }
  
  getNextAccount() {
    if (this.accounts.length === 0) {
      // Generate random username
      return { username: this.generateUsername() };
    }
    
    // Sort by last login
    this.accounts.sort((a, b) => {
      return (a.lastLogin || 0) - (b.lastLogin || 0);
    });
    
    const account = this.accounts[0];
    account.lastLogin = Date.now();
    
    return {
      username: account.username,
      email: account.email,
      accountAge: Math.floor((Date.now() - new Date(account.created).getTime()) / 86400000)
    };
  }
  
  getRandomActivity(botType) {
    const activities = this.activities.get(botType);
    if (!activities || activities.length === 0) return 'idle';
    
    return activities[Math.floor(Math.random() * activities.length)];
  }
  
  logActivity(botName, activity, details = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      bot: botName,
      activity: activity,
      details: details
    };
    
    // Save to log file
    const logDir = path.join(__dirname, 'logs', 'gameplay');
    fs.ensureDirSync(logDir);
    
    const logFile = path.join(logDir, `${new Date().toISOString().split('T')[0]}.log`);
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
    
    // Update statistics
    if (activity.includes('build')) this.statistics.structuresBuilt++;
    else if (activity.includes('explore')) this.statistics.areasExplored++;
    else if (activity.includes('mine')) this.statistics.oresMined++;
    else if (activity.includes('chat') || activity.includes('trade') || activity.includes('social')) {
      this.statistics.socialInteractions++;
    }
    
    return logEntry;
  }
  
  getStats() {
    const uptime = (Date.now() - this.startTime) / 1000;
    
    return {
      ...this.statistics,
      uptime: uptime,
      activeBots: this.bots.size,
      totalProxies: this.proxies.length,
      totalAccounts: this.accounts.length,
      successRate: this.statistics.totalConnections > 0 
        ? (this.statistics.successfulLogins / this.statistics.totalConnections * 100).toFixed(2)
        : 0
    };
  }
}

// Initialize global state
const globalState = new GlobalState();

// ================= BOT CLASS =================
class UltimateBot {
  constructor(name, type, config) {
    this.name = name;
    this.type = type;
    this.config = config;
    this.bot = null;
    this.state = {
      health: 20,
      food: 20,
      position: null,
      inventory: [],
      activity: 'initializing',
      lastActivity: Date.now(),
      isProcessing: false,
      reconnectAttempts: 0,
      personality: CONFIG.BOTS.personalities[type] || CONFIG.BOTS.personalities.builder
    };
    
    this.aiState = {
      decisions: [],
      learnedPaths: new Map(),
      socialMemory: new Map(),
      lastDecision: Date.now()
    };
    
    console.log(`🤖 Created ${type} bot: ${name}`);
  }
  
  async connect() {
    try {
      globalState.statistics.totalConnections++;
      
      // Get proxy if enabled
      let proxy = null;
      if (CONFIG.NETWORK.proxyRotation) {
        proxy = globalState.getNextProxy();
        if (proxy) {
          console.log(`🌐 ${this.name} using proxy: ${proxy.host}:${proxy.port}`);
        }
      }
      
      // Get account
      const account = globalState.getNextAccount();
      
      // Create bot configuration
      const botConfig = {
        host: CONFIG.SERVER.host,
        port: CONFIG.SERVER.port,
        username: account.username || this.name,
        version: CONFIG.SERVER.version,
        auth: CONFIG.SERVER.auth,
        ...(proxy && { proxy: proxy }),
        client: {
          hideErrors: true,
          viewDistance: this.type === 'explorer' ? 'far' : 'normal',
          chatLengthLimit: this.type === 'socializer' ? 512 : 256
        }
      };
      
      console.log(`🔗 ${this.name} connecting to ${CONFIG.SERVER.host}:${CONFIG.SERVER.port}...`);
      
      // Create bot instance
      this.bot = mineflayer.createBot(botConfig);
      
      // Setup event handlers
      this.setupEventHandlers();
      
      // Load plugins
      this.bot.loadPlugin(pathfinder);
      
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, CONFIG.NETWORK.connectionTimeout);
        
        this.bot.once('spawn', () => {
          clearTimeout(timeout);
          globalState.statistics.successfulLogins++;
          resolve(true);
        });
        
        this.bot.once('error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });
      
    } catch (error) {
      globalState.statistics.failedLogins++;
      console.error(`❌ ${this.name} connection failed:`, error.message);
      throw error;
    }
  }
  
  setupEventHandlers() {
    const bot = this.bot;
    
    // Spawn handler
    bot.on('spawn', () => {
      console.log(`✅ ${this.name} spawned successfully!`);
      this.state.position = bot.entity.position.clone();
      
      // Setup movements
      const mcData = require('minecraft-data')(bot.version);
      const defaultMove = new Movements(bot, mcData);
      defaultMove.canDig = true;
      defaultMove.allowParkour = true;
      bot.pathfinder.setMovements(defaultMove);
      
      // Start activity loop
      this.startActivityLoop();
      
      // Start AI decision loop if enabled
      if (CONFIG.AI.enabled) {
        this.startAILoop();
      }
    });
    
    // Health handler
    bot.on('health', () => {
      this.state.health = bot.health;
      this.state.food = bot.food;
      
      if (bot.health < 10) {
        this.triggerEmergencyResponse();
      }
    });
    
    // Death handler
    bot.on('death', () => {
      console.log(`💀 ${this.name} died!`);
      globalState.statistics.deaths++;
      
      // Natural death response
      setTimeout(() => {
        if (bot && !this.bot._isEnding) {
          bot.chat('Ouch! That hurt...');
        }
      }, 2000);
    });
    
    // Chat handler
    bot.on('chat', (username, message) => {
      if (username === bot.username) return;
      
      console.log(`💬 ${this.name} received from ${username}: ${message}`);
      
      // Store in social memory
      if (!this.aiState.socialMemory.has(username)) {
        this.aiState.socialMemory.set(username, {
          interactions: [],
          firstMet: Date.now(),
          relationship: 0.5
        });
      }
      
      const memory = this.aiState.socialMemory.get(username);
      memory.interactions.push({
        type: 'chat',
        message: message,
        time: Date.now()
      });
      
      // Generate response based on personality
      if (Math.random() < this.state.personality.social) {
        setTimeout(() => {
          if (bot && !this.bot._isEnding) {
            const response = this.generateChatResponse(username, message);
            if (response) {
              bot.chat(response);
              console.log(`💬 ${this.name} responded: ${response}`);
              globalState.statistics.socialInteractions++;
            }
          }
        }, 1000 + Math.random() * 2000);
      }
    });
    
    // Disconnect handler
    bot.on('end', (reason) => {
      console.log(`🔌 ${this.name} disconnected: ${reason}`);
      
      // Auto-reconnect logic
      if (this.state.reconnectAttempts < CONFIG.NETWORK.maxReconnectAttempts) {
        this.state.reconnectAttempts++;
        const delay = Math.min(30000, 5000 * Math.pow(1.5, this.state.reconnectAttempts));
        
        console.log(`🔄 ${this.name} reconnecting in ${delay/1000}s...`);
        
        setTimeout(async () => {
          try {
            await this.connect();
            this.state.reconnectAttempts = 0;
          } catch (error) {
            console.error(`❌ ${this.name} reconnect failed:`, error.message);
          }
        }, delay);
      } else {
        console.error(`❌ ${this.name} max reconnection attempts reached`);
      }
    });
    
    // Error handler
    bot.on('error', (error) => {
      console.error(`⚠️ ${this.name} error:`, error.message);
      
      // Anti-detection: sometimes let errors happen naturally
      if (CONFIG.ANTI_DETECTION.enabled && 
          Math.random() < CONFIG.ANTI_DETECTION.failureInjection) {
        console.log(`🛡️ Anti-detection: Allowing natural error for ${this.name}`);
        return;
      }
    });
    
    // Player join/leave
    bot.on('playerJoined', (player) => {
      if (player.username !== bot.username) {
        console.log(`👋 ${this.name} sees ${player.username} joined`);
        
        if (this.type === 'socializer' && Math.random() < 0.7) {
          setTimeout(() => {
            if (bot && !this.bot._isEnding) {
              bot.chat(`Welcome ${player.username}!`);
            }
          }, 2000);
        }
      }
    });
  }
  
  startActivityLoop() {
    setInterval(async () => {
      if (this.state.isProcessing || !this.bot || !this.bot.entity) return;
      
      this.state.isProcessing = true;
      
      try {
        // Get random activity based on bot type
        const activity = globalState.getRandomActivity(this.type);
        this.state.activity = activity;
        
        // Log activity
        globalState.logActivity(this.name, activity);
        
        // Execute activity
        await this.executeActivity(activity);
        
        // Update state
        this.state.lastActivity = Date.now();
        this.state.isProcessing = false;
        
      } catch (error) {
        console.error(`❌ ${this.name} activity error:`, error.message);
        this.state.isProcessing = false;
      }
    }, 10000 + Math.random() * 20000); // 10-30 seconds between activities
  }
  
  async executeActivity(activity) {
    console.log(`🎯 ${this.name} executing: ${activity}`);
    
    switch (activity) {
      case 'build_house':
        await this.buildHouse();
        break;
      case 'explore_caves':
        await this.exploreCaves();
        break;
      case 'mine_diamonds':
        await this.mineDiamonds();
        break;
      case 'chat_players':
        await this.chatWithPlayers();
        break;
      case 'build_farm':
        await this.buildFarm();
        break;
      case 'map_terrain':
        await this.mapTerrain();
        break;
      case 'mine_iron':
        await this.mineIron();
        break;
      case 'trade_items':
        await this.tradeItems();
        break;
      default:
        // Generic activity
        await this.genericActivity(activity);
    }
  }
  
  async buildHouse() {
    const bot = this.bot;
    if (!bot || !bot.entity) return;
    
    console.log(`🏗️ ${this.name} building a house...`);
    
    // Find a suitable location
    const startPos = bot.entity.position.floored();
    const materials = this.findBuildingMaterials();
    
    if (materials.length === 0) {
      console.log(`🏗️ ${this.name} needs materials, gathering...`);
      await this.gatherMaterials();
      return;
    }
    
    // Simple house building algorithm
    const houseSize = { width: 5, depth: 5, height: 4 };
    
    for (let x = 0; x < houseSize.width; x++) {
      for (let z = 0; z < houseSize.depth; z++) {
        for (let y = 0; y < houseSize.height; y++) {
          // Build walls
          if (x === 0 || x === houseSize.width - 1 || 
              z === 0 || z === houseSize.depth - 1 || 
              y === 0 || y === houseSize.height - 1) {
            
            const blockPos = startPos.offset(x, y, z);
            
            // Check if we can place block here
            const currentBlock = bot.blockAt(blockPos);
            if (currentBlock && currentBlock.name === 'air') {
              // Find block to place against
              const below = bot.blockAt(blockPos.offset(0, -1, 0));
              if (below && below.name !== 'air') {
                // Move to position
                try {
                  await bot.pathfinder.goto(
                    new goals.GoalNear(blockPos.x - 1, blockPos.y, blockPos.z, 1)
                  );
                  
                  // Try to place block
                  await this.placeBlock(below, new Vec3(0, 1, 0));
                } catch (error) {
                  console.log(`🏗️ ${this.name} building error:`, error.message);
                }
              }
            }
          }
        }
      }
    }
    
    console.log(`✅ ${this.name} finished building house`);
  }
  
  async exploreCaves() {
    const bot = this.bot;
    if (!bot || !bot.entity) return;
    
    console.log(`🗺️ ${this.name} exploring caves...`);
    
    // Look for caves nearby
    const caveBlocks = bot.findBlocks({
      point: bot.entity.position,
      maxDistance: 30,
      matching: (block) => {
        const name = block.name.toLowerCase();
        return name.includes('cave') || name.includes('stone') || name.includes('dirt');
      },
      count: 10
    });
    
    if (caveBlocks.length > 0) {
      const target = caveBlocks[Math.floor(Math.random() * caveBlocks.length)];
      
      try {
        await bot.pathfinder.goto(new goals.GoalNear(target.x, target.y, target.z, 2));
        console.log(`✅ ${this.name} reached cave at ${target.x}, ${target.y}, ${target.z}`);
        
        // Look around
        bot.look(bot.entity.yaw + Math.PI / 2, 0, false);
        await this.delay(2000);
        bot.look(bot.entity.yaw - Math.PI / 2, 0, false);
        
      } catch (error) {
        console.log(`🗺️ ${this.name} exploration error:`, error.message);
      }
    } else {
      // Move randomly
      const randomDirection = new Vec3(
        (Math.random() - 0.5) * 20,
        0,
        (Math.random() - 0.5) * 20
      );
      
      const target = bot.entity.position.plus(randomDirection);
      
      try {
        await bot.pathfinder.goto(new goals.GoalNear(target.x, target.y, target.z, 3));
      } catch (error) {
        console.log(`🗺️ ${this.name} random movement error:`, error.message);
      }
    }
  }
  
  async mineDiamonds() {
    const bot = this.bot;
    if (!bot || !bot.entity) return;
    
    console.log(`⛏️ ${this.name} mining for diamonds...`);
    
    // Go to suitable mining level (Y < 16 for diamonds)
    if (bot.entity.position.y > 16) {
      const undergroundPos = bot.entity.position.offset(0, -10, 0);
      try {
        await bot.pathfinder.goto(new goals.GoalNear(undergroundPos.x, undergroundPos.y, undergroundPos.z, 3));
      } catch (error) {
        console.log(`⛏️ ${this.name} digging down error:`, error.message);
      }
    }
    
    // Look for diamond ore
    const diamondBlocks = bot.findBlocks({
      point: bot.entity.position,
      maxDistance: 10,
      matching: (block) => block.name === 'diamond_ore',
      count: 5
    });
    
    if (diamondBlocks.length > 0) {
      const target = diamondBlocks[0];
      
      try {
        await bot.pathfinder.goto(new goals.GoalNear(target.x, target.y, target.z, 1));
        
        // Mine the block
        const block = bot.blockAt(target);
        if (block && bot.canDigBlock(block)) {
          await bot.dig(block);
          console.log(`💎 ${this.name} found diamonds!`);
        }
      } catch (error) {
        console.log(`⛏️ ${this.name} mining error:`, error.message);
      }
    } else {
      // Dig in a straight line (strip mining)
      const direction = new Vec3(
        Math.random() > 0.5 ? 1 : -1,
        0,
        0
      );
      
      for (let i = 0; i < 5; i++) {
        const digPos = bot.entity.position.plus(direction.scaled(i));
        const block = bot.blockAt(digPos);
        
        if (block && bot.canDigBlock(block) && block.name !== 'bedrock') {
          try {
            await bot.dig(block);
            await this.delay(1000);
          } catch (error) {
            break;
          }
        }
      }
    }
  }
  
  async chatWithPlayers() {
    const bot = this.bot;
    if (!bot || !bot.entity) return;
    
    // Get other players
    const players = Object.keys(bot.players).filter(name => name !== bot.username);
    
    if (players.length > 0) {
      const player = players[Math.floor(Math.random() * players.length)];
      
      const greetings = [
        `Hello ${player}!`,
        `Hi ${player}, how's it going?`,
        `Hey ${player}, nice to see you!`,
        `${player}! Long time no see!`
      ];
      
      const questions = [
        `What are you working on?`,
        `Found anything interesting lately?`,
        `Need any help with anything?`,
        `Want to team up on something?`
      ];
      
      const messages = [
        `The weather's nice for mining today!`,
        `I just built a new house over there.`,
        `Found some diamonds earlier!`,
        `This server is really fun.`
      ];
      
      // Choose random chat type
      const chatType = Math.random();
      
      if (chatType < 0.3) {
        bot.chat(greetings[Math.floor(Math.random() * greetings.length)]);
      } else if (chatType < 0.6) {
        bot.chat(questions[Math.floor(Math.random() * questions.length)]);
      } else {
        bot.chat(messages[Math.floor(Math.random() * messages.length)]);
      }
      
      console.log(`💬 ${this.name} chatting with ${player}`);
    }
  }
  
  async buildFarm() {
    const bot = this.bot;
    if (!bot || !bot.entity) return;
    
    console.log(`🌾 ${this.name} building a farm...`);
    
    // Simple farm: 5x5 area
    const startPos = bot.entity.position.floored();
    const farmSize = 5;
    
    for (let x = 0; x < farmSize; x++) {
      for (let z = 0; z < farmSize; z++) {
        const farmPos = startPos.offset(x, 0, z);
        const block = bot.blockAt(farmPos);
        
        if (block && block.name === 'grass_block' || block.name === 'dirt') {
          // Hoe the ground
          try {
            await bot.pathfinder.goto(new goals.GoalNear(farmPos.x, farmPos.y, farmPos.z, 1));
            
            // Look for hoe in inventory
            const hoe = bot.inventory.items().find(item => 
              item.name.includes('hoe')
            );
            
            if (hoe) {
              await bot.equip(hoe, 'hand');
              await bot.activateBlock(block);
            }
          } catch (error) {
            console.log(`🌾 ${this.name} farming error:`, error.message);
          }
        }
      }
    }
    
    console.log(`✅ ${this.name} finished building farm`);
  }
  
  async mapTerrain() {
    const bot = this.bot;
    if (!bot || !bot.entity) return;
    
    console.log(`🗺️ ${this.name} mapping terrain...`);
    
    // Move to high ground
    const highPos = bot.entity.position.offset(0, 10, 0);
    
    try {
      await bot.pathfinder.goto(new goals.GoalNear(highPos.x, highPos.y, highPos.z, 3));
      
      // Look around 360 degrees
      for (let i = 0; i < 4; i++) {
        bot.look(bot.entity.yaw + (Math.PI / 2) * i, -0.3, false);
        await this.delay(1000);
      }
      
      console.log(`✅ ${this.name} surveyed the area`);
      
    } catch (error) {
      console.log(`🗺️ ${this.name} mapping error:`, error.message);
    }
  }
  
  async mineIron() {
    const bot = this.bot;
    if (!bot || !bot.entity) return;
    
    console.log(`⛏️ ${this.name} mining iron...`);
    
    // Look for iron ore
    const ironBlocks = bot.findBlocks({
      point: bot.entity.position,
      maxDistance: 15,
      matching: (block) => block.name === 'iron_ore',
      count: 5
    });
    
    if (ironBlocks.length > 0) {
      const target = ironBlocks[0];
      
      try {
        await bot.pathfinder.goto(new goals.GoalNear(target.x, target.y, target.z, 1));
        
        const block = bot.blockAt(target);
        if (block && bot.canDigBlock(block)) {
          await bot.dig(block);
          console.log(`🪨 ${this.name} mined iron ore`);
        }
      } catch (error) {
        console.log(`⛏️ ${this.name} mining error:`, error.message);
      }
    } else {
      // Dig straight down a bit (careful of lava!)
      const digPos = bot.entity.position.offset(0, -1, 0);
      const block = bot.blockAt(digPos);
      
      if (block && bot.canDigBlock(block) && block.name !== 'lava' && block.name !== 'bedrock') {
        try {
          await bot.dig(block);
          await this.delay(500);
        } catch (error) {
          console.log(`⛏️ ${this.name} digging error:`, error.message);
        }
      }
    }
  }
  
  async tradeItems() {
    const bot = this.bot;
    if (!bot || !bot.entity) return;
    
    console.log(`🤝 ${this.name} looking to trade...`);
    
    // Find villagers or players
    const players = Object.keys(bot.players).filter(name => name !== bot.username);
    
    if (players.length > 0) {
      const player = players[Math.floor(Math.random() * players.length)];
      
      const tradeOffers = [
        `Anyone want to trade iron for diamonds?`,
        `I have extra wood, need stone!`,
        `Trading food for tools!`,
        `Looking for redstone, have gold to trade!`
      ];
      
      bot.chat(tradeOffers[Math.floor(Math.random() * tradeOffers.length)]);
    } else {
      bot.chat(`Looking to trade items with anyone!`);
    }
  }
  
  async genericActivity(activity) {
    const bot = this.bot;
    if (!bot || !bot.entity) return;
    
    // Generic activity: move around and interact
    const randomDirection = new Vec3(
      (Math.random() - 0.5) * 10,
      0,
      (Math.random() - 0.5) * 10
    );
    
    const target = bot.entity.position.plus(randomDirection);
    
    try {
      await bot.pathfinder.goto(new goals.GoalNear(target.x, target.y, target.z, 3));
      
      // Random action at destination
      const actions = [
        () => bot.look(bot.entity.yaw + Math.PI, 0, false),
        () => bot.swingArm('right'),
        () => bot.setControlState('jump', true),
        () => bot.activateItem()
      ];
      
      const action = actions[Math.floor(Math.random() * actions.length)];
      action();
      await this.delay(1000);
      bot.setControlState('jump', false);
      
    } catch (error) {
      console.log(`🎯 ${this.name} activity error:`, error.message);
    }
  }
  
  async gatherMaterials() {
    const bot = this.bot;
    if (!bot || !bot.entity) return;
    
    console.log(`🪵 ${this.name} gathering materials...`);
    
    // Look for trees
    const treeBlocks = bot.findBlocks({
      point: bot.entity.position,
      maxDistance: 20,
      matching: (block) => block.name.includes('log'),
      count: 5
    });
    
    if (treeBlocks.length > 0) {
      const target = treeBlocks[0];
      
      try {
        await bot.pathfinder.goto(new goals.GoalNear(target.x, target.y, target.z, 1));
        
        const block = bot.blockAt(target);
        if (block && bot.canDigBlock(block)) {
          await bot.dig(block);
          console.log(`🪵 ${this.name} gathered wood`);
        }
      } catch (error) {
        console.log(`🪵 ${this.name} gathering error:`, error.message);
      }
    }
  }
  
  findBuildingMaterials() {
    const bot = this.bot;
    if (!bot) return [];
    
    const inventory = bot.inventory.items();
    return inventory.filter(item => 
      item.name.includes('planks') || 
      item.name.includes('stone') || 
      item.name.includes('brick') ||
      item.name.includes('log')
    );
  }
  
  async placeBlock(referenceBlock, faceVector) {
    const bot = this.bot;
    if (!bot) return false;
    
    try {
      await bot.placeBlock(referenceBlock, faceVector);
      return true;
    } catch (error) {
      console.log(`🧱 ${this.name} placement error:`, error.message);
      return false;
    }
  }
  
  generateChatResponse(username, message) {
    const lowerMsg = message.toLowerCase();
    
    // Simple response logic
    if (lowerMsg.includes('hi') || lowerMsg.includes('hello') || lowerMsg.includes('hey')) {
      const responses = ['Hi!', 'Hello!', 'Hey there!', 'Howdy!'];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    if (lowerMsg.includes('how are you') || lowerMsg.includes('how do you do')) {
      const responses = ['Great!', 'Good thanks!', 'Doing well!', 'Pretty good!'];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    if (lowerMsg.includes('what are you doing') || lowerMsg.includes('what you up to')) {
      return `I'm ${this.state.activity.replace(/_/g, ' ')} right now!`;
    }
    
    if (lowerMsg.includes('help')) {
      const responses = [
        'What do you need help with?',
        'I can help!',
        'Sure, what do you need?'
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    if (lowerMsg.includes('thank') || lowerMsg.includes('thanks')) {
      const responses = ['You\'re welcome!', 'No problem!', 'Happy to help!'];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    // Random response based on personality
    if (Math.random() < this.state.personality.social * 0.5) {
      const randomResponses = [
        'Nice weather for Minecraft!',
        'This server is fun!',
        'I love building things.',
        'Exploring is my favorite!'
      ];
      return randomResponses[Math.floor(Math.random() * randomResponses.length)];
    }
    
    return null; // Sometimes don't respond
  }
  
  triggerEmergencyResponse() {
    console.log(`🚨 ${this.name} emergency! Health: ${this.state.health}`);
    
    const responses = {
      builder: 'Need healing! My construction is at risk!',
      explorer: 'Danger! Retreating to safety!',
      miner: 'Cave-in! Getting out!',
      socializer: 'Help! I\'m hurt!'
    };
    
    const response = responses[this.type] || 'Need help!';
    
    if (this.bot && !this.bot._isEnding) {
      this.bot.chat(response);
    }
    
    // Try to find safety
    if (this.bot && this.bot.entity) {
      const safePos = this.bot.entity.position.offset(0, 0, 10); // Move away
      try {
        this.bot.pathfinder.goto(new goals.GoalNear(safePos.x, safePos.y, safePos.z, 3));
      } catch (error) {
        // Ignore movement errors in emergency
      }
    }
  }
  
  startAILoop() {
    setInterval(() => {
      if (!this.bot || !this.bot.entity || this.state.isProcessing) return;
      
      this.makeAIDecision();
      
    }, CONFIG.AI.decisionInterval);
  }
  
  makeAIDecision() {
    // Simple AI decision making
    const decisions = [];
    
    // Health-based decisions
    if (this.state.health < 10) {
      decisions.push({ action: 'seek_safety', priority: 10 });
    }
    
    // Food-based decisions
    if (this.state.food < 10) {
      decisions.push({ action: 'find_food', priority: 8 });
    }
    
    // Time-based decisions
    const time = this.bot.time.timeOfDay % 24000;
    if (time > 13000 && time < 23000) { // Night time
      decisions.push({ action: 'find_shelter', priority: 7 });
    }
    
    // Personality-based decisions
    if (Math.random() < this.state.personality.build) {
      decisions.push({ action: 'build_something', priority: 6 });
    }
    
    if (Math.random() < this.state.personality.explore) {
      decisions.push({ action: 'explore_area', priority: 5 });
    }
    
    if (Math.random() < this.state.personality.mine) {
      decisions.push({ action: 'mine_resources', priority: 5 });
    }
    
    if (Math.random() < this.state.personality.social) {
      decisions.push({ action: 'socialize', priority: 4 });
    }
    
    // Sort by priority and execute highest
    decisions.sort((a, b) => b.priority - a.priority);
    
    if (decisions.length > 0) {
      const decision = decisions[0];
      this.aiState.decisions.push({
        decision: decision.action,
        timestamp: Date.now(),
        priority: decision.priority
      });
      
      // Keep only recent decisions
      if (this.aiState.decisions.length > 20) {
        this.aiState.decisions = this.aiState.decisions.slice(-20);
      }
      
      this.aiState.lastDecision = Date.now();
    }
  }
  
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  disconnect() {
    if (this.bot && !this.bot._isEnding) {
      this.bot.end('Manual disconnect');
      this.bot = null;
    }
  }
  
  isConnected() {
    return this.bot !== null && !this.bot._isEnding;
  }
  
  getStatus() {
    return {
      name: this.name,
      type: this.type,
      connected: this.isConnected(),
      health: this.state.health,
      food: this.state.food,
      activity: this.state.activity,
      position: this.state.position ? {
        x: Math.floor(this.state.position.x),
        y: Math.floor(this.state.position.y),
        z: Math.floor(this.state.position.z)
      } : null,
      reconnectAttempts: this.state.reconnectAttempts,
      lastActivity: new Date(this.state.lastActivity).toISOString()
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
      
      const bot = new UltimateBot(botName, botType, CONFIG);
      this.bots.set(botName, bot);
      
      // Stagger connections
      setTimeout(async () => {
        try {
          await bot.connect();
          globalState.bots.set(botName, bot);
          console.log(`✅ ${botName} connected and ready`);
        } catch (error) {
          console.error(`❌ Failed to connect ${botName}:`, error.message);
        }
      }, i * 5000); // 5 seconds between each connection
    }
    
    this.active = true;
    console.log(`✅ Bot manager initialized with ${this.bots.size} bots`);
    
    // Start maintenance loop
    this.startMaintenanceLoop();
  }
  
  startMaintenanceLoop() {
    setInterval(() => {
      this.performMaintenance();
    }, 60000); // Every minute
  }
  
  performMaintenance() {
    // Rotate proxies if enabled
    if (CONFIG.NETWORK.proxyRotation) {
      const rotationTime = CONFIG.NETWORK.ipRotationInterval;
      const lastRotation = globalState.proxies[0]?.lastUsed || 0;
      
      if (Date.now() - lastRotation > rotationTime) {
        console.log('🔄 Performing proxy rotation...');
        this.rotateProxies();
      }
    }
    
    // Check for disconnected bots
    let disconnectedCount = 0;
    for (const [name, bot] of this.bots) {
      if (!bot.isConnected()) {
        disconnectedCount++;
      }
    }
    
    if (disconnectedCount > CONFIG.BOTS.count / 2) {
      console.warn(`⚠️ High bot disconnection rate: ${disconnectedCount}/${this.bots.size}`);
    }
    
    // Log statistics
    const stats = globalState.getStats();
    console.log(`📊 Stats: ${stats.successfulLogins} logins, ${stats.areasExplored} areas, ${stats.oresMined} ores`);
  }
  
  rotateProxies() {
    // Shuffle proxies
    const shuffled = [...globalState.proxies];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    globalState.proxies = shuffled;
    console.log(`🔀 Rotated ${shuffled.length} proxies`);
    
    // Reconnect bots with new proxies
    for (const [name, bot] of this.bots) {
      if (bot.isConnected()) {
        setTimeout(() => {
          bot.disconnect();
          setTimeout(async () => {
            try {
              await bot.connect();
            } catch (error) {
              console.error(`❌ Failed to reconnect ${name} after proxy rotation:`, error.message);
            }
          }, 2000);
        }, Math.random() * 10000); // Stagger reconnections
      }
    }
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
║   🤖 Starting bot system...                             ║
╚══════════════════════════════════════════════════════════╝
`);

console.log('📋 Configuration:');
console.log(`  Server: ${CONFIG.SERVER.host}:${CONFIG.SERVER.port}`);
console.log(`  Version: ${CONFIG.SERVER.version}`);
console.log(`  Bot Count: ${CONFIG.BOTS.count}`);
console.log(`  Bot Types: ${CONFIG.BOTS.types.join(', ')}`);
console.log(`  Proxy Rotation: ${CONFIG.NETWORK.proxyRotation ? 'ENABLED' : 'DISABLED'}`);
console.log(`  Neural AI: ${CONFIG.AI.enabled ? 'ENABLED' : 'DISABLED'}`);
console.log(`  Anti-Detection: ${CONFIG.ANTI_DETECTION.enabled ? 'ENABLED' : 'DISABLED'}`);
console.log('='.repeat(60));

// Create and start bot manager
const botManager = new BotManager();

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Received shutdown signal...');
  botManager.stopAll();
  
  // Save statistics
  const stats = globalState.getStats();
  const statsFile = path.join(__dirname, 'logs', 'system', 'stats.json');
  fs.ensureDirSync(path.dirname(statsFile));
  fs.writeJsonSync(statsFile, stats, { spaces: 2 });
  
  console.log('📊 Statistics saved');
  console.log('🎮 System shutdown complete.');
  process.exit(0);
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('🔥 Uncaught exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🔥 Unhandled rejection at:', promise, 'reason:', reason);
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
  getStats: () => globalState.getStats(),
  getActiveBots: () => botManager.getActiveBots(),
  rotateProxies: () => botManager.rotateProxies(),
  stopAll: () => botManager.stopAll()
};
