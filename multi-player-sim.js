const fs = require('fs-extra');
const path = require('path');

class MultiPlayerSim {
  constructor() {
    this.groups = new Map();
    this.relationships = new Map();
    this.events = [];
    this.simulatedPlayers = new Map();
    
    this.groupTypes = {
      building_crew: { size: 2, activities: ['build', 'decorate', 'plan'] },
      mining_party: { size: 3, activities: ['mine', 'explore_caves', 'smelt'] },
      exploration_team: { size: 2, activities: ['explore', 'map', 'discover'] },
      social_circle: { size: 4, activities: ['chat', 'trade', 'organize'] }
    };
    
    this.loadEvents();
  }
  
  async loadEvents() {
    try {
      const eventsFile = path.join(__dirname, 'logs', 'multiplayer-events.json');
      if (await fs.pathExists(eventsFile)) {
        this.events = await fs.readJson(eventsFile);
        console.log(`✅ Loaded ${this.events.length} multiplayer events`);
      }
    } catch (error) {
      console.error('❌ Failed to load multiplayer events:', error.message);
    }
  }
  
  async saveEvents() {
    const eventsFile = path.join(__dirname, 'logs', 'multiplayer-events.json');
    await fs.ensureDir(path.dirname(eventsFile));
    await fs.writeJson(eventsFile, this.events, { spaces: 2 });
  }
  
  addBot(bot, type) {
    console.log(`👥 Adding ${bot.username} to multiplayer simulation as ${type}`);
    
    // Initialize bot social state
    bot.socialState = {
      friends: new Set(),
      enemies: new Set(),
      group: null,
      reputation: 50,
      socialEnergy: 100,
      lastInteraction: Date.now()
    };
    
    // Store reference
    this.simulatedPlayers.set(bot.username, {
      bot: bot,
      type: type,
      socialState: bot.socialState
    });
    
    // Try to form or join a group
    this.formOrJoinGroup(bot, type);
    
    // Start social activities
    this.startSocialActivities(bot, type);
    
    // Record event
    this.recordEvent({
      type: 'player_joined',
      player: bot.username,
      playerType: type,
      timestamp: new Date().toISOString()
    });
    
    return true;
  }
  
  removeBot(bot) {
    if (!bot.username || !this.simulatedPlayers.has(bot.username)) return false;
    
    const username = bot.username;
    
    // Remove from group
    if (bot.socialState && bot.socialState.group) {
      const group = this.groups.get(bot.socialState.group);
      if (group) {
        group.members = group.members.filter(m => m !== username);
        
        if (group.members.length === 0) {
          this.groups.delete(bot.socialState.group);
        } else {
          // Notify remaining members
          this.notifyGroupChange(group, `${username} left the group`);
        }
      }
    }
    
    // Remove from simulated players
    this.simulatedPlayers.delete(username);
    
    // Record event
    this.recordEvent({
      type: 'player_left',
      player: username,
      timestamp: new Date().toISOString()
    });
    
    console.log(`👥 Removed ${username} from multiplayer simulation`);
    return true;
  }
  
  formOrJoinGroup(bot, type) {
    // Look for compatible groups
    let compatibleGroup = null;
    
    for (const [groupId, group] of this.groups.entries()) {
      if (group.type === type && group.members.length < this.groupTypes[type].size) {
        compatibleGroup = groupId;
        break;
      }
    }
    
    if (compatibleGroup) {
      // Join existing group
      const group = this.groups.get(compatibleGroup);
      group.members.push(bot.username);
      bot.socialState.group = compatibleGroup;
      
      console.log(`👥 ${bot.username} joined group ${compatibleGroup}`);
      this.notifyGroupChange(group, `${bot.username} joined the group`);
      
    } else {
      // Create new group
      const groupId = `${type}_${Date.now()}`;
      const group = {
        id: groupId,
        type: type,
        members: [bot.username],
        leader: bot.username,
        activity: 'forming',
        created: Date.now(),
        activities: []
      };
      
      this.groups.set(groupId, group);
      bot.socialState.group = groupId;
      bot.socialState.reputation += 10; // Leadership bonus
      
      console.log(`👥 ${bot.username} created new ${type} group`);
    }
  }
  
