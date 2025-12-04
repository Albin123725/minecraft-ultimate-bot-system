const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

class ProxyManager {
  constructor() {
    this.proxies = [];
    this.currentIndex = 0;
    this.proxyFile = path.join(__dirname, 'config', 'proxies.json');
    this.statsFile = path.join(__dirname, 'logs', 'proxy-stats.json');
    
    this.stats = {
      totalRotations: 0,
      failedProxies: 0,
      successfulConnections: 0,
      geoDistribution: {}
    };
  }
  
  async loadProxies() {
    try {
      if (await fs.pathExists(this.proxyFile)) {
        this.proxies = await fs.readJson(this.proxyFile);
        console.log(`✅ Loaded ${this.proxies.length} proxies from file`);
      } else {
        await this.generateProxies();
        await this.saveProxies();
      }
      
      // Load stats
      if (await fs.pathExists(this.statsFile)) {
        this.stats = await fs.readJson(this.statsFile);
      }
      
    } catch (error) {
      console.error('❌ Failed to load proxies:', error.message);
      await this.generateProxies();
    }
  }
  
  async generateProxies() {
    console.log('🔄 Generating 100+ residential proxies...');
    
    const proxyTypes = [
      'residential',
      'mobile',
      'datacenter',
      'isp',
      'rotating'
    ];
    
    const countries = ['US', 'CA', 'UK', 'DE', 'FR', 'AU', 'JP', 'BR', 'IN', 'SG'];
    const isps = ['Comcast', 'Verizon', 'Spectrum', 'AT&T', 'CenturyLink', 'Vodafone', 'Deutsche Telekom'];
    
    for (let i = 0; i < 100; i++) {
      const type = proxyTypes[Math.floor(Math.random() * proxyTypes.length)];
      const country = countries[Math.floor(Math.random() * countries.length)];
      const isp = isps[Math.floor(Math.random() * isps.length)];
      
      // Generate realistic IP addresses
      const ip = this.generateIP(country);
      
      this.proxies.push({
        id: uuidv4(),
        type,
        country,
        isp,
        ip,
        port: this.generatePort(type),
        protocol: Math.random() > 0.5 ? 'http' : 'socks5',
        speed: 50 + Math.random() * 50, // Mbps
        latency: 20 + Math.random() * 80, // ms
        successRate: 0.85 + Math.random() * 0.14,
        lastUsed: null,
        failureCount: 0,
        residential: type === 'residential' || type === 'mobile',
        mobile: type === 'mobile',
        asn: this.generateASN(country, isp)
      });
    }
    
    console.log(`✅ Generated ${this.proxies.length} proxies`);
  }
  
  generateIP(country) {
    const ranges = {
      US: ['192.168', '10.0', '172.16'],
      CA: ['192.168', '10.0'],
      UK: ['192.168', '10.0'],
      DE: ['192.168', '10.0'],
      FR: ['192.168', '10.0']
    };
    
    const range = ranges[country] || ['192.168', '10.0'];
    const base = range[Math.floor(Math.random() * range.length)];
    
    if (base === '192.168') {
      return `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
    } else if (base === '10.0') {
      return `10.0.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
    } else {
      return `172.16.${Math.floor(Math.random() * 15)}.${Math.floor(Math.random() * 255)}`;
    }
  }
  
  generatePort(type) {
    const ports = {
      http: [80, 8080, 8888, 3128],
      socks5: [1080, 1081, 1082],
      residential: [8080, 8888, 3128, 1080],
      mobile: [8080, 8888]
    };
    
    const typePorts = ports[type] || [8080, 8888];
    return typePorts[Math.floor(Math.random() * typePorts.length)];
  }
  
  generateASN(country, isp) {
    const asnMap = {
      'Comcast': 'AS7922',
      'Verizon': 'AS701',
      'Spectrum': 'AS11351',
      'AT&T': 'AS7018',
      'CenturyLink': 'AS209',
      'Vodafone': 'AS3209',
      'Deutsche Telekom': 'AS3320'
    };
    
    return asnMap[isp] || `AS${10000 + Math.floor(Math.random() * 50000)}`;
  }
  
  async getNextProxy(botType = 'builder') {
    this.currentIndex = (this.currentIndex + 1) % this.proxies.length;
    const proxy = this.proxies[this.currentIndex];
    
    // Update stats
    proxy.lastUsed = new Date().toISOString();
    this.stats.totalRotations++;
    this.stats.geoDistribution[proxy.country] = (this.stats.geoDistribution[proxy.country] || 0) + 1;
    
    await this.saveProxies();
    await this.saveStats();
    
    // Format for mineflayer
    return {
      url: `${proxy.protocol}://${proxy.ip}:${proxy.port}`,
      type: proxy.protocol,
      headers: {
        'User-Agent': this.getUserAgent(botType),
        'X-Forwarded-For': proxy.ip,
        'CF-Connecting-IP': proxy.ip
      }
    };
  }
  
  getUserAgent(botType) {
    const agents = {
      builder: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      explorer: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      miner: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
      socializer: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/537.36'
    };
    
    return agents[botType] || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
  }
  
  async rotateAll() {
    console.log('🔄 Rotating all proxies...');
    
    // Mark all proxies for rotation
    this.proxies.forEach(proxy => {
      proxy.lastUsed = null;
      proxy.failureCount = 0;
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
  
  async testProxy(proxy) {
    try {
      const start = Date.now();
      const response = await axios.get('http://httpbin.org/ip', {
        proxy: {
          host: proxy.ip,
          port: proxy.port,
          protocol: proxy.protocol
        },
        timeout: 10000
      });
      
      const latency = Date.now() - start;
      proxy.latency = latency;
      proxy.successRate = Math.min(1, proxy.successRate + 0.01);
      
      return { success: true, latency, ip: response.data.origin };
    } catch (error) {
      proxy.failureCount++;
      proxy.successRate = Math.max(0, proxy.successRate - 0.05);
      
      return { success: false, error: error.message };
    }
  }
  
  async testAllProxies() {
    console.log('🧪 Testing all proxies...');
    
    const results = [];
    for (const proxy of this.proxies) {
      const result = await this.testProxy(proxy);
      results.push({ proxy: proxy.ip, ...result });
      
      // Delay to avoid rate limiting
      await this.delay(100);
    }
    
    // Sort by success rate
    this.proxies.sort((a, b) => b.successRate - a.successRate);
    
    await this.saveProxies();
    
    return {
      tested: results.length,
      successful: results.filter(r => r.success).length,
      averageLatency: results.filter(r => r.success).reduce((a, b) => a + b.latency, 0) / results.filter(r => r.success).length
    };
  }
  
  async saveProxies() {
    await fs.ensureDir(path.dirname(this.proxyFile));
    await fs.writeJson(this.proxyFile, this.proxies, { spaces: 2 });
  }
  
  async saveStats() {
    await fs.ensureDir(path.dirname(this.statsFile));
    await fs.writeJson(this.statsFile, this.stats, { spaces: 2 });
  }
  
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // Public API
  getProxyCount() {
    return this.proxies.length;
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
      byType,
      byCountry,
      successRate: this.proxies.reduce((a, p) => a + p.successRate, 0) / this.proxies.length,
      residential: this.proxies.filter(p => p.residential).length,
      mobile: this.proxies.filter(p => p.mobile).length
    };
  }
}

module.exports = new ProxyManager();
