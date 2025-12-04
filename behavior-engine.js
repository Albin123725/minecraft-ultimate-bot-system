const fs = require('fs-extra');
const path = require('path');
const cron = require('node-cron');

class BehaviorEngine {
  constructor() {
    this.behaviors = new Map();
    this.schedules = new Map();
    this.activeBehaviors = new Map();
    this.learningData = [];
    
    this.loadPatterns();
    this.setupGlobalSchedules();
  }
  
  async loadPatterns() {
    try {
      const patternsFile = path.join(__dirname, 'config', 'behaviors.json');
      if (await fs.pathExists(patternsFile)) {
        const patterns = await fs.readJson(patternsFile);
        this.behaviors = new Map(Object.entries(patterns));
        console.log(`✅ Loaded ${this.behaviors.size} behavior patterns`);
      } else {
        await this.generateDefaultPatterns();
      }
    } catch (error) {
      console.error('❌ Failed to load behavior patterns:', error.message);
      await this.generateDefaultPatterns();
    }
  }
  
  async generateDefaultPatterns() {
    console.log('🔄 Generating default behavior patterns...');
    
    const patterns = {
      // Daily patterns
      weekday_morning: {
        type: 'time_based',
        schedule: '0 8 * * 1-5',
        behaviors: [
          { action: 'login', probability: 0.8 },
          { action: 'check_inventory', probability: 0.9 },
          { action: 'plan_day', probability: 0.7 },
          { action: 'light_farming', probability: 0.6 }
        ],
        duration: '2h',
        intensity: 'medium'
      },
      
      weekday_evening: {
        type: 'time_based',
        schedule: '0 18 * * 1-5',
        behaviors: [
          { action: 'login', probability: 0.9 },
          { action: 'group_activity', probability: 0.7 },
          { action: 'major_project', probability: 0.6 },
          { action: 'socialize', probability: 0.8 }
        ],
        duration: '4h',
        intensity: 'high'
      },
      
      weekend_day: {
        type: 'time_based',
        schedule: '0 10 * * 6,0',
        behaviors: [
          { action: 'login', probability: 0.95 },
          { action: 'extended_play', probability: 0.8 },
          { action: 'special_event', probability: 0.5 },
          { action: 'exploration', probability: 0.7 }
        ],
        duration: '6h',
        intensity: 'very_high'
      },
      
      // Personality patterns
      builder_personality: {
        type: 'personality',
        traits: ['organized', 'creative', 'patient', 'perfectionist'],
        behaviors: [
          { action: 'measure_twice', probability: 0.9 },
          { action: 'gather_before_build', probability: 0.8 },
          { action: 'symmetry_check', probability: 0.7 },
          { action: 'ask_for_feedback', probability: 0.6 }
        ],
        intensity: 'consistent'
      },
      
      explorer_personality: {
        type: 'personality',
        traits: ['curious', 'risk_taker', 'independent', 'observant'],
        behaviors: [
          { action: 'take_notes', probability: 0.8 },
          { action: 'risk_assessment', probability: 0.7 },
          { action: 'share_discoveries', probability: 0.6 },
          { action: 'push_boundaries', probability: 0.5 }
        ],
        intensity: 'variable'
      },
      
      miner_personality: {
        type: 'personality',
        traits: ['persistent', 'systematic', 'risk_averse', 'goal_oriented'],
        behaviors: [
          { action: 'safety_first', probability: 0.9 },
          { action: 'efficiency_check', probability: 0.8 },
          { action: 'resource_management', probability: 0.7 },
          { action: 'upgrade_equipment', probability: 0.6 }
        ],
        intensity: 'steady'
      },
      
      socializer_personality: {
        type: 'personality',
        traits: ['empathetic', 'communicative', 'helpful', 'diplomatic'],
        behaviors: [
          { action: 'greet_everyone', probability: 0.9 },
          { action: 'mediate_conflict', probability: 0.7 },
          { action: 'organize_events', probability: 0.6 },
          { action: 'check_on_others', probability: 0.8 }
        ],
        intensity: 'social'
      }
    };
    
    this.behaviors = new Map(Object.entries(patterns));
    
    // Save patterns
    await this.savePatterns();
    console.log(`✅ Generated ${this.behaviors.size} behavior patterns`);
  }
  
