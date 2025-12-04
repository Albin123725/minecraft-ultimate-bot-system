const fs = require('fs-extra');
const path = require('path');
const Vec3 = require("vec3").Vec3;

class NeuralAI {
  constructor() {
    this.models = new Map();
    this.trainingData = [];
    this.attachedBots = new Map();
    
    this.behaviorPatterns = {
      builder: this.createBuilderPattern(),
      explorer: this.createExplorerPattern(),
      miner: this.createMinerPattern(),
      socializer: this.createSocializerPattern()
    };
    
    this.loadModels();
  }
  
  createBuilderPattern() {
    return {
      movement: {
        walkSpeed: 0.15,
        runSpeed: 0.25,
        jumpFrequency: 0.1,
        lookAroundFrequency: 0.3,
        stopToThink: 0.2
      },
      building: {
        planBeforeBuild: 0.9,
        measureDistance: 0.8,
        checkMaterials: 0.95,
        adjustForTerrain: 0.7,
        creativeMode: 0.3
      },
      awareness: {
        avoidLava: 0.99,
        avoidHeights: 0.6,
        noticeResources: 0.8,
        checkLightLevel: 0.7,
        pathAroundObstacles: 0.9
      },
      decisions: {
        gatherBeforeBuild: 0.8,
        upgradeTools: 0.6,
        expandTerritory: 0.4,
        helpOthers: 0.5,
        takeBreaks: 0.3
      }
    };
  }
  
  createExplorerPattern() {
    return {
      movement: {
        walkSpeed: 0.2,
        runSpeed: 0.3,
        jumpFrequency: 0.4,
        lookAroundFrequency: 0.8,
        stopToThink: 0.1
      },
      exploration: {
        markPath: 0.7,
        mapTerrain: 0.9,
        collectSamples: 0.6,
        avoidRepeats: 0.8,
        riskTaking: 0.4
      },
      awareness: {
        avoidLava: 0.95,
        avoidHeights: 0.3,
        noticeResources: 0.95,
        checkLightLevel: 0.9,
        pathAroundObstacles: 0.7
      },
      decisions: {
        returnToBase: 0.2,
        shareFindings: 0.7,
        takeRisks: 0.6,
        document: 0.5,
        restAtSafe: 0.4
      }
    };
  }
  
  createMinerPattern() {
    return {
      movement: {
        walkSpeed: 0.12,
        runSpeed: 0.18,
        jumpFrequency: 0.05,
        lookAroundFrequency: 0.2,
        stopToThink: 0.05
      },
      mining: {
        branchMining: 0.8,
        stripMining: 0.6,
        caveExploring: 0.9,
        orePrioritization: 0.95,
        torchPlacement: 0.85
      },
      awareness: {
        avoidLava: 0.99,
        avoidHeights: 0.2,
        noticeResources: 0.99,
        checkLightLevel: 0.95,
        pathAroundObstacles: 0.6
      },
      decisions: {
        returnWhenFull: 0.9,
        upgradePickaxe: 0.7,
        digToBedrock: 0.3,
        createStorage: 0.8,
        shareOres: 0.4
      }
    };
  }
  
  createSocializerPattern() {
    return {
      movement: {
        walkSpeed: 0.1,
        runSpeed: 0.15,
        jumpFrequency: 0.2,
        lookAroundFrequency: 0.9,
        stopToThink: 0.5
      },
      social: {
        greetPlayers: 0.9,
        initiateTrade: 0.7,
        tellStories: 0.6,
        helpNewPlayers: 0.8,
        organizeEvents: 0.5
      },
      awareness: {
        avoidLava: 0.8,
        avoidHeights: 0.7,
        noticeResources: 0.3,
        checkLightLevel: 0.4,
        pathAroundObstacles: 0.8
      },
      decisions: {
        followGroup: 0.7,
        shareItems: 0.6,
        mediateConflict: 0.5,
        createCommunity: 0.8,
        takeLeadership: 0.4
      }
    };
  }
  
  async loadModels() {
    try {
      const modelFile = path.join(__dirname, 'config', 'neural-models.json');
      if (await fs.pathExists(modelFile)) {
        const models = await fs.readJson(modelFile);
        this.models = new Map(Object.entries(models));
        console.log(`✅ Loaded ${this.models.size} neural models`);
      }
    } catch (error) {
      console.error('❌ Failed to load neural models:', error.message);
    }
  }
  
