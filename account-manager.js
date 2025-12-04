const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

class AccountManager {
  constructor() {
    this.accounts = [];
    this.currentIndex = 0;
    this.accountsFile = path.join(__dirname, 'config', 'accounts.json');
    this.activityFile = path.join(__dirname, 'logs', 'account-activity.json');
    
    this.activity = {
      logins: [],
      rotations: 0,
      totalPlaytime: 0,
      serverCreations: 0
    };
  }
  
  async loadAccounts() {
    try {
      if (await fs.pathExists(this.accountsFile)) {
        this.accounts = await fs.readJson(this.accountsFile);
        console.log(`✅ Loaded ${this.accounts.length} accounts from file`);
      } else {
        await this.generateAccounts();
        await this.saveAccounts();
      }
      
      // Load activity
      if (await fs.pathExists(this.activityFile)) {
        this.activity = await fs.readJson(this.activityFile);
      }
      
    } catch (error) {
      console.error('❌ Failed to load accounts:', error.message);
      await this.generateAccounts();
    }
  }
  
  async generateAccounts() {
    console.log('🔄 Generating 10+ Aternos accounts...');
    
    const emailProviders = ['gmail.com', 'outlook.com', 'yahoo.com', 'protonmail.com', 'icloud.com'];
    const nameParts = [
      'game', 'craft', 'mine', 'build', 'explore', 'adventure', 'survival', 'creative',
      'player', 'gamer', 'bot', 'auto', 'smart', 'neural', 'ai', 'digital', 'virtual'
    ];
    
    for (let i = 0; i < 12; i++) { // 12 accounts for variety
      const username = this.generateUsername(nameParts);
      const email = this.generateEmail(username, emailProviders);
      const ageDays = 30 + Math.floor(Math.random() * 335); // 30-365 days old
      const creationDate = new Date(Date.now() - ageDays * 24 * 60 * 60 * 1000);
      
      this.accounts.push({
        id: uuidv4(),
        username,
        email,
        password: this.generatePassword(),
        creationDate: creationDate.toISOString(),
        ageDays,
        status: 'active',
        priority: Math.random() > 0.7 ? 'premium' : 'free',
        servers: this.generateServers(),
        lastLogin: null,
        totalPlaytime: Math.floor(Math.random() * 1000) * 60, // minutes
        loginCount: Math.floor(Math.random() * 100),
        security: {
          has2FA: Math.random() > 0.8,
          verifiedEmail: true,
          backupCodes: Math.random() > 0.5
        },
        activityPattern: this.generateActivityPattern(),
        notes: this.generateAccountNotes()
      });
    }
    
    console.log(`✅ Generated ${this.accounts.length} accounts`);
  }
  
  generateUsername(parts) {
    const part1 = parts[Math.floor(Math.random() * parts.length)];
    const part2 = parts[Math.floor(Math.random() * parts.length)];
    const number = Math.floor(Math.random() * 10000);
    
    // Sometimes add extra parts
    if (Math.random() > 0.5) {
      const part3 = parts[Math.floor(Math.random() * parts.length)];
      return `${part1}${part2}${part3}${number}`.toLowerCase();
    }
    
    return `${part1}${part2}${number}`.toLowerCase();
  }
  
  generateEmail(username, providers) {
    const provider = providers[Math.floor(Math.random() * providers.length)];
    
    // Add some variations
    const variations = ['', '.', '_', '-'];
    const variation = variations[Math.floor(Math.random() * variations.length)];
    const extraNumber = Math.random() > 0.5 ? Math.floor(Math.random() * 100) : '';
    
    return `${username}${variation}${extraNumber}@${provider}`.toLowerCase();
  }
  
  generatePassword() {
    const length = 12 + Math.floor(Math.random() * 8);
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    for (let i = 0; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // Ensure complexity
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/.test(password)) {
      return this.generatePassword(); // Retry
    }
    
    return password;
  }
  
  generateServers() {
    const serverCount = Math.floor(Math.random() * 4) + 1; // 1-4 servers
    const servers = [];
    const serverTypes = ['Survival', 'Creative', 'Modded', 'Minigames', 'Skyblock', 'OneBlock'];
    const versions = ['1.20.4', '1.21.0', '1.21.1', '1.21.10', '1.20.1', '1.19.4'];
    
    for (let i = 0; i < serverCount; i++) {
      const type = serverTypes[Math.floor(Math.random() * serverTypes.length)];
      const version = versions[Math.floor(Math.random() * versions.length)];
      const daysAgo = Math.floor(Math.random() * 30);
      const lastOnline = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      
      servers.push({
        name: `${type} Server ${i + 1}`,
        type,
        version,
        created: new Date(Date.now() - (30 + Math.random() * 335) * 24 * 60 * 60 * 1000).toISOString(),
        lastOnline: lastOnline.toISOString(),
        playtime: Math.floor(Math.random() * 5000) * 60, // minutes
        slots: [2, 4, 6, 8, 10][Math.floor(Math.random() * 5)],
        hasBackups: Math.random() > 0.3,
        hasDynamicIP: Math.random() > 0.5,
        status: Math.random() > 0.2 ? 'online' : 'offline'
      });
    }
    
    return servers;
  }
  