  async savePatterns() {
    const patterns = Object.fromEntries(this.behaviors);
    const patternsFile = path.join(__dirname, 'config', 'behaviors.json');
    await fs.ensureDir(path.dirname(patternsFile));
    await fs.writeJson(patternsFile, patterns, { spaces: 2 });
  }
  
  setupGlobalSchedules() {
    // Setup cron jobs for time-based patterns
    for (const [name, pattern] of this.behaviors) {
      if (pattern.type === 'time_based' && pattern.schedule) {
        try {
          cron.schedule(pattern.schedule, () => {
            this.activatePattern(name);
          });
          console.log(`⏰ Scheduled pattern: ${name}`);
        } catch (error) {
          console.error(`❌ Failed to schedule pattern ${name}:`, error.message);
        }
      }
    }
    
    console.log('✅ Global behavior schedules setup complete');
  }
  
  activatePattern(patternName) {
    const pattern = this.behaviors.get(patternName);
    if (!pattern) return;
    
    console.log(`🎭 Activating behavior pattern: ${patternName}`);
    
    // Apply pattern to all active bots
    this.applyPatternToBots(pattern);
    
    // Log activation
    this.logPatternActivation(patternName, pattern);
  }
  
  applyPatternToBots(pattern) {
    console.log(`🎭 Applying ${pattern.type} pattern to bots`);
    
    // Get bot manager (assuming it's available globally or via require)
    try {
      const botManager = require('./bot').botManager;
      if (botManager && botManager.getActiveBots) {
        const activeBots = botManager.getActiveBots();
        
        activeBots.forEach(bot => {
          pattern.behaviors.forEach(behavior => {
            if (Math.random() < behavior.probability) {
              this.executeBehavior(bot, behavior.action);
            }
          });
        });
      }
    } catch (error) {
      console.error('❌ Could not apply pattern to bots:', error.message);
    }
  }
  
  startBotBehavior(bot, botType) {
    console.log(`🎭 Starting behavior engine for ${bot.username} (${botType})`);
    
    // Load personality pattern
    const personalityKey = `${botType}_personality`;
    const personality = this.behaviors.get(personalityKey);
    
    if (personality) {
      bot.behaviorPattern = personality;
      bot.currentBehaviors = [];
      
      // Apply personality traits
      this.applyPersonality(bot, personality);
    }
    
    // Setup bot-specific schedules
    this.setupBotSchedules(bot, botType);
    
    // Start behavior loop
    this.startBehaviorLoop(bot, botType);
    
    // Store reference
    this.activeBehaviors.set(bot.username, {
      bot: bot,
      type: botType,
      pattern: personality,
      schedules: []
    });
    
    return true;
  }
  
  applyPersonality(bot, personality) {
    console.log(`🎭 Applying ${personality.traits.join(', ')} personality to ${bot.username}`);
    
    // Store traits for reference
    bot.personalityTraits = personality.traits;
    
    // Apply initial behaviors
    personality.behaviors.forEach(behavior => {
      if (Math.random() < behavior.probability) {
        this.addBotBehavior(bot, behavior.action);
      }
    });
  }
  
  setupBotSchedules(bot, botType) {
    const schedules = {
      builder: [
        { time: '0 9 * * *', action: 'morning_inspection' },
        { time: '0 14 * * *', action: 'afternoon_build' },
        { time: '0 20 * * *', action: 'evening_planning' }
      ],
      explorer: [
        { time: '0 10 * * *', action: 'morning_exploration' },
        { time: '0 16 * * *', action: 'afternoon_mapping' },
        { time: '0 22 * * *', action: 'evening_report' }
      ],
      miner: [
        { time: '0 8 * * *', action: 'morning_mine' },
        { time: '0 13 * * *', action: 'afternoon_smelt' },
        { time: '0 19 * * *', action: 'evening_sort' }
      ],
      socializer: [
        { time: '0 11 * * *', action: 'morning_greetings' },
        { time: '0 17 * * *', action: 'afternoon_social' },
        { time: '0 21 * * *', action: 'evening_events' }
      ]
    };
    
    const botSchedules = schedules[botType] || schedules.builder;
    const botInfo = this.activeBehaviors.get(bot.username);
    
    if (!botInfo) return;
    
    botSchedules.forEach(schedule => {
      try {
        const job = cron.schedule(schedule.time, () => {
          if (bot.entity && !bot._isEnding) {
            console.log(`⏰ ${bot.username} scheduled: ${schedule.action}`);
            this.executeScheduledAction(bot, schedule.action);
          }
        });
        
        botInfo.schedules.push(job);
      } catch (error) {
        console.error(`❌ Failed to schedule for ${bot.username}:`, error.message);
      }
    });
  }
  