  async saveModels() {
    const models = Object.fromEntries(this.models);
    const modelFile = path.join(__dirname, 'config', 'neural-models.json');
    await fs.ensureDir(path.dirname(modelFile));
    await fs.writeJson(modelFile, models, { spaces: 2 });
  }
  
  attachToBot(bot, botType) {
    console.log(`🧠 Attaching Neural AI to ${bot.username} (${botType})`);
    
    const pattern = this.behaviorPatterns[botType];
    if (!pattern) {
      console.warn(`⚠️ No pattern for bot type: ${botType}`);
      return;
    }
    
    // Store pattern in bot
    bot.neuralPattern = pattern;
    bot.neuralState = {
      lastDecision: Date.now(),
      recentActions: [],
      learnedPaths: new Map(),
      environmentalMemory: [],
      socialMemory: new Map(),
      successRate: 0.5
    };
    
    // Enhance bot with neural capabilities
    this.enhanceMovement(bot, pattern);
    this.enhanceDecisionMaking(bot, pattern);
    this.enhanceEnvironmentalAwareness(bot, pattern);
    
    // Store reference
    this.attachedBots.set(bot.username, {
      bot: bot,
      type: botType,
      pattern: pattern
    });
    
    // Start neural processing loop
    this.startNeuralLoop(bot, botType);
    
    return true;
  }
  
  enhanceMovement(bot, pattern) {
    const originalLook = bot.look;
    const originalMove = bot.setControlState;
    
    // Enhanced looking with neural patterns
    bot.look = async (yaw, pitch, force) => {
      // Add natural head movements based on pattern
      if (Math.random() < pattern.movement.lookAroundFrequency) {
        const naturalYaw = yaw + (Math.random() - 0.5) * 0.5;
        const naturalPitch = pitch + (Math.random() - 0.5) * 0.3;
        return originalLook.call(bot, naturalYaw, naturalPitch, force);
      }
      
      return originalLook.call(bot, yaw, pitch, force);
    };
    
    // Enhanced movement with fatigue simulation
    bot.setControlState = (control, state) => {
      if (control === 'forward' && state) {
        // Simulate fatigue after prolonged movement
        const moveTime = Date.now() - (bot.lastMoveStart || Date.now());
        if (moveTime > 30000 && Math.random() < pattern.movement.stopToThink) {
          // Pause briefly to simulate thinking
          setTimeout(() => {
            if (bot.controlState.forward) {
              originalMove.call(bot, 'forward', false);
              setTimeout(() => {
                originalMove.call(bot, 'forward', true);
              }, 500);
            }
          }, 100);
        }
        
        if (!bot.lastMoveStart) bot.lastMoveStart = Date.now();
      } else if (!state && bot.lastMoveStart) {
        bot.lastMoveStart = null;
      }
      
      return originalMove.call(bot, control, state);
    };
    
    // Neural pathfinding with learning
    bot.neuralGoto = async (goal) => {
      const start = Date.now();
      const goalKey = goal.toString();
      
      try {
        // Check if we've learned this path before
        const learnedPath = bot.neuralState.learnedPaths.get(goalKey);
        if (learnedPath && learnedPath.success) {
          // Use learned path adjustments
          if (learnedPath.adjustments) {
            // Apply learned adjustments
          }
        }
        
        // Natural pauses based on pattern
        if (pattern.movement.stopToThink > Math.random()) {
          await this.delay(500 + Math.random() * 1500);
          bot.look(bot.entity.yaw + (Math.random() - 0.5) * Math.PI, 0, false);
        }
        
        await bot.pathfinder.goto(goal);
        
        // Learn from successful path
        const duration = Date.now() - start;
        bot.neuralState.learnedPaths.set(goalKey, {
          duration,
          success: true,
          timestamp: Date.now(),
          adjustments: this.calculatePathAdjustments(bot, goal, duration)
        });
        
        bot.neuralState.successRate = Math.min(1, bot.neuralState.successRate + 0.01);
        
        return true;
      } catch (error) {
        // Learn from failure
        bot.neuralState.learnedPaths.set(goalKey, {
          duration: Date.now() - start,
          success: false,
          error: error.message,
          timestamp: Date.now()
        });
        
        bot.neuralState.successRate = Math.max(0, bot.neuralState.successRate - 0.02);
        
        throw error;
      }
    };
  }
  
