const fs = require('fs-extra');
const path = require('path');
const Vec3 = require('vec3');

class NeuralAI {
  constructor() {
    this.models = new Map();
    this.trainingData = [];
    this.modelsFile = path.join(__dirname, 'config', 'neural-models.json');
    
    this.behaviorPatterns = {
      builder: this.createBuilderPattern(),
      explorer: this.createExplorerPattern(),
      miner: this.createMinerPattern(),
      socializer: this.createSocializerPattern()
    };
  }
  
  createBuilderPattern() {
    return {
      // Movement patterns
      movement: {
        walkSpeed: 0.15,
        runSpeed: 0.25,
        jumpFrequency: 0.1,
        lookAroundFrequency: 0.3,
        stopToThink: 0.2
      },
      // Building intelligence
      building: {
        planBeforeBuild: 0.9,
        measureDistance: 0.8,
        checkMaterials: 0.95,
        adjustForTerrain: 0.7,
        creativeMode: 0.3
      },
      // Environmental awareness
      awareness: {
        avoidLava: 0.99,
        avoidHeights: 0.6,
        noticeResources: 0.8,
        checkLightLevel: 0.7,
        pathAroundObstacles: 0.9
      },
      // Decision making
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
  
  attachToBot(bot, botType) {
    console.log(`🧠 Attaching Neural AI to ${bot.username} (${botType})`);
    
    const pattern = this.behaviorPatterns[botType];
    if (!pattern) return;
    
    // Store pattern in bot
    bot.neuralPattern = pattern;
    bot.neuralState = {
      lastDecision: Date.now(),
      recentActions: [],
      learnedPaths: new Map(),
      environmentalMemory: [],
      socialMemory: new Map()
    };
    
    // Override bot methods with neural intelligence
    this.enhanceMovement(bot, pattern);
    this.enhanceDecisionMaking(bot, pattern);
    this.enhanceEnvironmentalAwareness(bot, pattern);
    this.enhanceSocialIntelligence(bot, pattern);
    
    // Start neural loop
    this.startNeuralLoop(bot, botType);
  }
  
  enhanceMovement(bot, pattern) {
    const originalLook = bot.look;
    const originalMove = bot.setControlState;
    
    // Enhanced looking with neural patterns
    bot.look = async (yaw, pitch, force) => {
      // Add natural head movements
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
        if (moveTime > 30000 && Math.random() < 0.1) { // After 30 seconds
          // Slow down slightly
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
    
    // Add neural pathfinding
    bot.neuralGoto = async (goal) => {
      const start = Date.now();
      
      try {
        // Use neural pattern to adjust pathfinding
        if (pattern.movement.stopToThink > Math.random()) {
          await this.delay(500 + Math.random() * 1500);
          bot.look(bot.entity.yaw + (Math.random() - 0.5) * Math.PI, 0, false);
        }
        
        await bot.pathfinder.goto(goal);
        
        // Learn from this path
        const duration = Date.now() - start;
        bot.neuralState.learnedPaths.set(goal.toString(), {
          duration,
          success: true,
          timestamp: Date.now()
        });
        
        return true;
      } catch (error) {
        bot.neuralState.learnedPaths.set(goal.toString(), {
          duration: Date.now() - start,
          success: false,
          error: error.message,
          timestamp: Date.now()
        });
        
        throw error;
      }
    };
  }
  
  enhanceDecisionMaking(bot, pattern) {
    // Enhanced decision making with memory
    bot.makeDecision = async (context) => {
      const decisionTime = Date.now();
      
      // Consider recent actions
      const recentSimilar = bot.neuralState.recentActions.filter(
        action => action.type === context.type && 
        decisionTime - action.time < 60000 // Last minute
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
      
      // Make decision based on pattern
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
        if (lightLevel < 8) {
          // Low light - might spawn mobs
          if (pattern.awareness.avoidLava > Math.random()) {
            await bot.placeBlock(block, Vec3(0, 1, 0)); // Place torch
          }
        }
      }
      
      return originalDig.call(bot, block, forceLook, digFace);
    };
    
    // Enhanced block placement
    const originalPlace = bot.placeBlock;
    
    bot.placeBlock = async (referenceBlock, faceVector) => {
      // Check if placement makes sense
      const surrounding = await this.scanSurroundings(bot, referenceBlock.position);
      
      // Avoid floating blocks (unless creative)
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
  
  enhanceSocialIntelligence(bot, pattern) {
    if (!pattern.social) return;
    
    // Track social interactions
    bot.on('chat', (username, message) => {
      if (username === bot.username) return;
      
      if (!bot.neuralState.socialMemory.has(username)) {
        bot.neuralState.socialMemory.set(username, {
          interactions: [],
          firstMet: Date.now(),
          lastInteraction: Date.now(),
          relationship: 0.5 // Neutral
        });
      }
      
      const memory = bot.neuralState.socialMemory.get(username);
      memory.interactions.push({
        type: 'chat',
        message,
        time: Date.now(),
        botResponse: null
      });
      memory.lastInteraction = Date.now();
      
      // Update relationship based on interaction
      const messageLower = message.toLowerCase();
      if (messageLower.includes('thanks') || messageLower.includes('thank you')) {
        memory.relationship = Math.min(1, memory.relationship + 0.1);
      } else if (messageLower.includes('idiot') || messageLower.includes('stupid')) {
        memory.relationship = Math.max(0, memory.relationship - 0.2);
      }
      
      // Keep only recent interactions
      if (memory.interactions.length > 20) {
        memory.interactions = memory.interactions.slice(-20);
      }
    });
    
    // Social decision making
    bot.shouldInteractWith = (username) => {
      if (!bot.neuralState.socialMemory.has(username)) {
        return pattern.social.greetPlayers > Math.random();
      }
      
      const memory = bot.neuralState.socialMemory.get(username);
      const timeSince = Date.now() - memory.lastInteraction;
      
      if (timeSince > 300000) { // 5 minutes
        return pattern.social.greetPlayers > Math.random() * 0.5;
      }
      
      return memory.relationship > 0.3 && pattern.social.initiateTrade > Math.random();
    };
  }
  
  startNeuralLoop(bot, botType) {
    // Neural processing loop
    setInterval(async () => {
      if (!bot.entity || bot.neuralState.isProcessing) return;
      
      bot.neuralState.isProcessing = true;
      
      try {
        // Process environmental memory
        await this.processMemory(bot);
        
        // Make autonomous decisions
        if (Date.now() - bot.neuralState.lastDecision > 10000) { // Every 10 seconds
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
    }, 5000); // Run every 5 seconds
  }
  
  async autonomousDecision(bot, botType) {
    const context = {
      type: 'autonomous',
      botType,
      timeOfDay: this.getTimeOfDay(bot),
      health: bot.health,
      food: bot.food,
      position: bot.entity.position
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
    }
  }
  
  async neuralExplore(bot) {
    const direction = new Vec3(
      (Math.random() - 0.5) * 50,
      0,
      (Math.random() - 0.5) * 50
    );
    
    const target = bot.entity.position.plus(direction);
    const goal = new goals.GoalBlock(target.x, target.y, target.z);
    
    console.log(`🧠 ${bot.username} autonomously exploring`);
    await bot.neuralGoto(goal);
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
    
    console.log(`🧠 ${bot.username} gathering ${resource}`);
    
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
      await bot.neuralGoto(new goals.GoalBlock(target.x, target.y, target.z));
      
      // Gather the resource
      const block = bot.blockAt(target);
      if (block && bot.canDigBlock(block)) {
        await bot.dig(block);
      }
    }
  }
  
  async neuralSocialize(bot) {
    // Look for other players
    const players = Object.keys(bot.players).filter(name => name !== bot.username);
    
    if (players.length > 0 && bot.shouldInteractWith(players[0])) {
      console.log(`🧠 ${bot.username} socializing with ${players[0]}`);
      bot.chat(`Hey ${players[0]}! How's it going?`);
    }
  }
  
  async neuralRest(bot) {
    console.log(`🧠 ${bot.username} taking a rest`);
    
    // Find a safe place to rest
    const safeBlocks = bot.findBlocks({
      point: bot.entity.position,
      maxDistance: 10,
      matching: (block) => ['bed', 'chair', 'bench'].some(f => block.name.toLowerCase().includes(f)),
      count: 1
    });
    
    if (safeBlocks.length > 0) {
      await bot.neuralGoto(new goals.GoalBlock(safeBlocks[0].x, safeBlocks[0].y, safeBlocks[0].z));
      
      // Sit/lie down for a bit
      bot.setControlState('sneak', true);
      await this.delay(5000 + Math.random() * 10000);
      bot.setControlState('sneak', false);
    } else {
      // Just pause and look around
      await this.delay(3000 + Math.random() * 7000);
      bot.look(bot.entity.yaw + Math.PI / 2, 0, false);
    }
  }
  
  async neuralBuild(bot) {
    console.log(`🧠 ${bot.username} building autonomously`);
    
    // Simple construction
    const designs = ['wall', 'tower', 'house', 'bridge', 'fence'];
    const design = designs[Math.floor(Math.random() * designs.length)];
    
    // Check for materials
    const materials = this.checkMaterials(bot);
    if (materials.length === 0) {
      await this.neuralGather(bot, 'builder');
      return;
    }
    
    // Build simple structure
    const startPos = bot.entity.position.floored();
    
    switch (design) {
      case 'wall':
        await this.buildWall(bot, startPos, 5, 3);
        break;
      case 'tower':
        await this.buildTower(bot, startPos, 7);
        break;
      // Add more designs...
    }
  }
  
  async buildWall(bot, startPos, length, height) {
    for (let x = 0; x < length; x++) {
      for (let y = 0; y < height; y++) {
        const blockPos = startPos.offset(x, y, 0);
        const block = bot.blockAt(blockPos);
        
        if (block && block.name === 'air') {
          // Try to place a block
          const below = bot.blockAt(blockPos.offset(0, -1, 0));
          if (below && below.name !== 'air') {
            await bot.neuralGoto(new goals.GoalBlock(blockPos.x - 1, blockPos.y, blockPos.z));
            await this.placeBlockIfPossible(bot, below, new Vec3(0, 1, 0));
          }
        }
      }
    }
  }
  
  async placeBlockIfPossible(bot, block, face) {
    try {
      await bot.placeBlock(block, face);
      return true;
    } catch (error) {
      return false;
    }
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
      build: pattern.building ? pattern.building.planBeforeBuild : 0.5
    };
    
    // Calculate scores
    const scores = {
      explore: (factors.boredom * 0.7 + factors.danger * 0.3) * weights.explore,
      gather: (factors.health * 0.3 + factors.food * 0.7) * weights.gather,
      socialize: (1 - factors.danger) * weights.socialize,
      rest: (factors.health * 0.5 + factors.food * 0.5) * weights.rest,
      build: (1 - factors.danger) * (1 - factors.boredom) * weights.build
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
    // Check for nearby mobs
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
  
  async scanSurroundings(bot, position) {
    const blocks = [];
    const radius = 5;
    
    for (let x = -radius; x <= radius; x++) {
      for (let y = -radius; y <= radius; y++) {
        for (let z = -radius; z <= radius; z++) {
          const block = bot.blockAt(position.offset(x, y, z));
          if (block && block.name !== 'air') {
            blocks.push({
              position: block.position,
              type: block.name,
              distance: Math.sqrt(x*x + y*y + z*z)
            });
          }
        }
      }
    }
    
    return blocks;
  }
  
  async findSolidGround(bot, position) {
    for (let y = -5; y <= 0; y++) {
      const checkPos = position.offset(0, y, 0);
      const block = bot.blockAt(checkPos);
      if (block && block.name !== 'air' && block.boundingBox === 'block') {
        return checkPos.offset(0, 1, 0); // Position above solid ground
      }
    }
    
    return null;
  }
  
  async findAlternativeAction(bot, context) {
    // Find alternative to recent actions
    const alternatives = {
      explore: ['gather', 'build', 'socialize'],
      gather: ['explore', 'build', 'rest'],
      build: ['gather', 'explore', 'socialize'],
      socialize: ['explore', 'gather', 'rest'],
      rest: ['socialize', 'gather', 'explore']
    };
    
    const recentTypes = bot.neuralState.recentActions.map(a => a.type);
    const alt = alternatives[context.type] || ['explore'];
    
    for (const action of alt) {
      if (!recentTypes.includes(action)) {
        return action;
      }
    }
    
    return alt[0]; // Default to first alternative
  }
  
  async processMemory(bot) {
    // Process and learn from environmental memory
    const now = Date.now();
    const recentMemory = bot.neuralState.environmentalMemory.filter(
      mem => now - mem.time < 300000 // Last 5 minutes
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
    
    // Clean environmental memory (keep last 100 entries or last hour)
    bot.neuralState.environmentalMemory = bot.neuralState.environmentalMemory
      .filter(mem => now - mem.time < 3600000) // Last hour
      .slice(-100); // Last 100 entries
    
    // Clean learned paths (keep successful ones for a day)
    for (const [key, path] of bot.neuralState.learnedPaths.entries()) {
      if (now - path.timestamp > 86400000 && !path.success) {
        bot.neuralState.learnedPaths.delete(key);
      }
    }
    
    // Clean social memory (keep active relationships)
    for (const [username, memory] of bot.neuralState.socialMemory.entries()) {
      if (now - memory.lastInteraction > 604800000) { // 1 week
        bot.neuralState.socialMemory.delete(username);
      }
    }
  }
  
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // Public API
  getNeuralStats(botName) {
    const bot = this.getBotByName(botName);
    if (!bot || !bot.neuralState) return null;
    
    return {
      decisionCount: bot.neuralState.recentActions.length,
      learnedPaths: bot.neuralState.learnedPaths.size,
      environmentalMemory: bot.neuralState.environmentalMemory.length,
      socialConnections: bot.neuralState.socialMemory.size,
      pattern: bot.neuralPattern ? Object.keys(bot.neuralPattern) : []
    };
  }
  
  getBotByName(name) {
    // This would need access to bot manager
    return null;
  }
}

module.exports = new NeuralAI();