  startSocialActivities(bot, type) {
    // Group coordination
    setInterval(async () => {
      if (!bot.entity || !bot.socialState.group) return;
      
      const group = this.groups.get(bot.socialState.group);
      if (!group) return;
      
      // Coordinate with group members
      if (Math.random() < 0.3) {
        await this.coordinateWithGroup(bot, group);
      }
      
      // Social energy management
      bot.socialState.socialEnergy = Math.max(0, bot.socialState.socialEnergy - 1);
      
      if (bot.socialState.socialEnergy < 30) {
        // Need social break
        await this.takeSocialBreak(bot);
      }
      
    }, 30000);
    
    // Random social interactions
    setInterval(async () => {
      if (!bot.entity || !bot.socialState.group) return;
      
      if (Math.random() < 0.2) {
        await this.randomSocialInteraction(bot, type);
      }
      
    }, 60000 + Math.random() * 120000);
  }
  
  async coordinateWithGroup(bot, group) {
    const activities = this.groupTypes[group.type].activities;
    const activity = activities[Math.floor(Math.random() * activities.length)];
    
    console.log(`👥 ${bot.username} coordinating ${activity} with group ${group.id}`);
    
    switch (activity) {
      case 'build':
        await this.coordinateBuilding(bot, group);
        break;
      case 'mine':
        await this.coordinateMining(bot, group);
        break;
      case 'explore':
        await this.coordinateExploration(bot, group);
        break;
      case 'chat':
        await this.coordinateChat(bot, group);
        break;
      case 'trade':
        await this.coordinateTrade(bot, group);
        break;
    }
    
    // Record activity
    group.activities.push({
      activity,
      initiator: bot.username,
      time: Date.now(),
      participants: group.members
    });
    
    // Keep only recent activities
    if (group.activities.length > 20) {
      group.activities = group.activities.slice(-20);
    }
    
    // Update relationships
    group.members.forEach(member => {
      if (member !== bot.username) {
        this.updateRelationship(bot.username, member, 0.1);
      }
    });
    
    // Record event
    this.recordEvent({
      type: 'group_coordination',
      group: group.id,
      activity: activity,
      initiator: bot.username,
      timestamp: new Date().toISOString()
    });
  }
  
  async coordinateBuilding(bot, group) {
    const message = `Hey team, let's work on the ${this.getBuildingProject()} together!`;
    bot.chat(message);
    
    // Update group activity
    const groupObj = this.groups.get(bot.socialState.group);
    if (groupObj) {
      groupObj.activity = 'building';
      groupObj.project = this.getBuildingProject();
    }
    
    // Simulate building coordination
    setTimeout(() => {
      if (bot.entity) {
        bot.chat("I'll handle the walls, can someone do the roof?");
      }
    }, 5000);
  }
  
  async coordinateMining(bot, group) {
    bot.chat("Who's up for some mining? I found a good cave!");
    
    const groupObj = this.groups.get(bot.socialState.group);
    if (groupObj) {
      groupObj.activity = 'mining';
      groupObj.location = 'cave_system';
    }
    
    // Set mining goals
    const resources = ['diamonds', 'iron', 'redstone', 'lapis'];
    const target = resources[Math.floor(Math.random() * resources.length)];
    
    setTimeout(() => {
      if (bot.entity) {
        bot.chat(`Let's focus on finding ${target} today!`);
      }
    }, 3000);
  }
  
  async coordinateExploration(bot, group) {
    const directions = ['north', 'south', 'east', 'west'];
    const direction = directions[Math.floor(Math.random() * directions.length)];
    
    bot.chat(`I heard there's something interesting to the ${direction}. Want to check it out?`);
    
    const groupObj = this.groups.get(bot.socialState.group);
    if (groupObj) {
      groupObj.activity = 'exploring';
      groupObj.direction = direction;
    }
  }
  
  async coordinateChat(bot, group) {
    const topics = [
      'our next big project',
      'that crazy creeper explosion yesterday',
      'the new village we found',
      'our mining accomplishments',
      'upgrading our gear'
    ];
    
    const topic = topics[Math.floor(Math.random() * topics.length)];
    bot.chat(`Let's talk about ${topic}`);
    
    // Simulate conversation
    setTimeout(() => {
      if (bot.entity && Math.random() < 0.5) {
        const responses = [
          "What do you all think?",
          "I have some ideas about that.",
          "Remember when we...",
          "That reminds me of the time..."
        ];
        
        bot.chat(responses[Math.floor(Math.random() * responses.length)]);
      }
    }, 4000);
  }
  