  enhanceDecisionMaking(bot, pattern) {
    // Enhanced decision making with memory
    bot.makeDecision = async (context) => {
      const decisionTime = Date.now();
      
      // Consider recent actions to avoid repetition
      const recentSimilar = bot.neuralState.recentActions.filter(
        action => action.type === context.type && 
        decisionTime - action.time < 60000
      );
      
      // Avoid repeating same action too quickly
      if (recentSimilar.length > 2) {
        const alternative = await this.findAlternativeAction(bot, context);
        if (alternative) {
          bot.neuralState.recentActions.push({
            type: context.type,
            decision: alternative,
            time: decisionTime
          });
          return alternative;
        }
      }
      
      // Make decision based on pattern and context
      const decision = await this.neuralDecision(bot, context, pattern);
      
      bot.neuralState.recentActions.push({
        type: context.type,
        decision,
        time: decisionTime
      });
      
      // Keep only recent actions
      if (bot.neuralState.recentActions.length > 10) {
        bot.neuralState.recentActions = bot.neuralState.recentActions.slice(-10);
      }
      
      return decision;
    };
  }
  
  enhanceEnvironmentalAwareness(bot, pattern) {
    // Track environmental changes
    const originalDig = bot.dig;
    
    bot.dig = async (block, forceLook = true, digFace = null) => {
      // Record dig in environmental memory
      bot.neuralState.environmentalMemory.push({
        action: 'dig',
        block: block.position,
        type: block.name,
        time: Date.now()
      });
      
      // Check for dangers before digging
      if (pattern.awareness.checkLightLevel > Math.random()) {
        const lightLevel = block.light;
        if (lightLevel < 8 && pattern.awareness.avoidLava > Math.random()) {
          // Low light - might spawn mobs, be cautious
          await this.delay(1000); // Extra caution delay
        }
      }
      
      return originalDig.call(bot, block, forceLook, digFace);
    };
    
    // Enhanced block placement with terrain awareness
    const originalPlace = bot.placeBlock;
    
    bot.placeBlock = async (referenceBlock, faceVector) => {
      // Check if placement makes sense
      if (pattern.building && pattern.building.adjustForTerrain > Math.random()) {
        const below = bot.blockAt(referenceBlock.position.offset(0, -1, 0));
        if (below && below.name === 'air') {
          // Would create floating block - adjust position
          const adjusted = await this.findSolidGround(bot, referenceBlock.position);
          if (adjusted) {
            referenceBlock = bot.blockAt(adjusted);
          }
        }
      }
      
      bot.neuralState.environmentalMemory.push({
        action: 'place',
        block: referenceBlock.position,
        face: faceVector,
        time: Date.now()
      });
      
      return originalPlace.call(bot, referenceBlock, faceVector);
    };
  }
  
  startNeuralLoop(bot, botType) {
    // Neural processing loop
    const loopInterval = setInterval(async () => {
      if (!bot.entity || bot._isEnding) {
        clearInterval(loopInterval);
        return;
      }
      
      if (bot.neuralState.isProcessing) return;
      
      bot.neuralState.isProcessing = true;
      
      try {
        // Process environmental memory
        await this.processMemory(bot);
        
        // Make autonomous decisions periodically
        if (Date.now() - bot.neuralState.lastDecision > 10000) {
          await this.autonomousDecision(bot, botType);
          bot.neuralState.lastDecision = Date.now();
        }
        
        // Clean up old memories
        this.cleanupMemory(bot);
        
      } catch (error) {
        console.error(`🧠 Neural error for ${bot.username}:`, error.message);
      } finally {
        bot.neuralState.isProcessing = false;
      }
    }, 5000);
    
    // Store interval for cleanup
    bot.neuralLoopInterval = loopInterval;
  }
  