  startBehaviorLoop(bot, botType) {
    // Continuous behavior adjustment loop
    const loopInterval = setInterval(() => {
      if (!bot.entity || bot._isEnding) {
        clearInterval(loopInterval);
        return;
      }
      
      // Check for behavior changes based on context
      this.adjustBehaviors(bot);
      
      // Execute current behaviors
      this.executeCurrentBehaviors(bot);
      
      // Learn from experience
      this.learnFromBehavior(bot);
      
    }, 30000);
    
    // Store interval for cleanup
    bot.behaviorLoopInterval = loopInterval;
  }
  
  adjustBehaviors(bot) {
    const context = this.assessContext(bot);
    
    // Adjust behaviors based on context
    if (context.health < 10) {
      this.addEmergencyBehavior(bot, 'seek_safety');
    }
    
    if (context.timeOfDay === 'night' && !bot.isSleeping) {
      this.addTemporaryBehavior(bot, 'find_bed', 0.8);
    }
    
    if (context.nearbyPlayers > 3) {
      this.addTemporaryBehavior(bot, 'social_mode', 0.7);
    }
    
    // Remove expired temporary behaviors
    this.cleanupBehaviors(bot);
  }
  
  executeCurrentBehaviors(bot) {
    if (!bot.currentBehaviors || bot.currentBehaviors.length === 0) return;
    
    // Execute highest priority behavior
    const behavior = bot.currentBehaviors[0];
    
    switch (behavior.action) {
      case 'morning_inspection':
        this.executeMorningInspection(bot);
        break;
      case 'afternoon_build':
        this.executeAfternoonBuild(bot);
        break;
      case 'seek_safety':
        this.executeSeekSafety(bot);
        break;
      case 'find_bed':
        this.executeFindBed(bot);
        break;
      case 'social_mode':
        this.executeSocialMode(bot);
        break;
      default:
        // Generic behavior execution
        this.executeGenericBehavior(bot, behavior.action);
    }
    
    // Mark as executed
    behavior.lastExecuted = Date.now();
    behavior.executionCount = (behavior.executionCount || 0) + 1;
    
    // Rotate behaviors
    bot.currentBehaviors.push(bot.currentBehaviors.shift());
  }
  
  learnFromBehavior(bot) {
    if (!bot.behaviorHistory) bot.behaviorHistory = [];
    
    // Record current state
    bot.behaviorHistory.push({
      timestamp: Date.now(),
      behaviors: bot.currentBehaviors ? bot.currentBehaviors.map(b => b.action) : [],
      context: this.assessContext(bot),
      success: this.assessSuccess(bot)
    });
    
    // Keep only recent history
    if (bot.behaviorHistory.length > 100) {
      bot.behaviorHistory = bot.behaviorHistory.slice(-100);
    }
    
    // Learn from patterns
    if (bot.behaviorHistory.length > 20) {
      this.analyzeBehaviorPatterns(bot);
    }
  }
  
  analyzeBehaviorPatterns(bot) {
    const history = bot.behaviorHistory;
    const successful = history.filter(h => h.success > 0.7);
    const unsuccessful = history.filter(h => h.success < 0.3);
    
    // Learn which behaviors work in which contexts
    if (successful.length > 5) {
      const commonBehaviors = this.findCommonBehaviors(successful);
      
      // Reinforce successful behaviors
      commonBehaviors.forEach(behavior => {
        this.reinforceBehavior(bot, behavior);
      });
    }
    
    if (unsuccessful.length > 5) {
      const commonBehaviors = this.findCommonBehaviors(unsuccessful);
      
      // Avoid unsuccessful behaviors
      commonBehaviors.forEach(behavior => {
        this.avoidBehavior(bot, behavior);
      });
    }
  }
  
  // Behavior execution methods
  executeMorningInspection(bot) {
    console.log(`🎭 ${bot.username} conducting morning inspection`);
    bot.chat("Good morning! Time to check on things...");
    
    const checks = ['buildings', 'farms', 'animals', 'storage', 'defenses'];
    const check = checks[Math.floor(Math.random() * checks.length)];
    bot.chat(`Checking the ${check}...`);
  }
  
