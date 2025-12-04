const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

class Monitoring {
  constructor() {
    this.metrics = {
      system: {},
      network: {},
      bots: {},
      performance: {}
    };
    
    this.alerts = [];
    this.thresholds = {
      cpu: 80,
      memory: 85,
      bots_disconnected: 2,
      connection_failures: 5,
      suspicion_level: 70
    };
    
    this.logDir = path.join(__dirname, 'logs', 'monitoring');
    this.setupLogging();
    this.startMonitoring();
  }
  
  setupLogging() {
    fs.ensureDirSync(this.logDir);
    
    this.logFiles = {
      system: path.join(this.logDir, 'system.log'),
      network: path.join(this.logDir, 'network.log'),
      bots: path.join(this.logDir, 'bots.log'),
      alerts: path.join(this.logDir, 'alerts.log'),
      performance: path.join(this.logDir, 'performance.log')
    };
  }
  
  startMonitoring() {
    console.log('📊 Starting comprehensive monitoring system...');
    
    setInterval(() => this.monitorSystem(), 30000);
    setInterval(() => this.monitorNetwork(), 45000);
    setInterval(() => this.monitorBots(), 60000);
    setInterval(() => this.monitorPerformance(), 90000);
    setInterval(() => this.checkAlerts(), 120000);
    setInterval(() => this.rotateLogs(), 3600000);
    
    console.log('✅ Monitoring system active');
  }
  
  async monitorSystem() {
    try {
      const metrics = {
        timestamp: new Date().toISOString(),
        cpu: {
          usage: os.loadavg()[0] / os.cpus().length * 100,
          cores: os.cpus().length,
          model: os.cpus()[0].model
        },
        memory: {
          total: os.totalmem(),
          free: os.freemem(),
          used: os.totalmem() - os.freemem(),
          percentage: ((os.totalmem() - os.freemem()) / os.totalmem()) * 100
        },
        disk: await this.getDiskUsage(),
        uptime: os.uptime(),
        platform: os.platform(),
        arch: os.arch()
      };
      
      this.metrics.system = metrics;
      
      if (metrics.cpu.usage > this.thresholds.cpu) {
        this.alert('high_cpu', `CPU usage at ${metrics.cpu.usage.toFixed(1)}%`);
      }
      
      if (metrics.memory.percentage > this.thresholds.memory) {
        this.alert('high_memory', `Memory usage at ${metrics.memory.percentage.toFixed(1)}%`);
      }
      
      this.logToFile('system', metrics);
      
    } catch (error) {
      console.error('❌ System monitoring error:', error.message);
    }
  }
  
  async getDiskUsage() {
    try {
      const { stdout } = await execPromise('df -k /');
      const lines = stdout.trim().split('\n');
      const data = lines[1].split(/\s+/);
      
      return {
        total: parseInt(data[1]) * 1024,
        used: parseInt(data[2]) * 1024,
        free: parseInt(data[3]) * 1024,
        percentage: parseInt(data[4])
      };
    } catch (error) {
      return { total: 0, used: 0, free: 0, percentage: 0 };
    }
  }
  
  async monitorNetwork() {
    try {
      const metrics = {
        timestamp: new Date().toISOString(),
        interfaces: os.networkInterfaces(),
        connections: await this.getNetworkConnections(),
        latency: await this.testLatency(),
        bandwidth: await this.testBandwidth()
      };
      
      this.metrics.network = metrics;
      this.logToFile('network', metrics);
      
    } catch (error) {
      console.error('❌ Network monitoring error:', error.message);
    }
  }
  
  async getNetworkConnections() {
    try {
      const { stdout } = await execPromise('netstat -an | wc -l');
      return parseInt(stdout.trim());
    } catch (error) {
      return 0;
    }
  }
  
  async testLatency() {
    try {
      const start = Date.now();
      const { stdout } = await execPromise('ping -c 1 8.8.8.8');
      const match = stdout.match(/time=([\d.]+) ms/);
      return match ? parseFloat(match[1]) : null;
    } catch (error) {
      return null;
    }
  }
  
  async testBandwidth() {
    return {
      download: 'N/A',
      upload: 'N/A'
    };
  }
  
