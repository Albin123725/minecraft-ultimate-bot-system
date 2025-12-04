const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const crypto = require('crypto');

class ProxyManager {
  constructor() {
    this.proxies = [];
    this.activeProxy = null;
    this.rotationInterval = null;
    this.stats = {
      totalRotations: 0,
      successfulConnections: 0,
      failedConnections: 0,
      averageLatency: 0
    };
    
    this.config = {
      rotationInterval: 30 * 60 * 1000, // 30 minutes
      testUrl: 'http://httpbin.org/ip',
      timeout: 10000,
      maxRetries: 3
    };
    
    this.loadProxies();
  }
  
  async loadProxies() {
    try {
      const proxyFile = path.join(__dirname, 'config', 'proxies.json');
      if (await fs.pathExists(proxyFile)) {
        this.proxies = await fs.readJson(proxyFile);
        console.log(`✅ Loaded ${this.proxies.length} proxies from file`);
      } else {
        await this.generateDefaultProxies();
      }
      
      // Load stats
      const statsFile = path.join(__dirname, 'logs', 'proxy-stats.json');
      if (await fs.pathExists(statsFile)) {
        this.stats = await fs.readJson(statsFile);
      }
      
    } catch (error) {
      console.error('❌ Failed to load proxies:', error.message);
      await this.generateDefaultProxies();
    }
  }
  
  async generateDefaultProxies(count = 100) {
    console.log(`🔄 Generating ${count} default proxies...`);
    
    const proxyTypes = ['residential', 'mobile', 'datacenter'];
    const countries = ['US', 'CA', 'UK', 'DE', 'FR', 'AU', 'JP'];
    
    for (let i = 0; i < count; i++) {
      const type = proxyTypes[Math.floor(Math.random() * proxyTypes.length)];
      const country = countries[Math.floor(Math.random() * countries.length)];
      
      this.proxies.push({
        id: crypto.randomBytes(8).toString('hex'),
        type: type,
        country: country,
        ip: this.generateIP(country),
        port: this.generatePort(type),
        protocol: Math.random() > 0.5 ? 'http' : 'socks5',
        speed: 20 + Math.random() * 80,
        latency: 10 + Math.random() * 100,
        successRate: 0.85 + Math.random() * 0.14,
        lastUsed: null,
        lastTested: null,
        failureCount: 0,
        residential: type === 'residential' || type === 'mobile',
        mobile: type === 'mobile',
        asn: this.generateASN(country)
      });
    }
    
    await this.saveProxies();
    console.log(`✅ Generated ${this.proxies.length} proxies`);
  }
  
  generateIP(country) {
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
  
  generatePort(type) {
    const ports = {
      http: [80, 8080, 8888, 3128],
      socks5: [1080, 1081, 1082],
      residential: [8080, 8888],
      mobile: [8080, 8888]
    };
    
    const typePorts = ports[type] || [8080];
    return typePorts[Math.floor(Math.random() * typePorts.length)];
  }
  
  generateASN(country) {
    const asnMap = {
      'US': 'AS' + (1000 + Math.floor(Math.random() * 9000)),
      'CA': 'AS' + (2000 + Math.floor(Math.random() * 8000)),
      'UK': 'AS' + (3000 + Math.floor(Math.random() * 7000)),
      'DE': 'AS' + (4000 + Math.floor(Math.random() * 6000)),
      'FR': 'AS' + (5000 + Math.floor(Math.random() * 5000)),
      'AU': 'AS' + (6000 + Math.floor(Math.random() * 4000)),
      'JP': 'AS' + (7000 + Math.floor(Math.random() * 3000))
    };
    
    return asnMap[country] || 'AS' + (8000 + Math.floor(Math.random() * 2000));
  }
  
  async getNextProxy() {
    // Filter by success rate and sort
    const availableProxies = this.proxies
      .filter(p => p.successRate > 0.5)
      .sort((a, b) => {
        // Sort by success rate, then by last used
        if (b.successRate !== a.successRate) return b.successRate - a.successRate;
        return (a.lastUsed || 0) - (b.lastUsed || 0);
      });
    
    if (availableProxies.length === 0) {
      console.warn('⚠️ No available proxies, using fallback');
      return null;
    }
    
    const proxy = availableProxies[0];
    proxy.lastUsed = Date.now();
    this.activeProxy = proxy;
    
    this.stats.totalRotations++;
    
    await this.saveProxies();
    await this.saveStats();
    
    return {
      host: proxy.ip,
      port: proxy.port,
      protocol: proxy.protocol,
      headers: {
        'User-Agent': this.getUserAgent(),
        'X-Forwarded-For': proxy.ip,
        'CF-Connecting-IP': proxy.ip
      }
    };
  }
  
  getUserAgent() {
    const agents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/537.36 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/537.36'
    ];
    
    return agents[Math.floor(Math.random() * agents.length)];
  }
  