  async autonomousDecision(bot, botType) {
    const context = {
      type: 'autonomous',
      botType,
      timeOfDay: this.getTimeOfDay(bot),
      health: bot.health,
      food: bot.food,
      position: bot.entity.position,
      nearbyPlayers: Object.keys(bot.players).length - 1
    };
    
    const decision = await bot.makeDecision(context);
    
    switch (decision) {
      case 'explore':
        await this.neuralExplore(bot);
        break;
      case 'gather':
        await this.neuralGather(bot, botType);
        break;
      case 'socialize':
        await this.neuralSocialize(bot);
        break;
      case 'rest':
        await this.neuralRest(bot);
        break;
      case 'build':
        await this.neuralBuild(bot);
        break;
      case 'mine':
        await this.neuralMine(bot);
        break;
    }
  }
  
  async neuralExplore(bot) {
    const direction = new Vec3(
      (Math.random() - 0.5) * 50,
      0,
      (Math.random() - 0.5) * 50
    );
    
    const target = bot.entity.position.plus(direction);
    
    try {
      await bot.neuralGoto(new goals.GoalBlock(target.x, target.y, target.z));
      console.log(`🧠 ${bot.username} explored to ${target.x}, ${target.y}, ${target.z}`);
    } catch (error) {
      // Exploration failure is natural
    }
  }
  
  async neuralGather(bot, botType) {
    const resources = {
      builder: ['wood', 'stone', 'sand', 'clay'],
      explorer: ['food', 'flowers', 'seeds', 'wool'],
      miner: ['coal', 'iron', 'diamond', 'redstone'],
      socializer: ['flowers', 'food', 'dye', 'wool']
    };
    
    const targetResources = resources[botType] || resources.builder;
    const resource = targetResources[Math.floor(Math.random() * targetResources.length)];
    
    // Look for nearby resources
    const blocks = bot.findBlocks({
      point: bot.entity.position,
      maxDistance: 20,
      matching: (block) => {
        const name = block.name.toLowerCase();
        return targetResources.some(r => name.includes(r.toLowerCase()));
      },
      count: 10
    });
    
    if (blocks.length > 0) {
      const target = blocks[0];
      try {
        await bot.neuralGoto(new goals.GoalBlock(target.x, target.y, target.z));
        
        // Gather the resource
        const block = bot.blockAt(target);
        if (block && bot.canDigBlock(block)) {
          await bot.dig(block);
          console.log(`🧠 ${bot.username} gathered ${resource}`);
        }
      } catch (error) {
        // Gathering failure is natural
      }
    }
  }
  
  async neuralSocialize(bot) {
    // Look for other players
    const players = Object.keys(bot.players).filter(name => name !== bot.username);
    
    if (players.length > 0) {
      const player = players[Math.floor(Math.random() * players.length)];
      
      // Simple social interaction
      const greetings = ['Hi', 'Hello', 'Hey', 'Howdy'];
      const greeting = greetings[Math.floor(Math.random() * greetings.length)];
      
      bot.chat(`${greeting} ${player}!`);
      console.log(`🧠 ${bot.username} socialized with ${player}`);
    }
  }
  
  async neuralRest(bot) {
    // Find a safe place to rest
    const safeBlocks = bot.findBlocks({
      point: bot.entity.position,
      maxDistance: 10,
      matching: (block) => ['bed', 'grass_block', 'dirt'].includes(block.name),
      count: 1
    });
    
    if (safeBlocks.length > 0) {
      const target = safeBlocks[0];
      try {
        await bot.neuralGoto(new goals.GoalBlock(target.x, target.y, target.z));
        
        // Rest for a bit
        bot.setControlState('sneak', true);
        await this.delay(5000 + Math.random() * 10000);
        bot.setControlState('sneak', false);
        
        console.log(`🧠 ${bot.username} took a rest`);
      } catch (error) {
        // Rest interruption is natural
      }
    }
  }
  
  async neuralBuild(bot) {
    // Simple construction
    const startPos = bot.entity.position.floored();
    const materials = this.checkMaterials(bot);
    
    if (materials.length === 0) {
      await this.neuralGather(bot, 'builder');
      return;
    }
    
    // Build a simple wall
    for (let x = 0; x < 5; x++) {
      for (let y = 0; y < 3; y++) {
        const blockPos = startPos.offset(x, y, 0);
        const block = bot.blockAt(blockPos);
        
        if (block && block.name === 'air') {
          const below = bot.blockAt(blockPos.offset(0, -1, 0));
          if (below && below.name !== 'air') {
            try {
              await bot.neuralGoto(new goals.GoalBlock(blockPos.x - 1, blockPos.y, blockPos.z));
              await this.placeBlockIfPossible(bot, below, new Vec3(0, 1, 0));
            } catch (error) {
              // Building failure is natural
            }
          }
        }
      }
    }
    
    console.log(`🧠 ${bot.username} built a simple structure`);
  }
  