  generateActivityPattern() {
    const patterns = ['morning_player', 'evening_player', 'weekend_warrior', 'casual', 'hardcore'];
    const pattern = patterns[Math.floor(Math.random() * patterns.length)];
    
    const hours = {
      morning_player: { start: 6, end: 12 },
      evening_player: { start: 16, end: 22 },
      weekend_warrior: { start: 10, end: 2 },
      casual: { start: 18, end: 21 },
      hardcore: { start: 14, end: 4 }
    };
    
    return {
      pattern,
      preferredHours: hours[pattern],
      weekdays: Math.random() * 10 + 5, // hours per week
      weekends: Math.random() * 20 + 10 // hours per weekend
    };
  }
  
  generateAccountNotes() {
    const notes = [
      'Main account for survival',
      'Used for testing mods',
      'Backup account',
      'Friends account',
      'Streaming account',
      'Creative building only',
      'Hardcore world',
      'Speedrun attempts'
    ];
    
    return notes[Math.floor(Math.random() * notes.length)];
  }
  
  async getNextAccount() {
    this.currentIndex = (this.currentIndex + 1) % this.accounts.length;
    const account = this.accounts[this.currentIndex];
    
    // Update activity
    account.lastLogin = new Date().toISOString();
    account.loginCount++;
    this.activity.logins.push({
      accountId: account.id,
      timestamp: new Date().toISOString(),
      bot: 'unknown'
    });
    this.activity.rotations++;
    
    await this.saveAccounts();
    await this.saveActivity();
    
    return {
      username: account.username,
      email: account.email,
      age: `${account.ageDays} days`,
      priority: account.priority,
      servers: account.servers.length,
      lastLogin: account.lastLogin
    };
  }
  
  async rotateAccounts() {
    console.log('🔄 Rotating all accounts...');
    
    // Shuffle accounts
    this.accounts = this.shuffleArray(this.accounts);
    this.currentIndex = 0;
    
    // Update all last login times to simulate natural rotation
    const daysAgo = Math.floor(Math.random() * 7);
    const lastLogin = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
    
    this.accounts.forEach(account => {
      account.lastLogin = lastLogin.toISOString();
    });
    
    await this.saveAccounts();
    
    return {
      success: true,
      message: `Rotated ${this.accounts.length} accounts`,
      accounts: this.accounts.map(a => a.username)
    };
  }
  
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
  
  async simulateAternosActivity(accountId) {
    const account = this.accounts.find(a => a.id === accountId);
    if (!account) return false;
    
    // Simulate various Aternos panel activities
    const activities = [
      'viewed_server_list',
      'started_server',
      'stopped_server',
      'modified_settings',
      'downloaded_backup',
      'installed_plugin',
      'changed_version',
      'invited_friend'
    ];
    
    const activity = activities[Math.floor(Math.random() * activities.length)];
    
    // Log activity
    this.activity.logins.push({
      accountId,
      activity,
      timestamp: new Date().toISOString(),
      details: `Simulated ${activity}`
    });
    
    account.totalPlaytime += Math.floor(Math.random() * 60) + 10; // Add 10-70 minutes
    
    if (activity === 'installed_plugin') {
      account.servers.forEach(server => {
        if (Math.random() > 0.7) {
          server.hasPlugins = true;
        }
      });
    }
    
    await this.saveAccounts();
    await this.saveActivity();
    
    return { success: true, activity };
  }
  
  async saveAccounts() {
    await fs.ensureDir(path.dirname(this.accountsFile));
    await fs.writeJson(this.accountsFile, this.accounts, { spaces: 2 });
  }
  
  async saveActivity() {
    await fs.ensureDir(path.dirname(this.activityFile));
    await fs.writeJson(this.activityFile, this.activity, { spaces: 2 });
  }
  
  // Public API
  getAccountCount() {
    return this.accounts.length;
  }
  
  getAccountStats() {
    const byAge = { '30-90': 0, '91-180': 0, '181-365': 0 };
    const byPriority = { free: 0, premium: 0 };
    const byActivity = {};
    
    this.accounts.forEach(account => {
      // Age distribution
      if (account.ageDays <= 90) byAge['30-90']++;
      else if (account.ageDays <= 180) byAge['91-180']++;
      else byAge['181-365']++;
      
      // Priority distribution
      byPriority[account.priority]++;
      
      // Activity pattern distribution
      const pattern = account.activityPattern.pattern;
      byActivity[pattern] = (byActivity[pattern] || 0) + 1;
    });
    
    return {
      total: this.accounts.length,
      byAge,
      byPriority,
      byActivity,
      averageAge: Math.round(this.accounts.reduce((a, b) => a + b.ageDays, 0) / this.accounts.length),
      totalPlaytime: this.accounts.reduce((a, b) => a + b.totalPlaytime, 0),
      totalServers: this.accounts.reduce((a, b) => a + b.servers.length, 0),
      with2FA: this.accounts.filter(a => a.security.has2FA).length
    };
  }
  
  getAccountDetails(username) {
    const account = this.accounts.find(a => a.username === username);
    if (!account) return null;
    
    return {
      username: account.username,
      email: account.email,
      age: `${account.ageDays} days`,
      created: account.creationDate,
      priority: account.priority,
      servers: account.servers,
      totalPlaytime: `${Math.round(account.totalPlaytime / 60)} hours`,
      loginCount: account.loginCount,
      lastLogin: account.lastLogin,
      security: account.security,
      activityPattern: account.activityPattern
    };
  }
}

module.exports = new AccountManager();
