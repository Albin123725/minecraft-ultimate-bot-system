const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const UserAgent = require('user-agents');

class ClientSimulator {
  constructor() {
    this.fingerprints = [];
    this.fingerprintsFile = path.join(__dirname, 'config', 'fingerprints.json');
    
    this.javaVersions = ['1.8.0_351', '11.0.20', '17.0.8', '21.0.1'];
    this.launchers = ['Official', 'MultiMC', 'GDLauncher', 'ATLauncher', 'PrismLauncher', 'TLauncher'];
    this.resourcePacks = [
      'Faithful 32x',
      'Vanilla Tweaks',
      'Default',
      'Soartex Fanver',
      'Mizuno 16 Craft',
      'Custom Pack'
    ];
  }
  
  async generateFingerprints(count = 50) {
    console.log('🔄 Generating client fingerprints...');
    
    for (let i = 0; i < count; i++) {
      const userAgent = new UserAgent();
      const fingerprint = {
        id: crypto.randomBytes(16).toString('hex'),
        userAgent: userAgent.toString(),
        javaVersion: this.javaVersions[Math.floor(Math.random() * this.javaVersions.length)],
        launcher: this.launchers[Math.floor(Math.random() * this.launchers.length)],
        resourcePack: this.resourcePacks[Math.floor(Math.random() * this.resourcePacks.length)],
        viewDistance: Math.floor(Math.random() * 8) + 4, // 4-12
        simulationDistance: Math.floor(Math.random() * 6) + 4, // 4-10
        renderDistance: Math.floor(Math.random() * 8) + 4, // 4-12
        maxFps: [60, 120, 144, 240, 0][Math.floor(Math.random() * 5)], // 0 = unlimited
        vsync: Math.random() > 0.5,
        mipmapLevels: Math.floor(Math.random() * 5),
        anisotropicFiltering: Math.floor(Math.random() * 17),
        entityDistance: Math.floor(Math.random() * 101), // 0-100%
        particles: ['All', 'Decreased', 'Minimal'][Math.floor(Math.random() * 3)],
        clouds: Math.random() > 0.5,
        smoothLighting: [0, 1, 2][Math.floor(Math.random() * 3)],
        biomeBlend: Math.floor(Math.random() * 8) * 5, // 0-35 in steps of 5
        entityShadows: Math.random() > 0.5,
        attackIndicator: ['Crosshair', 'Hotbar'][Math.floor(Math.random() * 2)],
        autoJump: Math.random() > 0.7,
        chatOpacity: Math.random() * 0.5 + 0.5, // 0.5-1.0
        chatScale: Math.random() * 0.5 + 0.5, // 0.5-1.0
        chatWidth: Math.random() * 0.3 + 0.7, // 0.7-1.0
        chatHeightUnfocused: Math.floor(Math.random() * 7) + 4, // 4-10
        chatHeightFocused: Math.floor(Math.random() * 11) + 10, // 10-20
        fov: Math.random() * 20 + 70, // 70-90
        gamma: Math.random() * 0.5 + 0.5, // 0.5-1.0
        guiScale: ['Auto', 'Small', 'Normal', 'Large'][Math.floor(Math.random() * 4)],
        bobView: Math.random() > 0.3,
        attackCrosshair: Math.random() > 0.5,
        fullscreen: Math.random() > 0.8,
        clientHash: crypto.randomBytes(32).toString('hex'),
        timestamp: new Date().toISOString()
      };
      
      // Add simulated IP based on fingerprint
      fingerprint.simulatedIP = this.generateSimulatedIP(fingerprint);
      fingerprint.geoLocation = this.getGeoLocation(fingerprint);
      fingerprint.connectionType = this.getConnectionType(fingerprint);
      
      this.fingerprints.push(fingerprint);
    }
    
    await this.saveFingerprints();
    console.log(`✅ Generated ${this.fingerprints.length} client fingerprints`);
  }
  
  generateSimulatedIP(fingerprint) {
    // Generate IP based on various factors to create consistency
    const ipHash = crypto.createHash('md5').update(fingerprint.id).digest('hex');
    const segments = [
      parseInt(ipHash.slice(0, 2), 16) % 254 + 1,
      parseInt(ipHash.slice(2, 4), 16) % 254 + 1,
      parseInt(ipHash.slice(4, 6), 16) % 254 + 1,
      parseInt(ipHash.slice(6, 8), 16) % 254 + 1
    ];
    
    return segments.join('.');
  }
  
  getGeoLocation(fingerprint) {
    // Extract location from user agent or simulate
    const locations = [
      { country: 'US', city: 'New York', timezone: 'America/New_York' },
      { country: 'CA', city: 'Toronto', timezone: 'America/Toronto' },
      { country: 'UK', city: 'London', timezone: 'Europe/London' },
      { country: 'DE', city: 'Berlin', timezone: 'Europe/Berlin' },
      { country: 'FR', city: 'Paris', timezone: 'Europe/Paris' },
      { country: 'AU', city: 'Sydney', timezone: 'Australia/Sydney' },
      { country: 'JP', city: 'Tokyo', timezone: 'Asia/Tokyo' }
    ];
    
    return locations[Math.floor(Math.random() * locations.length)];
  }
  