  executeAfternoonBuild(bot) {
    console.log(`🎭 ${bot.username} starting afternoon building session`);
    bot.chat("Afternoon building time!");
    
    const projects = ['expansion', 'renovation', 'new_room', 'decoration'];
    const project = projects[Math.floor(Math.random() * projects.length)];
    bot.chat(`Working on ${project} project this afternoon.`);
  }
  
  executeSeekSafety(bot) {
    console.log(`🎭 ${bot.username} seeking safety`);
    
    if (bot.health < 10) {
      bot.chat("I need to get to safety!");
      
      // Simple safety logic - move away from current position
      const safePos = bot.entity.position.offset(10, 0, 10);
      try {
        const goals = require('mineflayer-pathfinder').goals;
        bot.pathfinder.goto(new goals.GoalNear(safePos.x, safePos.y, safePos.z, 3));
      } catch (error) {
        // Ignore errors
      }
    }
  }
  
  executeFindBed(bot) {
    console.log(`🎭 ${bot.username} looking for bed`);
    
    if (bot.time && bot.time.timeOfDay % 24000 > 13000) {
      bot.chat("Getting tired... should find a bed.");
      
      // Simple bed finding logic
      const beds = bot.findBlocks({
        point: bot.entity.position,
        maxDistance: 50,
        matching: (block) => block.name.includes('bed'),
        count: 1
      });
      
      if (beds.length > 0) {
        const bed = beds[0];
        try {
          const goals = require('mineflayer-pathfinder').goals;
          bot.pathfinder.goto(new goals.GoalNear(bed.x, bed.y, bed.z, 1));
        } catch (error) {
          // Ignore errors
        }
      }
    }
  }
  
  executeSocialMode(bot) {
    console.log(`🎭 ${bot.username} entering social mode`);
    
    const players = Object.keys(bot.players).filter(name => name !== bot.username);
    
    if (players.length > 0 && Math.random() < 0.7) {
      const player = players[Math.floor(Math.random() * players.length)];
      bot.chat(`Hey ${player}, how are you doing?`);
    }
  }
  
  executeGenericBehavior(bot, action) {
    console.log(`🎭 ${bot.username} executing: ${action}`);
    
    // Map action to simple behavior
    const actionMap = {
      'measure_twice': () => bot.chat("Let me measure this properly..."),
      'gather_before_build': () => bot.chat("Need to gather materials first."),
      'take_notes': () => bot.chat("Taking notes on this area..."),
      'safety_first': () => bot.chat("Safety first! Checking for dangers..."),
      'greet_everyone': () => {
        const players = Object.keys(bot.players).filter(name => name !== bot.username);
        if (players.length > 0) {
          bot.chat("Hello everyone!");
        }
      }
    };
    
    if (actionMap[action]) {
      actionMap[action]();
    }
  }
  
  executeScheduledAction(bot, action) {
    const actionMap = {
      'morning_inspection': () => this.executeMorningInspection(bot),
      'afternoon_build': () => this.executeAfternoonBuild(bot),
      'evening_planning': () => bot.chat("Planning tomorrow's projects..."),
      'morning_exploration': () => bot.chat("Time for morning exploration!"),
      'afternoon_mapping': () => bot.chat("Mapping new areas this afternoon."),
      'evening_report': () => bot.chat("Reporting today's discoveries..."),
      'morning_mine': () => bot.chat("Morning mining shift starting!"),
      'afternoon_smelt': () => bot.chat("Smelting ores from this morning."),
      'evening_sort': () => bot.chat("Sorting and organizing inventory."),
      'morning_greetings': () => bot.chat("Good morning everyone!"),
      'afternoon_social': () => bot.chat("Afternoon social hour!"),
      'evening_events': () => bot.chat("Evening events starting soon!")
    };
    
    if (actionMap[action]) {
      actionMap[action]();
    }
  }
  
  executeBehavior(bot, action) {
    // Execute a specific behavior
    console.log(`🎭 ${bot.username} executing behavior: ${action}`);
    
    // Simple behavior mapping
    switch (action) {
      case 'login':
        bot.chat("Logging in... ready to play!");
        break;
      case 'check_inventory':
        bot.chat("Checking my inventory...");
        break;
      case 'light_farming':
        bot.chat("Time for some light farming.");
        break;
      case 'group_activity':
        bot.chat("Anyone want to do something together?");
        break;
      case 'major_project':
        bot.chat("Starting a major project today!");
        break;
      case 'extended_play':
        bot.chat("Got time for extended play session!");
        break;
      default:
        // Generic action
        this.executeGenericBehavior(bot, action);
    }
  }
  