  async monitorBots() {
    try {
      const botManager = require('./bot').botManager;
      
      const metrics = {
        timestamp: new Date().toISOString(),
        totalBots: botManager ? botManager.bots.size : 0,
        activeBots: botManager ? botManager.getActiveBots().length : 0,
        botDetails: botManager ? botManager.getBotStatus() : [],
        connectionStats: {
          successful: 0,
          failed: 0,
          reconnecting: 0
        },
        activityStats: {
          building: 0,
          exploring: 0,
          mining: 0,
          socializing: 0
        }
      };
      
      const disconnected = metrics.totalBots - metrics.activeBots;
      if (disconnected >= this.thresholds.bots_disconnected) {
        this.alert('bots_disconnected', `${disconnected} bots disconnected`);
      }
      
      this.metrics.bots = metrics;
      this.logToFile('bots', metrics);
      
    } catch (error) {
      console.error('❌ Bot monitoring error:', error.message);
    }
  }
  
  async monitorPerformance() {
    try {
      const metrics = {
        timestamp: new Date().toISOString(),
        process: {
          pid: process.pid,
          memory: process.memoryUsage(),
          uptime: process.uptime(),
          version: process.version
        },
        eventLoop: {
          delay: await this.measureEventLoopDelay(),
          utilization: await this.measureEventLoopUtilization()
        },
        gc: await this.getGCStats(),
        requests: {
          perSecond: 0,
          active: 0,
          total: 0
        }
      };
      
      this.metrics.performance = metrics;
      this.logToFile('performance', metrics);
      
    } catch (error) {
      console.error('❌ Performance monitoring error:', error.message);
    }
  }
  
  async measureEventLoopDelay() {
    const start = Date.now();
    return new Promise(resolve => {
      setImmediate(() => {
        const delay = Date.now() - start;
        resolve(delay);
      });
    });
  }
  
  async measureEventLoopUtilization() {
    return { active: 0, idle: 0, utilization: 0 };
  }
  
  async getGCStats() {
    try {
      const gc = require('gc-stats')();
      return new Promise(resolve => {
        const stats = {
          count: 0,
          time: 0,
          lastType: 'unknown'
        };
        
        gc.on('stats', (info) => {
          stats.count++;
          stats.time += info.pause;
          stats.lastType = info.gctype;
        });
        
        setTimeout(() => {
          gc.removeAllListeners();
          resolve(stats);
        }, 1000);
      });
    } catch (error) {
      return { count: 0, time: 0, lastType: 'unknown' };
    }
  }
  
  checkAlerts() {
    const now = Date.now();
    const recentAlerts = this.alerts.filter(alert => 
      now - alert.timestamp < 3600000
    );
    
    if (recentAlerts.length > 10) {
      this.alert('alert_flood', `Too many alerts: ${recentAlerts.length} in last hour`);
    }
    
    const AntiDetection = require('./anti-detection');
    if (AntiDetection.suspicionLevel > this.thresholds.suspicion_level) {
      this.alert('high_suspicion', 
        `Anti-detection suspicion at ${AntiDetection.suspicionLevel}%`);
    }
  }
  
  alert(type, message, severity = 'warning') {
    const alert = {
      type,
      message,
      severity,
      timestamp: Date.now(),
      date: new Date().toISOString(),
      metrics: this.getCurrentMetrics()
    };
    
    this.alerts.push(alert);
    
    if (this.alerts.length > 1000) {
      this.alerts = this.alerts.slice(-500);
    }
    
    this.logToFile('alerts', alert);
    
    if (severity === 'critical' || severity === 'error') {
      console.error(`🚨 ${severity.toUpperCase()}: ${type} - ${message}`);
    } else if (severity === 'warning') {
      console.warn(`⚠️ WARNING: ${type} - ${message}`);
    } else {
      console.log(`ℹ️ INFO: ${type} - ${message}`);
    }
    
    this.handleAlert(alert);
    
    return alert;
  }
  
  handleAlert(alert) {
    switch (alert.type) {
      case 'high_cpu':
        this.throttleActivity();
        break;
        
      case 'high_memory':
        this.cleanupMemory();
        break;
        
      case 'bots_disconnected':
        this.triggerReconnection();
        break;
        
      case 'high_suspicion':
        this.triggerAntiDetectionCountermeasures();
        break;
        
      case 'alert_flood':
        this.resetAlerts();
        break;
    }
  }
  
  throttleActivity() {
    console.log('⚡ Throttling activity due to high CPU');
  }
  
  cleanupMemory() {
    console.log('🧹 Cleaning up memory');
    if (global.gc) {
      global.gc();
    }
  }
  
  triggerReconnection() {
    console.log('🔌 Triggering bot reconnections');
  }
  
  triggerAntiDetectionCountermeasures() {
    console.log('🛡️ Triggering anti-detection countermeasures');
    const AntiDetection = require('./anti-detection');
    AntiDetection.applyRandomCountermeasures(3);
  }
  