  async coordinateTrade(bot, group) {
    const items = ['diamonds', 'iron', 'emeralds', 'enchanted books', 'potions'];
    const have = items[Math.floor(Math.random() * items.length)];
    const need = items[Math.floor(Math.random() * items.length)];
    
    while (need === have) {
      need = items[Math.floor(Math.random() * items.length)];
    }
    
    bot.chat(`I have extra ${have}, looking for ${need}. Anyone want to trade?`);
    
    // Simulate trade negotiation
    setTimeout(() => {
      if (bot.entity && Math.random() < 0.3) {
        bot.chat("I can throw in some extra redstone if that helps!");
      }
    }, 5000);
  }
  
  async randomSocialInteraction(bot, type) {
    const interactions = {
      builder: ['admire_build', 'offer_help', 'share_design', 'compliment_work'],
      explorer: ['share_map', 'warn_danger', 'suggest_path', 'tell_story'],
      miner: ['share_ores', 'warn_lava', 'suggest_depth', 'compare_yield'],
      socializer: ['start_convo', 'tell_joke', 'organize_event', 'resolve_conflict']
    };
    
    const availableInteractions = interactions[type] || interactions.socializer;
    const interaction = availableInteractions[Math.floor(Math.random() * availableInteractions.length)];
    
    console.log(`👥 ${bot.username} initiating ${interaction}`);
    
    switch (interaction) {
      case 'admire_build':
        bot.chat("Wow, that's an amazing build!");
        break;
      case 'offer_help':
        bot.chat("Need any help with that?");
        break;
      case 'share_design':
        bot.chat("I have a design idea for our next project...");
        break;
      case 'compliment_work':
        bot.chat("Great work on that structure!");
        break;
      case 'share_map':
        bot.chat("I mapped out the area to the north, here's what I found...");
        break;
      case 'warn_danger':
        bot.chat("Careful, there's lava down there!");
        break;
      case 'suggest_path':
        bot.chat("Try going around the mountain, it's safer.");
        break;
      case 'tell_story':
        bot.chat("Let me tell you about my adventures yesterday...");
        break;
      case 'share_ores':
        bot.chat("I found some diamonds, want to split them?");
        break;
      case 'warn_lava':
        bot.chat("Watch out for lava at Y=11!");
        break;
      case 'suggest_depth':
        bot.chat("We should mine at Y=-58 for best results.");
        break;
      case 'compare_yield':
        bot.chat("How much iron did you get? I found 32 ore.");
        break;
      case 'start_convo':
        bot.chat("How's everyone doing today?");
        break;
      case 'tell_joke':
        bot.chat("Why did the creeper go to therapy? It had too much TNTsion!");
        break;
      case 'organize_event':
        bot.chat("Let's have a building competition this weekend!");
        break;
      case 'resolve_conflict':
        bot.chat("Hey guys, let's work this out together.");
        break;
    }
    
    // Record interaction
    this.recordInteraction({
      type: interaction,
      initiator: bot.username,
      target: 'group',
      time: Date.now(),
      success: true
    });
    
    bot.socialState.lastInteraction = Date.now();
    bot.socialState.socialEnergy = Math.min(100, bot.socialState.socialEnergy + 5);
  }
  
  async takeSocialBreak(bot) {
    console.log(`👥 ${bot.username} taking social break`);
    
    bot.chat("I need a short break, be back in a bit!");
    
    // Go to a quiet place
    const quietSpot = bot.entity.position.plus({
      x: (Math.random() - 0.5) * 10,
      y: 0,
      z: (Math.random() - 0.5) * 10
    });
    
    // Rest and recharge
    bot.setControlState('sneak', true);
    
    setTimeout(() => {
      if (bot.entity) {
        bot.setControlState('sneak', false);
        bot.socialState.socialEnergy = 100;
        bot.chat("I'm back! What did I miss?");
      }
    }, 10000 + Math.random() * 20000);
  }
  
  notifyGroupChange(group, message) {
    console.log(`👥 Group ${group.id}: ${message}`);
    
    // Record event
    this.recordEvent({
      type: 'group_change',
      group: group.id,
      message: message,
      time: Date.now(),
      members: group.members
    });
  }
  
  updateRelationship(player1, player2, change) {
    const key = `${player1}-${player2}`;
    const reverseKey = `${player2}-${player1}`;
    
    if (!this.relationships.has(key)) {
      this.relationships.set(key, {
        players: [player1, player2],
        relationship: 50,
        interactions: 0,
        lastInteraction: Date.now()
      });
    }
    
    const relationship = this.relationships.get(key);
    relationship.relationship = Math.max(0, Math.min(100, relationship.relationship + change * 100));
    relationship.interactions++;
    relationship.lastInteraction = Date.now();
    
    // Update reverse relationship
    if (!this.relationships.has(reverseKey)) {
      this.relationships.set(reverseKey, { ...relationship });
    } else {
      const reverse = this.relationships.get(reverseKey);
      reverse.relationship = relationship.relationship;
      reverse.interactions = relationship.interactions;
      reverse.lastInteraction = relationship.lastInteraction;
    }
  }
  