  // Helper methods
  assessContext(bot) {
    return {
      health: bot.health || 20,
      food: bot.food || 20,
      timeOfDay: this.getTimeOfDay(bot),
      nearbyPlayers: Object.keys(bot.players).length - 1,
      location: this.getLocationType(bot),
      activity: bot.currentBehaviors ? bot.currentBehaviors[0]?.action : 'idle',
      mood: this.assessMood(bot)
    };
  }
  
  getTimeOfDay(bot) {
    if (!bot.time) return 'day';
    const time = bot.time.timeOfDay % 24000;
    if (time < 6000) return 'morning';
    if (time < 12000) return 'day';
    if (time < 13000) return 'sunset';
    if (time < 18000) return 'night';
    if (time < 19000) return 'sunrise';
    return 'day';
  }
  
  getLocationType(bot) {
    if (!bot.entity) return 'unknown';
    
    // Simple location detection
    const block = bot.blockAt(bot.entity.position);
    if (block) {
      const name = block.name.toLowerCase();
      if (name.includes('bed')) return 'home';
      if (name.includes('furnace')) return 'workshop';
      if (name.includes('chest')) return 'storage';
      if (name.includes('farm')) return 'farm';
      if (name.includes('ore')) return 'mine';
    }
    
    return 'wilderness';
  }
  
  assessMood(bot) {
    const factors = {
      health: (bot.health || 20) / 20,
      food: (bot.food || 20) / 20,
      social: Math.min(1, (Object.keys(bot.players).length - 1) / 5),
      safety: this.assessSafety(bot),
      progress: 0.5 // Default progress
    };
    
    const moodScore = Object.values(factors).reduce((a, b) => a + b, 0) / Object.keys(factors).length;
    
    if (moodScore > 0.8) return 'excellent';
    if (moodScore > 0.6) return 'good';
    if (moodScore > 0.4) return 'neutral';
    if (moodScore > 0.2) return 'poor';
    return 'terrible';
  }
  
  assessSafety(bot) {
    if (!bot.entities) return 1;
    
    const hostile = Object.values(bot.entities).filter(e => 
      e.displayName && 
      ['Zombie', 'Skeleton', 'Creeper', 'Spider'].some(name => e.displayName.includes(name))
    );
    
    return Math.max(0, 1 - (hostile.length / 5));
  }
  
  assessSuccess(bot) {
    // Simple success assessment based on health and activity
    let success = 0.5;
    
    if (bot.health > 15) success += 0.2;
    if (bot.health < 5) success -= 0.3;
    
    if (bot.food > 15) success += 0.1;
    if (bot.food < 5) success -= 0.2;
    
    return Math.max(0, Math.min(1, success));
  }
  
  addBotBehavior(bot, action) {
    if (!bot.currentBehaviors) bot.currentBehaviors = [];
    
    // Check if behavior already exists
    if (bot.currentBehaviors.some(b => b.action === action)) return;
    
    bot.currentBehaviors.push({
      action,
      priority: 5,
      added: Date.now(),
      lastExecuted: null,
      executionCount: 0
    });
    
    console.log(`🎭 Added behavior ${action} to ${bot.username}`);
  }
  
  addEmergencyBehavior(bot, action) {
    if (!bot.currentBehaviors) bot.currentBehaviors = [];
    
    // Remove existing emergency behaviors
    bot.currentBehaviors = bot.currentBehaviors.filter(b => 
      !b.action.startsWith('emergency_')
    );
    
    // Add new emergency behavior at high priority
    bot.currentBehaviors.unshift({
      action: `emergency_${action}`,
      priority: 10,
      added: Date.now(),
      emergency: true
    });
  }
  
  addTemporaryBehavior(bot, action, probability) {
    if (Math.random() < probability) {
      this.addBotBehavior(bot, `temp_${action}`);
      
      // Schedule removal
      setTimeout(() => {
        if (bot.currentBehaviors) {
          bot.currentBehaviors = bot.currentBehaviors.filter(b => 
            b.action !== `temp_${action}`
          );
        }
      }, 300000);
    }
  }
  
  cleanupBehaviors(bot) {
    if (!bot.currentBehaviors) return;
    
    const now = Date.now();
    
    bot.currentBehaviors = bot.currentBehaviors.filter(behavior => {
      if (behavior.action.startsWith('temp_')) {
        return now - (behavior.added || now) < 300000;
      }
      if (behavior.emergency) {
        return now - (behavior.added || now) < 60000;
      }
      return true;
    });
  }
  