  async neuralMine(bot) {
    // Go underground for mining
    if (bot.entity.position.y > 16) {
      const undergroundPos = bot.entity.position.offset(0, -10, 0);
      try {
        await bot.neuralGoto(new goals.GoalBlock(undergroundPos.x, undergroundPos.y, undergroundPos.z));
      } catch (error) {
        return;
      }
    }
    
    // Dig in a pattern
    for (let i = 0; i < 3; i++) {
      const digPos = bot.entity.position.offset(i, 0, 0);
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
    
    console.log(`🧠 ${bot.username} mined a tunnel`);
  }
  
  // Helper methods
  async neuralDecision(bot, context, pattern) {
    // Simple neural network simulation
    const factors = {
      health: bot.health < 10 ? 0.9 : bot.health < 15 ? 0.6 : 0.2,
      food: bot.food < 10 ? 0.8 : bot.food < 15 ? 0.4 : 0.1,
      time: this.getTimeOfDay(bot) === 'night' ? 0.7 : 0.2,
      danger: this.assessDanger(bot) ? 0.8 : 0.1,
      boredom: Date.now() - bot.neuralState.lastDecision > 30000 ? 0.6 : 0.2
    };
    
    // Weight based on bot type
    const weights = {
      explore: pattern.exploration ? pattern.exploration.riskTaking : 0.3,
      gather: pattern.decisions ? pattern.decisions.gatherBeforeBuild : 0.4,
      socialize: pattern.social ? pattern.social.greetPlayers : 0.2,
      rest: pattern.decisions ? pattern.decisions.takeBreaks : 0.3,
      build: pattern.building ? pattern.building.planBeforeBuild : 0.5,
      mine: pattern.mining ? pattern.mining.branchMining : 0.4
    };
    
    // Calculate scores
    const scores = {
      explore: (factors.boredom * 0.7 + factors.danger * 0.3) * weights.explore,
      gather: (factors.health * 0.3 + factors.food * 0.7) * weights.gather,
      socialize: (1 - factors.danger) * weights.socialize,
      rest: (factors.health * 0.5 + factors.food * 0.5) * weights.rest,
      build: (1 - factors.danger) * (1 - factors.boredom) * weights.build,
      mine: (1 - factors.danger) * factors.boredom * weights.mine
    };
    
    // Add randomness
    Object.keys(scores).forEach(key => {
      scores[key] += Math.random() * 0.2 - 0.1;
    });
    
    // Select highest score
    let maxScore = -Infinity;
    let decision = 'explore';
    
    for (const [key, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        decision = key;
      }
    }
    
    return decision;
  }
  
  getTimeOfDay(bot) {
    if (!bot.time) return 'day';
    const time = bot.time.timeOfDay % 24000;
    return time > 13000 && time < 23000 ? 'night' : 'day';
  }
  
  assessDanger(bot) {
    const entities = Object.values(bot.entities);
    const hostile = entities.filter(e => 
      e.displayName && 
      ['Zombie', 'Skeleton', 'Creeper', 'Spider'].some(name => e.displayName.includes(name))
    );
    
    return hostile.length > 0;
  }
  
  checkMaterials(bot) {
    const items = bot.inventory.items();
    return items.filter(item => 
      ['wood', 'stone', 'brick', 'planks', 'cobblestone'].some(mat => 
        item.name.toLowerCase().includes(mat)
      )
    );
  }
  
  async findSolidGround(bot, position) {
    for (let y = -5; y <= 0; y++) {
      const checkPos = position.offset(0, y, 0);
      const block = bot.blockAt(checkPos);
      if (block && block.name !== 'air' && block.boundingBox === 'block') {
        return checkPos.offset(0, 1, 0);
      }
    }
    return null;
  }
  
  async placeBlockIfPossible(bot, block, face) {
    try {
      await bot.placeBlock(block, face);
      return true;
    } catch (error) {
      return false;
    }
  }
  
  async findAlternativeAction(bot, context) {
    const alternatives = {
      explore: ['gather', 'build', 'socialize'],
      gather: ['explore', 'build', 'rest'],
      build: ['gather', 'explore', 'socialize'],
      socialize: ['explore', 'gather', 'rest'],
      rest: ['socialize', 'gather', 'explore'],
      mine: ['gather', 'explore', 'rest']
    };
    
    const recentTypes = bot.neuralState.recentActions.map(a => a.type);
    const alt = alternatives[context.type] || ['explore'];
    
    for (const action of alt) {
      if (!recentTypes.includes(action)) {
        return action;
      }
    }
    
    return alt[0];
  }
  
  calculatePathAdjustments(bot, goal, duration) {
    // Calculate adjustments for future pathfinding
    return {
      preferredSpeed: duration > 30000 ? 'run' : 'walk',
      cautionLevel: duration > 60000 ? 'high' : 'normal',
      restPoints: duration > 45000 ? 1 : 0
    };
  }
  
  async processMemory(bot) {
    const now = Date.now();
    const recentMemory = bot.neuralState.environmentalMemory.filter(
      mem => now - mem.time < 300000
    );
    
    // Learn from successes and failures
    const successes = recentMemory.filter(mem => !mem.error);
    const failures = recentMemory.filter(mem => mem.error);
    
    if (failures.length > successes.length * 0.3) {
      // High failure rate - be more cautious
      if (bot.neuralPattern.awareness) {
        bot.neuralPattern.awareness.avoidLava = Math.min(0.99, bot.neuralPattern.awareness.avoidLava + 0.05);
      }
    }
  }
  
  cleanupMemory(bot) {
    const now = Date.now();
    
    // Clean environmental memory
    bot.neuralState.environmentalMemory = bot.neuralState.environmentalMemory
      .filter(mem => now - mem.time < 3600000)
      .slice(-100);
    
    // Clean learned paths
    for (const [key, path] of bot.neuralState.learnedPaths.entries()) {
      if (now - path.timestamp > 86400000 && !path.success) {
        bot.neuralState.learnedPaths.delete(key);
      }
    }
  }
  
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // Public API
  getAttachedBots() {
    return Array.from(this.attachedBots.values()).map(info => ({
      username: info.bot.username,
      type: info.type,
      successRate: info.bot.neuralState?.successRate || 0,
      decisions: info.bot.neuralState?.recentActions.length || 0
    }));
  }
  
  getBotStats(username) {
    const info = this.attachedBots.get(username);
    if (!info || !info.bot.neuralState) return null;
    
    return {
      username: username,
      type: info.type,
      successRate: info.bot.neuralState.successRate,
      recentDecisions: info.bot.neuralState.recentActions.length,
      learnedPaths: info.bot.neuralState.learnedPaths.size,
      environmentalMemory: info.bot.neuralState.environmentalMemory.length
    };
  }
  
  detachFromBot(username) {
    const info = this.attachedBots.get(username);
    if (!info) return false;
    
    // Clean up neural loop
    if (info.bot.neuralLoopInterval) {
      clearInterval(info.bot.neuralLoopInterval);
    }
    
    // Remove neural state
    delete info.bot.neuralPattern;
    delete info.bot.neuralState;
    delete info.bot.neuralLoopInterval;
    
    this.attachedBots.delete(username);
    
    console.log(`🧠 Detached Neural AI from ${username}`);
    return true;
  }
  
  getStatus() {
    return {
      attachedBots: this.attachedBots.size,
      behaviorPatterns: Object.keys(this.behaviorPatterns),
      models: this.models.size,
      trainingData: this.trainingData.length
    };
  }
}

// Create singleton instance
const neuralAI = new NeuralAI();

// Export for use in other modules
module.exports = neuralAI;

// Auto-load if this module is run directly
if (require.main === module) {
  console.log('🚀 Starting Neural AI system...');
  console.log('✅ Neural AI system ready');
  console.log(`📊 Behavior patterns: ${Object.keys(neuralAI.behaviorPatterns).join(', ')}`);
}
