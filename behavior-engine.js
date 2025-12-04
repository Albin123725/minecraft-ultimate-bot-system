const fs = require('fs-extra');
const path = require('path');
const cron = require('node-cron');

class BehaviorEngine {
  constructor() {
    this.behaviors = new Map();
    this.schedules = new Map();
    this.patternsFile = path.join(__dirname, 'config', 'behavior-patterns.json');
    
    this.loadPatterns();
    this.setupGlobalSchedules();
  }
  
  async loadPatterns() {
    try {
      if (await fs.pathExists(this.patternsFile)) {
        const patterns = await fs.readJson(this.patternsFile);
        this.behaviors = new Map(Object.entries(patterns));
        console.log(`✅ Loaded ${this.behaviors.size} behavior patterns`);
      } else {
        await this.generateDefaultPatterns();
        await this.savePatterns();
      }
    } catch (error) {
      console.error('❌ Failed to load behavior patterns:', error.message);
      await this.generateDefaultPatterns();
    }
  }
  
  async generateDefaultPatterns() {
    console.log('🔄 Generating default behavior patterns...');
    
    const patterns = {
      // ================= DAILY PATTERNS =================
      weekday_morning: {
        type: 'time_based',
        schedule: '0 8 * * 1-5', // 8 AM Mon-Fri
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
        schedule: '0 18 * * 1-5', // 6 PM Mon-Fri
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
        schedule: '0 10 * * 6,0', // 10 AM Sat,Sun
        behaviors: [
          { action: 'login', probability: 0.95 },
          { action: 'extended_play', probability: 0.8 },
          { action: 'special_event', probability: 0.5 },
          { action: 'exploration', probability: 0.7 }
        ],
        duration: '6h',
        intensity: 'very_high'
      },
      
      // ================= SEASONAL PATTERNS =================
      exam_period: {
        type: 'seasonal',
        months: [11, 4], // Dec and May (exam periods)
        behaviors: [
          { action: 'reduced_activity', probability: 0.9 },
          { action: 'short_sessions', probability: 0.8 },
          { action: 'stress_relief_minigames', probability: 0.6 }
        ],
        duration: '3 weeks',
        intensity: 'low'
      },
      
      summer_vacation: {
        type: 'seasonal',
        months: [6, 7, 8], // Summer months
        behaviors: [
          { action: 'increased_activity', probability: 0.8 },
          { action: 'all_day_play', probability: 0.6 },
          { action: 'vacation_travel', probability: 0.4 }
        ],
        duration: '3 months',
        intensity: 'high'
      },
      
      holiday_season: {
        type: 'seasonal',
        months: [11, 12], // Nov-Dec
        behaviors: [
          { action: 'holiday_build', probability: 0.7 },
          { action: 'gift_giving', probability: 0.6 },
          { action: 'special_decoration', probability: 0.8 }
        ],
        duration: '2 months',
        intensity: 'medium'
      },
      
      // ================= PLAYER PERSONALITY PATTERNS =================
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
      },
      
      // ================= LIFE EVENT PATTERNS =================
      new_player_experience: {
        type: 'life_event',
        duration: '2 weeks',
        behaviors: [
          { action: 'ask_questions', probability: 0.9 },
          { action: 'follow_others', probability: 0.8 },
          { action: 'learn_basics', probability: 0.7 },
          { action: 'make_mistakes', probability: 0.6 }
        ],
        progression: [
          { day: 1, focus: 'controls' },
          { day: 3, focus: 'crafting' },
          { day: 7, focus: 'building' },
          { day: 14, focus: 'social' }
        ]
      },
      
      veteran_player: {
        type: 'life_event',
        duration: 'permanent',
        behaviors: [
          { action: 'mentor_newbies', probability: 0.7 },
          { action: 'advanced_builds', probability: 0.8 },
          { action: 'server_infrastructure', probability: 0.6 },
          { action: 'community_leadership', probability: 0.5 }
        ]
      },
      
      burnout_recovery: {
        type: 'life_event',
        duration: '1 week',
        behaviors: [
          { action: 'reduced_playtime', probability: 0.9 },
          { action: 'casual_activities', probability: 0.8 },
          { action: 'no_major_projects', probability: 0.7 },
          { action: 'social_only', probability: 0.6 }
        ]
      },
      
      // ================= TECHNICAL PATTERNS =================
      connection_issues: {
        type: 'technical',
        trigger: 'high_latency',
        behaviors: [
          { action: 'reduce_movement', probability: 0.8 },
          { action: 'avoid_combat', probability: 0.9 },
          { action: 'simple_tasks', probability: 0.7 },
          { action: 'logout_early', probability: 0.6 }
        ]
      },
      
      low_performance: {
        type: 'technical',
        trigger: 'low_fps',
        behaviors: [
          { action: 'reduce_view_distance', probability: 0.9 },
          { action: 'disable_particles', probability: 0.8 },
          { action: 'avoid_dense_areas', probability: 0.7 },
          { action: 'simplify_graphics', probability: 0.6 }
        ]
      },
      
      // ================= SOCIAL PATTERNS =================
      group_dynamics: {
        type: 'social',
        group_size: '>2',
        behaviors: [
          { action: 'coordinate_actions', probability: 0.8 },
          { action: 'share_resources', probability: 0.7 },
          { action: 'role_assignment', probability: 0.6 },
          { action: 'collective_decision', probability: 0.5 }
        ]
      },
      
      solo_play: {
        type: 'social',
        group_size: '1',
        behaviors: [
          { action: 'self_sufficient', probability: 0.9 },
          { action: 'personal_projects', probability: 0.8 },
          { action: 'quiet_focus', probability: 0.7 },
          { action: 'reflection', probability: 0.6 }
        ]
      }
    };
    