  async testProxy(proxy) {
    const startTime = Date.now();
    
    try {
      const response = await axios.get(this.config.testUrl, {
        proxy: {
          host: proxy.ip,
          port: proxy.port,
          protocol: proxy.protocol
        },
        timeout: this.config.timeout
      });
      
      const latency = Date.now() - startTime;
      proxy.latency = latency;
      proxy.successRate = Math.min(1, proxy.successRate + 0.01);
      proxy.lastTested = new Date().toISOString();
      
      this.stats.successfulConnections++;
      this.stats.averageLatency = 
        (this.stats.averageLatency * (this.stats.successfulConnections - 1) + latency) / 
        this.stats.successfulConnections;
      
      return {
        success: true,
        latency: latency,
        ip: response.data.origin,
        proxy: proxy
      };
      
    } catch (error) {
      proxy.failureCount++;
      proxy.successRate = Math.max(0, proxy.successRate - 0.05);
      proxy.lastTested = new Date().toISOString();
      
      this.stats.failedConnections++;
      
      return {
        success: false,
        error: error.message,
        proxy: proxy
      };
    }
  }
  
  async testAllProxies() {
    console.log('🧪 Testing all proxies...');
    
    const results = [];
    for (const proxy of this.proxies) {
      const result = await this.testProxy(proxy);
      results.push(result);
      
      // Delay to avoid rate limiting
      await this.delay(100);
    }
    
    // Sort by success rate
    this.proxies.sort((a, b) => b.successRate - a.successRate);
    
    await this.saveProxies();
    
    const successful = results.filter(r => r.success).length;
    console.log(`✅ Tested ${results.length} proxies: ${successful} successful`);
    
    return {
      tested: results.length,
      successful: successful,
      failed: results.length - successful,
      averageLatency: this.stats.averageLatency
    };
  }
  
  async rotateProxies() {
    console.log('🔄 Rotating all proxies...');
    
    // Mark all proxies for rotation
    this.proxies.forEach(proxy => {
      proxy.lastUsed = null;
    });
    
    // Shuffle array
    this.proxies = this.shuffleArray(this.proxies);
    
    await this.saveProxies();
    
    return {
      success: true,
      message: `Rotated ${this.proxies.length} proxies`,
      newOrder: this.proxies.map(p => p.ip)
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
  
  startAutoRotation() {
    if (this.rotationInterval) {
      clearInterval(this.rotationInterval);
    }
    
    this.rotationInterval = setInterval(async () => {
      console.log('⏰ Auto-rotating proxies...');
      await this.rotateProxies();
      
      // Test proxies after rotation
      await this.testAllProxies();
      
    }, this.config.rotationInterval);
    
    console.log(`✅ Auto rotation started (every ${this.config.rotationInterval / 60000} minutes)`);
  }
  
  stopAutoRotation() {
    if (this.rotationInterval) {
      clearInterval(this.rotationInterval);
      this.rotationInterval = null;
      console.log('⏹️ Auto rotation stopped');
    }
  }
  
  async addProxy(proxyData) {
    const newProxy = {
      id: crypto.randomBytes(8).toString('hex'),
      ...proxyData,
      successRate: 0.9,
      lastUsed: null,
      lastTested: null,
      failureCount: 0
    };
    
    this.proxies.push(newProxy);
    await this.saveProxies();
    
    // Test the new proxy
    const testResult = await this.testProxy(newProxy);
    
    return {
      success: true,
      proxy: newProxy,
      testResult: testResult
    };
  }
  
  removeProxy(proxyId) {
    const initialLength = this.proxies.length;
    this.proxies = this.proxies.filter(p => p.id !== proxyId);
    
    return {
      success: true,
      removed: initialLength - this.proxies.length,
      remaining: this.proxies.length
    };
  }
  
  async saveProxies() {
    const proxyFile = path.join(__dirname, 'config', 'proxies.json');
    await fs.ensureDir(path.dirname(proxyFile));
    await fs.writeJson(proxyFile, this.proxies, { spaces: 2 });
  }
  
  async saveStats() {
    const statsFile = path.join(__dirname, 'logs', 'proxy-stats.json');
    await fs.ensureDir(path.dirname(statsFile));
    await fs.writeJson(statsFile, this.stats, { spaces: 2 });
  }
  
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // Public API
  getProxyCount() {
    return this.proxies.length;
  }
  
  getActiveProxy() {
    return this.activeProxy;
  }
  
  getProxyStats() {
    const byType = {};
    const byCountry = {};
    
    this.proxies.forEach(proxy => {
      byType[proxy.type] = (byType[proxy.type] || 0) + 1;
      byCountry[proxy.country] = (byCountry[proxy.country] || 0) + 1;
    });
    
    return {
      total: this.proxies.length,
      active: this.proxies.filter(p => p.successRate > 0.7).length,
      byType: byType,
      byCountry: byCountry,
      averageSuccessRate: this.proxies.reduce((sum, p) => sum + p.successRate, 0) / this.proxies.length,
      residential: this.proxies.filter(p => p.residential).length,
      mobile: this.proxies.filter(p => p.mobile).length
    };
  }
  
  getStatus() {
    return {
      active: this.rotationInterval !== null,
      rotationInterval: this.config.rotationInterval,
      lastRotation: this.stats.totalRotations,
      activeProxy: this.activeProxy ? this.activeProxy.ip : null,
      stats: this.stats
    };
  }
}

// Create singleton instance
const proxyManager = new ProxyManager();

// Export for use in other modules
module.exports = proxyManager;

// Auto-start if this module is run directly
if (require.main === module) {
  (async () => {
    console.log('🚀 Starting proxy manager...');
    await proxyManager.loadProxies();
    await proxyManager.testAllProxies();
    proxyManager.startAutoRotation();
    
    console.log('✅ Proxy manager ready');
    console.log(`📊 ${proxyManager.getProxyCount()} proxies loaded`);
  })();
}