  findCommonBehaviors(history) {
    const behaviorCount = {};
    
    history.forEach(entry => {
      entry.behaviors.forEach(behavior => {
        behaviorCount[behavior] = (behaviorCount[behavior] || 0) + 1;
      });
    });
    
    const threshold = history.length * 0.5;
    return Object.entries(behaviorCount)
      .filter(([_, count]) => count >= threshold)
      .map(([behavior]) => behavior);
  }
  
  reinforceBehavior(bot, behavior) {
    const pattern = bot.behaviorPattern;
    if (pattern && pattern.behaviors) {
      const behaviorObj = pattern.behaviors.find(b => b.action === behavior);
      if (behaviorObj) {
        behaviorObj.probability = Math.min(0.95, behaviorObj.probability + 0.05);
        console.log(`🎭 Reinforced behavior ${behavior} for ${bot.username}`);
      }
    }
  }
  
  avoidBehavior(bot, behavior) {
    const pattern = bot.behaviorPattern;
    if (pattern && pattern.behaviors) {
      const behaviorObj = pattern.behaviors.find(b => b.action === behavior);
      if (behaviorObj) {
        behaviorObj.probability = Math.max(0.05, behaviorObj.probability - 0.05);
        console.log(`🎭 Reduced probability of ${behavior} for ${bot.username}`);
      }
    }
  }
  
  stopBotBehavior(bot) {
    const username = bot.username;
    const botInfo = this.activeBehaviors.get(username);
    
    if (!botInfo) return false;
    
    // Stop behavior loop
    if (bot.behaviorLoopInterval) {
      clearInterval(bot.behaviorLoopInterval);
      delete bot.behaviorLoopInterval;
    }
    
    // Stop scheduled jobs
    botInfo.schedules.forEach(job => job.stop());
    
    // Remove from active behaviors
    this.activeBehaviors.delete(username);
    
    // Clean up bot properties
    delete bot.behaviorPattern;
    delete bot.personalityTraits;
    delete bot.currentBehaviors;
    delete bot.behaviorHistory;
    
    console.log(`🎭 Stopped behavior engine for ${username}`);
    return true;
  }
  
  logPatternActivation(patternName, pattern) {
    const logEntry = {
      pattern: patternName,
      type: pattern.type,
      timestamp: new Date().toISOString(),
      behaviors: pattern.behaviors.map(b => b.action)
    };
    
    // Save to learning data
    this.learningData.push(logEntry);
    
    // Keep data manageable
    if (this.learningData.length > 1000) {
      this.learningData = this.learningData.slice(-500);
    }
    
    // Log to file
    const logFile = path.join(__dirname, 'logs', 'behavior-activations.jsonl');
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
  }
  
  // Public API
  getBehaviorStats() {
    const stats = {
      totalPatterns: this.behaviors.size,
      patternsByType: {},
      activeBehaviors: this.activeBehaviors.size,
      learningData: this.learningData.length
    };
    
    for (const [_, pattern] of this.behaviors) {
      stats.patternsByType[pattern.type] = (stats.patternsByType[pattern.type] || 0) + 1;
    }
    
    return stats;
  }
  
  getBotBehaviorStats(username) {
    const botInfo = this.activeBehaviors.get(username);
    if (!botInfo) return null;
    
    const bot = botInfo.bot;
    
    return {
      username: username,
      type: botInfo.type,
      personalityTraits: bot.personalityTraits || [],
      currentBehaviors: bot.currentBehaviors ? bot.currentBehaviors.map(b => b.action) : [],
      behaviorHistory: bot.behaviorHistory ? bot.behaviorHistory.length : 0,
      schedules: botInfo.schedules.length
    };
  }
  
  getStatus() {
    return {
      patterns: this.behaviors.size,
      activeBots: this.activeBehaviors.size,
      schedules: Array.from(this.behaviors.values()).filter(p => p.schedule).length,
      learningData: this.learningData.length
    };
  }
}

// Create singleton instance
const behaviorEngine = new BehaviorEngine();

// Export for use in other modules
module.exports = behaviorEngine;

// Auto-load if this module is run directly
if (require.main === module) {
  console.log('🚀 Starting Behavior Engine...');
  console.log('✅ Behavior Engine ready');
  console.log('📊 Loading behavior patterns...');
}