  recordInteraction(interaction) {
    this.events.push({
      ...interaction,
      timestamp: new Date().toISOString()
    });
    
    // Keep only recent events
    if (this.events.length > 1000) {
      this.events = this.events.slice(-1000);
    }
    
    // Periodically save to file
    if (this.events.length % 100 === 0) {
      this.saveEvents();
    }
  }
  
  recordEvent(event) {
    this.events.push({
      ...event,
      timestamp: new Date().toISOString()
    });
    
    // Keep only recent events
    if (this.events.length > 1000) {
      this.events = this.events.slice(-1000);
    }
  }
  
  getBuildingProject() {
    const projects = [
      'castle', 'farm', 'bridge', 'watchtower', 'market', 'library',
      'enchanting room', 'brewery', 'stable', 'docks', 'wall', 'gate'
    ];
    
    return projects[Math.floor(Math.random() * projects.length)];
  }
  
  // Public API
  getSimulatedPlayers() {
    return Array.from(this.simulatedPlayers.values()).map(info => ({
      username: info.bot.username,
      type: info.type,
      group: info.bot.socialState?.group || null,
      reputation: info.bot.socialState?.reputation || 50,
      socialEnergy: info.bot.socialState?.socialEnergy || 100
    }));
  }
  
  getGroups() {
    return Array.from(this.groups.values()).map(group => ({
      id: group.id,
      type: group.type,
      members: group.members,
      leader: group.leader,
      activity: group.activity,
      created: new Date(group.created).toISOString(),
      recentActivities: group.activities.slice(-5)
    }));
  }
  
  getGroupStats() {
    const stats = {
      totalGroups: this.groups.size,
      groupsByType: {},
      totalMembers: 0,
      averageGroupSize: 0
    };
    
    let totalMembers = 0;
    
    for (const [_, group] of this.groups) {
      stats.groupsByType[group.type] = (stats.groupsByType[group.type] || 0) + 1;
      totalMembers += group.members.length;
    }
    
    stats.totalMembers = totalMembers;
    stats.averageGroupSize = stats.totalGroups > 0 ? totalMembers / stats.totalGroups : 0;
    
    return stats;
  }
  
  getRelationshipStats() {
    const stats = {
      totalRelationships: this.relationships.size,
      relationshipLevels: {
        hostile: 0,
        neutral: 0,
        friendly: 0,
        best_friends: 0
      },
      averageRelationship: 0
    };
    
    let totalScore = 0;
    
    for (const [_, rel] of this.relationships) {
      totalScore += rel.relationship;
      
      if (rel.relationship <= 30) stats.relationshipLevels.hostile++;
      else if (rel.relationship <= 70) stats.relationshipLevels.neutral++;
      else if (rel.relationship <= 90) stats.relationshipLevels.friendly++;
      else stats.relationshipLevels.best_friends++;
    }
    
    stats.averageRelationship = stats.totalRelationships > 0 ? totalScore / stats.totalRelationships : 50;
    
    return stats;
  }
  
  getSocialNetwork() {
    const nodes = new Set();
    const links = [];
    
    for (const [key, rel] of this.relationships) {
      const [player1, player2] = key.split('-');
      nodes.add(player1);
      nodes.add(player2);
      
      links.push({
        source: player1,
        target: player2,
        value: rel.relationship / 100,
        interactions: rel.interactions
      });
    }
    
    return {
      nodes: Array.from(nodes).map(name => ({ id: name, group: 1 })),
      links: links
    };
  }
  
  getRecentEvents(limit = 10) {
    return this.events.slice(-limit).reverse();
  }
  
  getStatus() {
    return {
      simulatedPlayers: this.simulatedPlayers.size,
      groups: this.groups.size,
      relationships: this.relationships.size,
      events: this.events.length,
      groupTypes: Object.keys(this.groupTypes)
    };
  }
}

// Create singleton instance
const multiPlayerSim = new MultiPlayerSim();

// Export for use in other modules
module.exports = multiPlayerSim;

// Auto-load if this module is run directly
if (require.main === module) {
  console.log('🚀 Starting Multi-Player Simulation...');
  console.log('✅ Multi-Player Simulation ready');
  console.log(`📊 Group types: ${Object.keys(multiPlayerSim.groupTypes).join(', ')}`);
}