    this.behaviors = new Map(Object.entries(patterns));
    console.log(`✅ Generated ${this.behaviors.size} behavior patterns`);
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
    
    // Setup monthly check for seasonal patterns
    cron.schedule('0 0 1 * *', () => {
      this.checkSeasonalPatterns();
    });
    
    console.log('✅ Global behavior schedules setup complete');
  }
  
  activatePattern(patternName) {
    const pattern = this.behaviors.get(patternName);
    if (!pattern) return;
    
    console.log(`🎭 Activating behavior pattern: ${patternName}`);
    
    // Apply pattern to all bots
    this.applyPatternToBots(pattern);
    
    // Log activation
    this.logPatternActivation(patternName, pattern);
  }
  
  applyPatternToBots(pattern) {
    // This would apply to all active bots
    // In implementation, this would iterate through bot manager
    console.log(`🎭 Applying ${pattern.type} pattern to bots`);
    
    // Apply each behavior with its probability
    pattern.behaviors.forEach(behavior => {
      if (Math.random() < behavior.probability) {
        console.log(`  ↪ ${behavior.action} (${behavior.probability})`);
        this.executeBehavior(behavior.action);
      }
    });
  }
  
  checkSeasonalPatterns() {
    const now = new Date();
    const currentMonth = now.getMonth(); // 0-11
    
    for (const [name, pattern] of this.behaviors) {
      if (pattern.type === 'seasonal' && pattern.months.includes(currentMonth)) {
        console.log(`🍂 Activating seasonal pattern: ${name} for month ${currentMonth + 1}`);
        this.activatePattern(name);
      }
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
  }
  
  applyPersonality(bot, personality) {
    console.log(`🎭 Applying ${personality.traits.join(', ')} personality to ${bot.username}`);
    
    // Store traits for reference
    bot.personalityTraits = personality.traits;
    
    // Modify bot behavior based on traits
    personality.behaviors.forEach(behavior => {
      if (Math.random() < behavior.probability) {
        this.addBotBehavior(bot, behavior.action);
      }
    });
  }
  
  setupBotSchedules(bot, botType) {
    // Individual bot schedules based on personality
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
    
    botSchedules.forEach(schedule => {
      try {
        cron.schedule(schedule.time, () => {
          if (bot.entity) {
            console.log(`⏰ ${bot.username} scheduled: ${schedule.action}`);
            this.executeScheduledAction(bot, schedule.action);
          }
        });
      } catch (error) {
        console.error(`❌ Failed to schedule for ${bot.username}:`, error.message);
      }
    });
  }
  
  startBehaviorLoop(bot, botType) {
    // Continuous behavior adjustment loop
    setInterval(() => {
      if (!bot.entity || !bot.behaviorPattern) return;
      
      // Check for behavior changes based on context
      this.adjustBehaviors(bot);
      
      // Execute current behaviors
      this.executeCurrentBehaviors(bot);
      
      // Learn from experience
      this.learnFromBehavior(bot);
      
    }, 30000); // Every 30 seconds
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
      // Add more behaviors...
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
      console.log(`🧠 ${bot.username} learned successful behaviors:`, commonBehaviors);
      
      // Reinforce successful behaviors
      commonBehaviors.forEach(behavior => {
        this.reinforceBehavior(bot, behavior);
      });
    }
    
    if (unsuccessful.length > 5) {
      const commonBehaviors = this.findCommonBehaviors(unsuccessful);
      console.log(`🧠 ${bot.username} learned unsuccessful behaviors:`, commonBehaviors);
      
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
    
    // Check builds, farms, animals, etc.
    const checks = [
      'buildings',
      'farms',
      'animals',
      'storage',
      'defenses'
    ];
    
    const check = checks[Math.floor(Math.random() * checks.length)];
    bot.chat(`Checking the ${check}...`);
  }
  
  executeAfternoonBuild(bot) {
    console.log(`🎭 ${bot.username} starting afternoon building session`);
    bot.chat("Afternoon building time!");
    
    // Start a building project
    const projects = ['expansion', 'renovation', 'new_room', 'decoration'];
    const project = projects[Math.floor(Math.random() * projects.length)];
    
    bot.chat(`Working on ${project} project this afternoon.`);
  }
  
  executeSeekSafety(bot) {
    console.log(`🎭 ${bot.username} seeking safety`);
    
    if (bot.health < 10) {
      bot.chat("I need to get to safety!");
      
      // Find nearest safe location
      const safePlaces = bot.findBlocks({
        point: bot.entity.position,
        maxDistance: 30,
        matching: (block) => 
          ['bed', 'house', 'shelter', 'village'].some(place => 
            this.isSafePlace(block, place)
          ),
        count: 5
      });
      
      if (safePlaces.length > 0) {
        const target = safePlaces[0];
        bot.pathfinder.goto(new goals.GoalBlock(target.x, target.y, target.z));
      }
    }
  }
  
  executeFindBed(bot) {
    console.log(`🎭 ${bot.username} looking for bed`);
    
    if (bot.time.timeOfDay % 24000 > 13000) { // Night time
      bot.chat("Getting tired... should find a bed.");
      
      const beds = bot.findBlocks({
        point: bot.entity.position,
        maxDistance: 50,
        matching: (block) => block.name.includes('bed'),
        count: 1
      });
      
      if (beds.length > 0) {
        const bed = beds[0];
        bot.pathfinder.goto(new goals.GoalBlock(bed.x, bed.y, bed.z));
        
        setTimeout(() => {
          if (bot.entity) {
            const bedBlock = bot.blockAt(bed);
            if (bedBlock) {
              bot.sleep(bedBlock);
              bot.chat("Good night!");
            }
          }
        }, 3000);
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
  
  executeScheduledAction(bot, action) {
    // Map action names to functions
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
  
  // Helper methods
  assessContext(bot) {
    return {
      health: bot.health,
      food: bot.food,
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
    const nearbyBlocks = this.scanNearbyBlocks(bot, 10);
    
    if (nearbyBlocks.some(b => b.name.includes('bed'))) return 'home';
    if (nearbyBlocks.some(b => b.name.includes('furnace'))) return 'workshop';
    if (nearbyBlocks.some(b => b.name.includes('chest'))) return 'storage';
    if (nearbyBlocks.some(b => b.name.includes('farmland'))) return 'farm';
    if (nearbyBlocks.some(b => b.name.includes('ore'))) return 'mine';
    
    return 'wilderness';
  }
  
  assessMood(bot) {
    const factors = {
      health: bot.health / 20,
      food: bot.food / 20,
      social: Math.min(1, Object.keys(bot.players).length / 5),
      safety: this.assessSafety(bot),
      progress: this.assessProgress(bot)
    };
    
    const moodScore = Object.values(factors).reduce((a, b) => a + b, 0) / Object.keys(factors).length;
    
    if (moodScore > 0.8) return 'excellent';
    if (moodScore > 0.6) return 'good';
    if (moodScore > 0.4) return 'neutral';
    if (moodScore > 0.2) return 'poor';
    return 'terrible';
  }
  
  assessSafety(bot) {
    const hostile = Object.values(bot.entities).filter(e => 
      e.displayName && 
      ['Zombie', 'Skeleton', 'Creeper', 'Spider'].some(name => e.displayName.includes(name))
    );
    
    return Math.max(0, 1 - (hostile.length / 5));
  }
  
  assessProgress(bot) {
    // Measure progress toward goals
    if (!bot.goals) return 0.5;
    
    const completed = bot.goals.filter(g => g.completed).length;
    const total = bot.goals.length;
    
    return total > 0 ? completed / total : 0.5;
  }
  
  assessSuccess(bot) {
    // Assess how successful current behaviors are
    const context = this.assessContext(bot);
    
    let success = 0.5;
    
    // Health improvement is good
    if (context.health > 15) success += 0.2;
    if (context.health < 5) success -= 0.3;
    
    // Social interaction is good for socializers
    if (bot.personalityTraits && bot.personalityTraits.includes('social')) {
      if (context.nearbyPlayers > 0) success += 0.1;
    }
    
    // Safety is good for everyone
    if (context.location === 'home' || context.location === 'safe') success += 0.2;
    
    return Math.max(0, Math.min(1, success));
  }
  
  scanNearbyBlocks(bot, radius) {
    const blocks = [];
    const center = bot.entity.position.floored();
    
    for (let x = -radius; x <= radius; x++) {
      for (let y = -radius; y <= radius; y++) {
        for (let z = -radius; z <= radius; z++) {
          const pos = center.offset(x, y, z);
          const block = bot.blockAt(pos);
          if (block && block.name !== 'air') {
            blocks.push(block);
          }
        }
      }
    }
    
    return blocks;
  }
  
  isSafePlace(block, type) {
    switch (type) {
      case 'house':
        return ['door', 'window', 'roof'].some(part => 
          block.name.toLowerCase().includes(part)
        );
      case 'shelter':
        return ['wall', 'roof', 'shelter'].some(part =>
          block.name.toLowerCase().includes(part)
        );
      default:
        return block.name.toLowerCase().includes(type);
    }
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
      }, 300000); // Remove after 5 minutes
    }
  }
  
  cleanupBehaviors(bot) {
    if (!bot.currentBehaviors) return;
    
    const now = Date.now();
    
    // Remove old temporary behaviors
    bot.currentBehaviors = bot.currentBehaviors.filter(behavior => {
      if (behavior.action.startsWith('temp_')) {
        return now - (behavior.added || now) < 300000; // 5 minutes
      }
      if (behavior.emergency) {
        return now - (behavior.added || now) < 60000; // 1 minute for emergencies
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
    
    // Return behaviors that appear in at least 50% of entries
    const threshold = history.length * 0.5;
    return Object.entries(behaviorCount)
      .filter(([_, count]) => count >= threshold)
      .map(([behavior]) => behavior);
  }
  
  reinforceBehavior(bot, behavior) {
    // Increase probability of successful behavior
    const pattern = bot.behaviorPattern;
    if (pattern && pattern.behaviors) {
      const behaviorObj = pattern.behaviors.find(b => b.action === behavior);
      if (behaviorObj) {
        behaviorObj.probability = Math.min(0.95, behaviorObj.probability + 0.05);
      }
    }
  }
  
  avoidBehavior(bot, behavior) {
    // Decrease probability of unsuccessful behavior
    const pattern = bot.behaviorPattern;
    if (pattern && pattern.behaviors) {
      const behaviorObj = pattern.behaviors.find(b => b.action === behavior);
      if (behaviorObj) {
        behaviorObj.probability = Math.max(0.05, behaviorObj.probability - 0.05);
      }
    }
  }
  
  executeBehavior(action) {
    // Global behavior execution (affects all bots)
    console.log(`🎭 Executing global behavior: ${action}`);
    
    // This would broadcast to all bots
    // Implementation depends on bot manager architecture
  }
  
  async savePatterns() {
    const patterns = Object.fromEntries(this.behaviors);
    await fs.ensureDir(path.dirname(this.patternsFile));
    await fs.writeJson(this.patternsFile, patterns, { spaces: 2 });
  }
  
  logPatternActivation(patternName, pattern) {
    const logEntry = {
      pattern: patternName,
      type: pattern.type,
      timestamp: new Date().toISOString(),
      behaviors: pattern.behaviors.map(b => b.action)
    };
    
    // Append to log file
    const logFile = path.join(__dirname, 'logs', 'behavior-activations.jsonl');
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
  }
  
  // Public API
  getBehaviorStats() {
    const stats = {
      totalPatterns: this.behaviors.size,
      patternsByType: {},
      activeSchedules: 0,
      recentActivations: 0
    };
    
    for (const [_, pattern] of this.behaviors) {
      stats.patternsByType[pattern.type] = (stats.patternsByType[pattern.type] || 0) + 1;
    }
    
    // Count scheduled patterns
    for (const [name, pattern] of this.behaviors) {
      if (pattern.schedule) {
        stats.activeSchedules++;
      }
    }
    
    return stats;
  }
  
  getBotBehaviorStats(botName) {
    // This would get stats for a specific bot
    return {
      currentBehaviors: [],
      personalityTraits: [],
      behaviorHistory: 0,
      successRate: 0.5
    };
  }
}

module.exports = new BehaviorEngine();