  getConnectionType(fingerprint) {
    const types = [
      { type: 'ethernet', speed: '1000 Mbps', latency: '15ms' },
      { type: 'wifi', speed: '300 Mbps', latency: '35ms' },
      { type: 'wifi', speed: '150 Mbps', latency: '50ms' },
      { type: 'mobile', speed: '100 Mbps', latency: '65ms' },
      { type: 'mobile', speed: '50 Mbps', latency: '85ms' }
    ];
    
    return types[Math.floor(Math.random() * types.length)];
  }
  
  async getFingerprint(botType) {
    if (this.fingerprints.length === 0) {
      await this.generateFingerprints();
    }
    
    // Select fingerprint based on bot type
    let filtered = this.fingerprints;
    
    // Builder bots might have better hardware
    if (botType === 'builder') {
      filtered = this.fingerprints.filter(f => 
        f.viewDistance >= 8 && f.maxFps >= 120
      );
    }
    // Explorer bots might have balanced settings
    else if (botType === 'explorer') {
      filtered = this.fingerprints.filter(f => 
        f.renderDistance >= 8 && f.entityDistance >= 80
      );
    }
    
    if (filtered.length === 0) {
      filtered = this.fingerprints;
    }
    
    const fingerprint = filtered[Math.floor(Math.random() * filtered.length)];
    
    // Add client name
    fingerprint.clientName = `${fingerprint.launcher} ${fingerprint.javaVersion}`;
    
    return {
      simulatedIP: fingerprint.simulatedIP,
      clientName: fingerprint.clientName,
      javaVersion: fingerprint.javaVersion,
      launcher: fingerprint.launcher,
      viewDistance: fingerprint.viewDistance,
      maxFps: fingerprint.maxFps,
      geoLocation: fingerprint.geoLocation,
      connectionType: fingerprint.connectionType,
      userAgent: fingerprint.userAgent,
      clientHash: fingerprint.clientHash,
      skinParts: {
        showCape: Math.random() > 0.5,
        showJacket: Math.random() > 0.5,
        showLeftSleeve: Math.random() > 0.5,
        showRightSleeve: Math.random() > 0.5,
        showLeftPants: Math.random() > 0.5,
        showRightPants: Math.random() > 0.5,
        showHat: Math.random() > 0.5
      }
    };
  }
  
  async rotateFingerprints() {
    console.log('🔄 Rotating client fingerprints...');
    
    // Generate new fingerprints
    await this.generateFingerprints(20);
    
    // Remove old fingerprints (keep last 50)
    if (this.fingerprints.length > 50) {
      this.fingerprints = this.fingerprints.slice(-50);
    }
    
    await this.saveFingerprints();
    
    return {
      success: true,
      newFingerprints: 20,
      totalFingerprints: this.fingerprints.length
    };
  }
  
  async saveFingerprints() {
    await fs.ensureDir(path.dirname(this.fingerprintsFile));
    await fs.writeJson(this.fingerprintsFile, this.fingerprints, { spaces: 2 });
  }
  
  async loadFingerprints() {
    if (await fs.pathExists(this.fingerprintsFile)) {
      this.fingerprints = await fs.readJson(this.fingerprintsFile);
      console.log(`✅ Loaded ${this.fingerprints.length} fingerprints`);
    } else {
      await this.generateFingerprints();
    }
  }
  
  // Public API
  getFingerprintStats() {
    const stats = {
      total: this.fingerprints.length,
      javaVersions: {},
      launchers: {},
      viewDistances: {},
      connectionTypes: {}
    };
    
    this.fingerprints.forEach(fp => {
      stats.javaVersions[fp.javaVersion] = (stats.javaVersions[fp.javaVersion] || 0) + 1;
      stats.launchers[fp.launcher] = (stats.launchers[fp.launcher] || 0) + 1;
      stats.viewDistances[fp.viewDistance] = (stats.viewDistances[fp.viewDistance] || 0) + 1;
      stats.connectionTypes[fp.connectionType.type] = (stats.connectionTypes[fp.connectionType.type] || 0) + 1;
    });
    
    return stats;
  }
  
  simulateClientUpdate(fingerprintId) {
    const fingerprint = this.fingerprints.find(f => f.id === fingerprintId);
    if (!fingerprint) return false;
    
    // Simulate a client setting change
    const settings = ['viewDistance', 'renderDistance', 'maxFps', 'entityDistance'];
    const setting = settings[Math.floor(Math.random() * settings.length)];
    const oldValue = fingerprint[setting];
    
    if (typeof oldValue === 'number') {
      fingerprint[setting] = Math.max(1, oldValue + (Math.random() > 0.5 ? 1 : -1));
    }
    
    fingerprint.timestamp = new Date().toISOString();
    
    return {
      success: true,
      setting,
      oldValue,
      newValue: fingerprint[setting]
    };
  }
}

module.exports = new ClientSimulator();