  resetAlerts() {
    console.log('🔄 Resetting alert system');
    this.alerts = [];
  }
  
  logToFile(type, data) {
    const logFile = this.logFiles[type];
    if (!logFile) return;
    
    const logEntry = {
      ...data,
      _timestamp: new Date().toISOString()
    };
    
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
  }
  
  rotateLogs() {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    
    Object.entries(this.logFiles).forEach(([type, filePath]) => {
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        const sizeMB = stats.size / (1024 * 1024);
        
        if (sizeMB > 10) {
          const rotatedFile = filePath.replace('.log', `_${dateStr}.log`);
          fs.renameSync(filePath, rotatedFile);
          console.log(`📁 Rotated ${type} log: ${sizeMB.toFixed(2)}MB`);
        }
      }
    });
  }
  
  // Public API
  getCurrentMetrics() {
    return {
      timestamp: new Date().toISOString(),
      system: this.metrics.system,
      network: this.metrics.network,
      bots: this.metrics.bots,
      performance: this.metrics.performance,
      alerts: this.alerts.length,
      suspicionLevel: require('./anti-detection').suspicionLevel
    };
  }
  
  getRecentAlerts(limit = 10) {
    return this.alerts.slice(-limit).reverse();
  }
  
  getSystemHealth() {
    const health = {
      overall: 'healthy',
      components: {},
      score: 100
    };
    
    if (this.metrics.system.memory && this.metrics.system.memory.percentage > 85) {
      health.components.memory = 'warning';
      health.score -= 20;
    }
    
    if (this.metrics.system.cpu && this.metrics.system.cpu.usage > 80) {
      health.components.cpu = 'warning';
      health.score -= 20;
    }
    
    if (this.metrics.bots) {
      const disconnected = this.metrics.bots.totalBots - this.metrics.bots.activeBots;
      if (disconnected > 0) {
        health.components.bots = 'degraded';
        health.score -= disconnected * 10;
      }
    }
    
    if (this.metrics.network.latency && this.metrics.network.latency > 200) {
      health.components.network = 'warning';
      health.score -= 15;
    }
    
    const suspicion = require('./anti-detection').suspicionLevel;
    if (suspicion > 50) {
      health.components.anti_detection = 'warning';
      health.score -= suspicion / 2;
    }
    
    if (health.score >= 80) health.overall = 'healthy';
    else if (health.score >= 50) health.overall = 'degraded';
    else if (health.score >= 20) health.overall = 'unhealthy';
    else health.overall = 'critical';
    
    return health;
  }
  
  getStatistics() {
    const stats = {
      uptime: process.uptime(),
      totalAlerts: this.alerts.length,
      alertsBySeverity: {},
      metricsCollected: {
        system: Object.keys(this.metrics.system).length,
        network: Object.keys(this.metrics.network).length,
        bots: Object.keys(this.metrics.bots).length,
        performance: Object.keys(this.metrics.performance).length
      },
      logSizes: {}
    };
    
    this.alerts.forEach(alert => {
      stats.alertsBySeverity[alert.severity] = (stats.alertsBySeverity[alert.severity] || 0) + 1;
    });
    
    Object.entries(this.logFiles).forEach(([type, filePath]) => {
      if (fs.existsSync(filePath)) {
        const fileStats = fs.statSync(filePath);
        stats.logSizes[type] = fileStats.size;
      }
    });
    
    return stats;
  }
  
  setThreshold(type, value) {
    if (this.thresholds.hasOwnProperty(type)) {
      const oldValue = this.thresholds[type];
      this.thresholds[type] = value;
      
      console.log(`📊 Updated threshold ${type}: ${oldValue} → ${value}`);
      
      return {
        success: true,
        type,
        oldValue,
        newValue: value
      };
    }
    
    return {
      success: false,
      error: `Unknown threshold type: ${type}`
    };
  }
  
  clearAlerts(type = null) {
    if (type) {
      const before = this.alerts.length;
      this.alerts = this.alerts.filter(alert => alert.type !== type);
      const after = this.alerts.length;
      
      return {
        success: true,
        type,
        cleared: before - after,
        remaining: after
      };
    } else {
      const cleared = this.alerts.length;
      this.alerts = [];
      
      return {
        success: true,
        cleared,
        remaining: 0
      };
    }
  }
}

// Create singleton instance
const monitoring = new Monitoring();

// Export for use in other modules
module.exports = monitoring;

// Auto-start if this module is run directly
if (require.main === module) {
  console.log('🚀 Starting Monitoring system...');
  console.log('✅ Monitoring system ready');
  console.log('📊 Monitoring all system components');
}
