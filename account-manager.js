const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');

class AccountManager {
  constructor() {
    this.accounts = [];
    this.activeAccount = null;
    this.rotationInterval = null;
    this.activityLog = [];
    
    this.config = {
      rotationInterval: 60 * 60 * 1000, // 1 hour
      minAccountAge: 30, // days
      maxAccounts: 10
    };
    
    this.loadAccounts();
  }
  
  async loadAccounts() {
    try {
      const accountFile = path.join(__dirname, 'config', 'accounts.json');
      if (await fs.pathExists(accountFile)) {
        this.accounts = await fs.readJson(accountFile);
        console.log(`✅ Loaded ${this.accounts.length} accounts from file`);
      } else {
        await this.generateDefaultAccounts();
      }
      
      // Load activity log
      const logFile = path.join(__dirname, 'logs', 'account-activity.json');
      if (await fs.pathExists(logFile)) {
        this.activityLog = await fs.readJson(logFile);
      }
      
    } catch (error) {
      console.error('❌ Failed to load accounts:', error.message);
      await this.generateDefaultAccounts();
    }
  }
  
  async generateDefaultAccounts(count = 10) {
    console.log(`🔄 Generating ${count} default accounts...`);
    
    const emailProviders = ['gmail.com', 'outlook.com', 'yahoo.com', 'protonmail.com', 'icloud.com'];
    const nameParts = [
      'game', 'craft', 'mine', 'build', 'explore', 'adventure', 
      'survival', 'creative', 'player', 'gamer', 'bot', 'auto'
    ];
    
    for (let i = 0; i < count; i++) {
      const username = this.generateUsername(nameParts);
      const provider = emailProviders[Math.floor(Math.random() * emailProviders.length)];
      const ageDays = 30 + Math.floor(Math.random() * 335); // 30-365 days
      
      this.accounts.push({
        id: crypto.randomBytes(8).toString('hex'),
        username: username,
        email: `${username}@${provider}`,
        password: this.generatePassword(),
        creationDate: new Date(Date.now() - ageDays * 24 * 60 * 60 * 1000).toISOString(),
        ageDays: ageDays,
        status: 'active',
        priority: Math.random() > 0.7 ? 'premium' : 'free',
        servers: this.generateServers(),
        lastLogin: null,
        totalPlaytime: Math.floor(Math.random() * 1000) * 60,
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
    
    await this.saveAccounts();
    console.log(`✅ Generated ${this.accounts.length} accounts`);
  }
  
  generateUsername(parts) {
    const part1 = parts[Math.floor(Math.random() * parts.length)];
    const part2 = parts[Math.floor(Math.random() * parts.length)];
    const number = Math.floor(Math.random() * 10000);
    
    return `${part1}${part2}${number}`.toLowerCase();
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
      return this.generatePassword();
    }
    
    return password;
  }
  
  generateServers() {
    const serverCount = Math.floor(Math.random() * 4) + 1;
    const servers = [];
    const serverTypes = ['Survival', 'Creative', 'Modded', 'Minigames', 'Skyblock'];
    const versions = ['1.20.4', '1.21.0', '1.21.1', '1.21.10', '1.20.1'];
    
    for (let i = 0; i < serverCount; i++) {
      const type = serverTypes[Math.floor(Math.random() * serverTypes.length)];
      const version = versions[Math.floor(Math.random() * versions.length)];
      const daysAgo = Math.floor(Math.random() * 30);
      
      servers.push({
        name: `${type} Server ${i + 1}`,
        type: type,
        version: version,
        created: new Date(Date.now() - (30 + Math.random() * 335) * 24 * 60 * 60 * 1000).toISOString(),
        lastOnline: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
        playtime: Math.floor(Math.random() * 5000) * 60,
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
      pattern: pattern,
      preferredHours: hours[pattern],
      weekdays: Math.random() * 10 + 5,
      weekends: Math.random() * 20 + 10
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
    // Filter active accounts
    const availableAccounts = this.accounts
      .filter(acc => acc.status === 'active')
      .sort((a, b) => {
        // Sort by last login (oldest first)
        return (a.lastLogin || 0) - (b.lastLogin || 0);
      });
    
    if (availableAccounts.length === 0) {
      console.warn('⚠️ No available accounts, using fallback');
      return this.createFallbackAccount();
    }
    
    const account = availableAccounts[0];
    account.lastLogin = new Date().toISOString();
    account.loginCount = (account.loginCount || 0) + 1;
    this.activeAccount = account;
    
    // Log this activity
    this.logActivity('login', account.id);
    
    await this.saveAccounts();
    
    return {
      username: account.username,
      email: account.email,
      age: `${account.ageDays} days`,
      priority: account.priority,
      servers: account.servers.length,
      lastLogin: account.lastLogin,
      playtime: account.totalPlaytime
    };
  }
  
  createFallbackAccount() {
    const username = `fallback_${crypto.randomBytes(4).toString('hex')}`;
    
    return {
      username: username,
      email: `${username}@fallback.com`,
      age: '1 day',
      priority: 'free',
      servers: 1,
      lastLogin: new Date().toISOString(),
      playtime: 0,
      fallback: true
    };
  }
  
  async rotateAccounts() {
    console.log('🔄 Rotating accounts...');
    
    // Update all last login times to simulate natural rotation
    const daysAgo = Math.floor(Math.random() * 7);
    const lastLogin = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
    
    this.accounts.forEach(account => {
      account.lastLogin = lastLogin.toISOString();
    });
    
    // Shuffle accounts
    this.accounts = this.shuffleArray(this.accounts);
    
    await this.saveAccounts();
    this.logActivity('rotation', null);
    
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
    this.logActivity(activity, accountId);
    
    account.totalPlaytime += Math.floor(Math.random() * 60) + 10;
    
    if (activity === 'installed_plugin') {
      account.servers.forEach(server => {
        if (Math.random() > 0.7) {
          server.hasPlugins = true;
        }
      });
    }
    
    await this.saveAccounts();
    
    return { success: true, activity };
  }
  
  logActivity(type, accountId, details = {}) {
    const activity = {
      type: type,
      accountId: accountId,
      timestamp: new Date().toISOString(),
      details: details
    };
    
    this.activityLog.push(activity);
    
    // Keep log manageable
    if (this.activityLog.length > 1000) {
      this.activityLog = this.activityLog.slice(-500);
    }
    
    // Save to file periodically
    if (this.activityLog.length % 100 === 0) {
      this.saveActivityLog();
    }
    
    return activity;
  }
  
  startAutoRotation() {
    if (this.rotationInterval) {
      clearInterval(this.rotationInterval);
    }
    
    this.rotationInterval = setInterval(async () => {
      console.log('⏰ Auto-rotating accounts...');
      await this.rotateAccounts();
      
      // Simulate some Aternos activity
      if (this.activeAccount) {
        await this.simulateAternosActivity(this.activeAccount.id);
      }
      
    }, this.config.rotationInterval);
    
    console.log(`✅ Auto rotation started (every ${this.config.rotationInterval / 3600000} hours)`);
  }
  
  stopAutoRotation() {
    if (this.rotationInterval) {
      clearInterval(this.rotationInterval);
      this.rotationInterval = null;
      console.log('⏹️ Auto rotation stopped');
    }
  }
  
  async addAccount(accountData) {
    const newAccount = {
      id: crypto.randomBytes(8).toString('hex'),
      ...accountData,
      creationDate: new Date().toISOString(),
      ageDays: 1,
      status: 'active',
      lastLogin: null,
      totalPlaytime: 0,
      loginCount: 0,
      servers: [],
      security: {
        has2FA: false,
        verifiedEmail: true,
        backupCodes: false
      },
      activityPattern: this.generateActivityPattern(),
      notes: 'Manually added account'
    };
    
    this.accounts.push(newAccount);
    await this.saveAccounts();
    
    return {
      success: true,
      account: newAccount
    };
  }
  
  removeAccount(accountId) {
    const initialLength = this.accounts.length;
    this.accounts = this.accounts.filter(a => a.id !== accountId);
    
    return {
      success: true,
      removed: initialLength - this.accounts.length,
      remaining: this.accounts.length
    };
  }
  
  async saveAccounts() {
    const accountFile = path.join(__dirname, 'config', 'accounts.json');
    await fs.ensureDir(path.dirname(accountFile));
    await fs.writeJson(accountFile, this.accounts, { spaces: 2 });
  }
  
  async saveActivityLog() {
    const logFile = path.join(__dirname, 'logs', 'account-activity.json');
    await fs.ensureDir(path.dirname(logFile));
    await fs.writeJson(logFile, this.activityLog, { spaces: 2 });
  }
  
  // Public API
  getAccountCount() {
    return this.accounts.length;
  }
  
  getActiveAccount() {
    return this.activeAccount;
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
      byAge: byAge,
      byPriority: byPriority,
      byActivity: byActivity,
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
  
  getStatus() {
    return {
      active: this.rotationInterval !== null,
      rotationInterval: this.config.rotationInterval,
      activeAccount: this.activeAccount ? this.activeAccount.username : null,
      totalAccounts: this.accounts.length,
      activityLogSize: this.activityLog.length
    };
  }
}

// Create singleton instance
const accountManager = new AccountManager();

// Export for use in other modules
module.exports = accountManager;

// Auto-start if this module is run directly
if (require.main === module) {
  (async () => {
    console.log('🚀 Starting account manager...');
    await accountManager.loadAccounts();
    accountManager.startAutoRotation();
    
    console.log('✅ Account manager ready');
    console.log(`📊 ${accountManager.getAccountCount()} accounts loaded`);
  })();
}
