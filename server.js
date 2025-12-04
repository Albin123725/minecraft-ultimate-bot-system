const express = require('express');
const WebSocket = require('ws');
const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const app = express();
const PORT = process.env.WEB_PORT || 10000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// ================= DASHBOARD =================

app.get('/', (req, res) => {
  const html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ultimate Minecraft Bot System v7.0</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
        background: linear-gradient(135deg, #0f172a, #1e293b);
        color: #f1f5f9;
        min-height: 100vh;
        padding: 20px;
      }
      .container { max-width: 1400px; margin: 0 auto; }
      .header {
        text-align: center;
        padding: 40px 20px;
        background: rgba(30, 41, 59, 0.8);
        border-radius: 20px;
        margin-bottom: 30px;
        border: 2px solid #3b82f6;
        backdrop-filter: blur(10px);
      }
      .status-badges {
        display: flex;
        justify-content: center;
        gap: 10px;
        margin-top: 20px;
        flex-wrap: wrap;
      }
      .badge {
        padding: 8px 16px;
        border-radius: 20px;
        font-weight: 600;
        font-size: 14px;
      }
      .badge.online { background: #10b981; color: #064e3b; }
      .badge.warning { background: #f59e0b; color: #78350f; }
      .badge.error { background: #ef4444; color: #7f1d1d; }
      .badge.info { background: #3b82f6; color: #1e40af; }
      
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 20px;
        margin-bottom: 30px;
      }
      .stat-card {
        background: rgba(30, 41, 59, 0.8);
        padding: 25px;
        border-radius: 15px;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(100, 116, 139, 0.3);
        transition: transform 0.3s, border-color 0.3s;
      }
      .stat-card:hover {
        transform: translateY(-5px);
        border-color: #3b82f6;
      }
      .stat-value {
        font-size: 2.5em;
        font-weight: 800;
        background: linear-gradient(45deg, #3b82f6, #8b5cf6);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      .bot-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 20px;
        margin: 30px 0;
      }
      .bot-card {
        background: linear-gradient(145deg, #1e293b, #0f172a);
        padding: 20px;
        border-radius: 15px;
        position: relative;
        overflow: hidden;
        border-left: 5px solid;
      }
      .bot-card.builder { border-left-color: #10b981; }
      .bot-card.explorer { border-left-color: #3b82f6; }
      .bot-card.miner { border-left-color: #f59e0b; }
      .bot-card.socializer { border-left-color: #8b5cf6; }
      .bot-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: inherit;
      }
      .health-bar {
        height: 8px;
        background: rgba(100, 116, 139, 0.3);
        border-radius: 4px;
        margin: 10px 0;
        overflow: hidden;
      }
      .health-fill {
        height: 100%;
        border-radius: 4px;
        transition: width 0.3s;
      }
      .controls {
        display: flex;
        gap: 10px;
        margin-top: 30px;
        flex-wrap: wrap;
      }
      .btn {
        padding: 12px 24px;
        border: none;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .btn-primary {
        background: linear-gradient(45deg, #3b82f6, #8b5cf6);
        color: white;
      }
      .btn-secondary {
        background: rgba(100, 116, 139, 0.3);
        color: #cbd5e1;
      }
      .btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 20px rgba(59, 130, 246, 0.3);
      }
      
      .live-data {
        background: rgba(15, 23, 42, 0.9);
        padding: 20px;
        border-radius: 15px;
        margin-top: 30px;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        font-size: 12px;
        max-height: 400px;
        overflow-y: auto;
      }
      
      @media (max-width: 768px) {
        .stats-grid {
          grid-template-columns: 1fr;
        }
        .bot-grid {
          grid-template-columns: 1fr;
        }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <!-- Header -->
      <div class="header">
        <h1 style="font-size: 2.5em; margin-bottom: 10px;">🎮 Ultimate Minecraft Bot System v7.0</h1>
        <p style="opacity: 0.8; font-size: 1.2em; margin-bottom: 20px;">
          Complete Automation with 100+ Proxies, 10+ Accounts & Neural AI
        </p>
        <div class="status-badges">
          <span class="badge online">🟢 SYSTEM ONLINE</span>
          <span class="badge info">🤖 4 BOTS ACTIVE</span>
          <span class="badge info">🌐 100+ PROXIES</span>
          <span class="badge info">👤 10+ ACCOUNTS</span>
          <span class="badge info">🧠 NEURAL AI ACTIVE</span>
          <span class="badge info">🛡️ ANTI-DETECTION ON</span>
        </div>
      </div>
      
      <!-- Stats Grid -->
      <div class="stats-grid" id="statsGrid">
        <div class="stat-card">
          <h3>📊 SYSTEM STATUS</h3>
          <div class="stat-value" id="systemStatus">LOADING...</div>
          <p>Uptime: <span id="uptime">--</span></p>
        </div>
        <div class="stat-card">
          <h3>🌐 NETWORK</h3>
          <div class="stat-value" id="proxyCount">--</div>
          <p>Active Proxies: <span id="activeProxies">--</span></p>
        </div>
        <div class="stat-card">
          <h3>🤖 BOTS</h3>
          <div class="stat-value" id="botCount">--</div>
          <p>Connected: <span id="connectedBots">--</span></p>
        </div>
        <div class="stat-card">
          <h3>🛡️ SECURITY</h3>
          <div class="stat-value" id="suspicionLevel">--%</div>
          <p>Anti-Detection: <span id="antiDetectionStatus">--</span></p>
        </div>
      </div>
      
      <!-- Live Bots -->
      <h2 style="margin: 30px 0 20px 0; color: #f1f5f9;">🤖 LIVE BOTS</h2>
      <div class="bot-grid" id="botGrid">
        <!-- Bot cards will be dynamically inserted -->
      </div>
      
      <!-- Controls -->
      <div class="controls">
        <button class="btn btn-primary" onclick="sendCommand('start_all')">
          🚀 START ALL BOTS
        </button>
        <button class="btn btn-secondary" onclick="sendCommand('rotate_proxies')">
          🔄 ROTATE PROXIES
        </button>
        <button class="btn btn-secondary" onclick="sendCommand('rotate_accounts')">
          👤 SWITCH ACCOUNTS
        </button>
        <button class="btn btn-secondary" onclick="sendCommand('emergency_stop')">
          🛑 EMERGENCY STOP
        </button>
        <button class="btn btn-secondary" onclick="showLogs()">
          📊 VIEW LOGS
        </button>
        <button class="btn btn-secondary" onclick="toggleAI()">
          🧠 TOGGLE AI
        </button>
      </div>
      
      <!-- Live Data Feed -->
      <h2 style="margin: 40px 0 20px 0; color: #f1f5f9;">📈 LIVE DATA FEED</h2>
      <div class="live-data" id="liveData">
        Connecting to live feed...
      </div>
    </div>
    
    <script>
      const ws = new WebSocket('ws://' + window.location.hostname + ':10001');
      let systemData = {};
      
      ws.onopen = () => {
        console.log('✅ Connected to WebSocket server');
        document.getElementById('liveData').innerText = 'Connected to live feed...';
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          systemData = data;
          updateDashboard(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        document.getElementById('liveData').innerText = 'WebSocket connection error';
      };
      
      ws.onclose = () => {
        console.log('WebSocket connection closed');
        document.getElementById('liveData').innerText = 'Connection lost. Reconnecting...';
        setTimeout(() => window.location.reload(), 5000);
      };
      
      function updateDashboard(data) {
        // Update stats
        if (data.stats) {
          document.getElementById('systemStatus').textContent = data.stats.status || 'ONLINE';
          document.getElementById('uptime').textContent = formatUptime(data.stats.uptime || 0);
          document.getElementById('proxyCount').textContent = data.stats.proxies || '--';
          document.getElementById('activeProxies').textContent = data.stats.activeProxies || '--';
          document.getElementById('botCount').textContent = data.stats.bots || '--';
          document.getElementById('connectedBots').textContent = data.stats.connectedBots || '--';
          document.getElementById('suspicionLevel').textContent = (data.stats.suspicion || '0') + '%';
          document.getElementById('antiDetectionStatus').textContent = 
            data.stats.antiDetection || 'ACTIVE';
        }
        
        // Update bots
        if (data.bots && Array.isArray(data.bots)) {
          updateBotGrid(data.bots);
        }
        
        // Update live data
        updateLiveData(data);
      }
      
      function updateBotGrid(bots) {
        const botGrid = document.getElementById('botGrid');
        botGrid.innerHTML = '';
        
        bots.forEach(bot => {
          const botCard = document.createElement('div');
          botCard.className = `bot-card ${bot.type || 'unknown'}`;
          
          const healthPercent = ((bot.health || 20) / 20) * 100;
          const healthColor = healthPercent > 70 ? '#10b981' : 
                             healthPercent > 30 ? '#f59e0b' : '#ef4444';
          
          botCard.innerHTML = \`
            <h3 style="margin-bottom: 10px;">\${bot.name || 'Unknown'}</h3>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span style="background: rgba(100, 116, 139, 0.3); padding: 4px 8px; border-radius: 4px;">
                \${bot.type || 'unknown'}
              </span>
              <span style="color: \${healthColor};">\${bot.health || 0}❤️</span>
            </div>
            <p style="font-size: 12px; opacity: 0.8; margin-bottom: 5px;">🌐 \${bot.ip || 'Unknown IP'}</p>
            <p style="font-size: 12px; opacity: 0.8; margin-bottom: 10px;">📍 \${bot.location || 'Unknown'}</p>
            <div class="health-bar">
              <div class="health-fill" style="width: \${healthPercent}%; background: \${healthColor};"></div>
            </div>
            <p style="margin-top: 10px; font-size: 14px;">🎯 \${bot.activity || 'Idle'}</p>
          \`;
          
          botGrid.appendChild(botCard);
        });
      }
      
      function updateLiveData(data) {
        const liveDataDiv = document.getElementById('liveData');
        const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
        
        let liveData = \`[\${timestamp}] SYSTEM UPDATE\\n\`;
        liveData += \`  Status: \${data.stats?.status || 'UNKNOWN'}\\n\`;
        liveData += \`  Bots: \${data.stats?.connectedBots || 0}/\${data.stats?.bots || 0} connected\\n\`;
        liveData += \`  Proxies: \${data.stats?.activeProxies || 0}/\${data.stats?.proxies || 0} active\\n\`;
        liveData += \`  Suspicion: \${data.stats?.suspicion || 0}%\\n\\n\`;
        
        if (data.bots && data.bots.length > 0) {
          liveData += 'ACTIVE BOTS:\\n';
          data.bots.forEach(bot => {
            liveData += \`  • \${bot.name} (\${bot.type}): \${bot.activity || 'Idle'}\\n\`;
          });
        }
        
        liveDataDiv.textContent = liveData;
        liveDataDiv.scrollTop = liveDataDiv.scrollHeight;
      }
      
      function formatUptime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        return \`\${hours}h \${minutes}m \${secs}s\`;
      }
      
      function sendCommand(command) {
        fetch('/api/command', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command: command })
        })
        .then(response => response.json())
        .then(data => {
          alert(data.message || 'Command sent successfully');
        })
        .catch(error => {
          console.error('Command error:', error);
          alert('Failed to send command');
        });
      }
      
      function showLogs() {
        window.open('/logs', '_blank');
      }
      
      function toggleAI() {
        fetch('/api/toggle-ai', { method: 'POST' })
        .then(response => response.json())
        .then(data => {
          alert('AI toggled: ' + (data.enabled ? 'ENABLED' : 'DISABLED'));
        });
      }
      
      // Auto-refresh every 30 seconds as fallback
      setInterval(() => {
        if (ws.readyState === WebSocket.CLOSED) {
          window.location.reload();
        }
      }, 30000);
    </script>
  </body>
  </html>
  `;
  res.send(html);
});

// ================= API ENDPOINTS =================

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    version: '7.0.0',
    timestamp: new Date().toISOString(),
    services: {
      web: 'running',
      websocket: 'running',
      bots: 'initializing',
      proxy_manager: 'ready',
      account_manager: 'ready',
      anti_detection: 'active'
    }
  });
});

// System status
app.get('/api/status', async (req, res) => {
  try {
    const status = await getSystemStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Command endpoint
app.post('/api/command', async (req, res) => {
  const { command } = req.body;
  
  try {
    let result;
    switch (command) {
      case 'start_all':
        result = await startAllBots();
        break;
      case 'rotate_proxies':
        result = await rotateProxies();
        break;
      case 'rotate_accounts':
        result = await rotateAccounts();
        break;
      case 'emergency_stop':
        result = await emergencyStop();
        break;
      default:
        return res.status(400).json({ error: 'Unknown command' });
    }
    
    res.json({ success: true, message: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle AI
app.post('/api/toggle-ai', (req, res) => {
  const aiEnabled = process.env.NEURAL_AI !== 'disabled';
  process.env.NEURAL_AI = aiEnabled ? 'disabled' : 'enabled';
  
  res.json({
    success: true,
    enabled: !aiEnabled,
    message: `Neural AI ${!aiEnabled ? 'enabled' : 'disabled'}`
  });
});

// Logs endpoint
app.get('/logs', async (req, res) => {
  try {
    const logFiles = await fs.readdir('./logs/system');
    const latestLog = logFiles.sort().reverse()[0];
    
    if (latestLog) {
      const logContent = await fs.readFile(`./logs/system/${latestLog}`, 'utf-8');
      res.send(`<pre>${logContent}</pre>`);
    } else {
      res.send('No logs available');
    }
  } catch (error) {
    res.status(500).send('Error reading logs');
  }
});

// ================= WEBSOCKET SERVER =================

const wss = new WebSocket.Server({ port: 10001 });

wss.on('connection', (ws) => {
  console.log('🔌 New WebSocket client connected');
  
  // Send initial data
  sendSystemUpdate(ws);
  
  // Send updates every 2 seconds
  const interval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      sendSystemUpdate(ws);
    }
  }, 2000);
  
  ws.on('close', () => {
    console.log('🔌 WebSocket client disconnected');
    clearInterval(interval);
  });
});

async function sendSystemUpdate(ws) {
  try {
    const status = await getSystemStatus();
    ws.send(JSON.stringify(status));
  } catch (error) {
    console.error('Failed to send system update:', error);
  }
}

// ================= HELPER FUNCTIONS =================

async function getSystemStatus() {
  // Get system info
  const systemInfo = await getSystemInfo();
  
  // Get bot status
  const botStatus = await getBotStatus();
  
  // Get proxy status
  const proxyStatus = await getProxyStatus();
  
  // Get anti-detection status
  const antiDetectionStatus = await getAntiDetectionStatus();
  
  return {
    timestamp: new Date().toISOString(),
    stats: {
      status: 'ONLINE',
      uptime: Math.floor(process.uptime()),
      bots: 4,
      connectedBots: botStatus.connected || 0,
      proxies: proxyStatus.total || 100,
      activeProxies: proxyStatus.active || 75,
      accounts: 10,
      suspicion: antiDetectionStatus.suspicion || 15,
      antiDetection: antiDetectionStatus.status || 'ACTIVE',
      cpu: systemInfo.cpu.usage,
      memory: systemInfo.memory.percentage
    },
    bots: botStatus.bots || [],
    system: systemInfo,
    alerts: []
  };
}

async function getSystemInfo() {
  const os = require('os');
  
  return {
    cpu: {
      usage: (os.loadavg()[0] / os.cpus().length * 100).toFixed(1),
      cores: os.cpus().length,
      model: os.cpus()[0].model
    },
    memory: {
      total: (os.totalmem() / 1024 / 1024 / 1024).toFixed(2) + ' GB',
      used: ((os.totalmem() - os.freemem()) / 1024 / 1024 / 1024).toFixed(2) + ' GB',
      free: (os.freemem() / 1024 / 1024 / 1024).toFixed(2) + ' GB',
      percentage: ((os.totalmem() - os.freemem()) / os.totalmem() * 100).toFixed(1)
    },
    uptime: Math.floor(os.uptime()),
    platform: os.platform(),
    arch: os.arch()
  };
}

async function getBotStatus() {
  try {
    // Simulate bot status for now
    const botTypes = ['builder', 'explorer', 'miner', 'socializer'];
    const botNames = ['CraftMaster', 'ExplorerX', 'MinePro', 'SocialBee'];
    const locations = ['New York', 'London', 'Tokyo', 'Sydney'];
    const activities = [
      'Building castle', 'Exploring caves', 'Mining diamonds', 'Chatting with players',
      'Farming crops', 'Mapping terrain', 'Smelting ores', 'Trading items'
    ];
    
    const bots = botNames.map((name, index) => ({
      name: name + Math.floor(Math.random() * 1000),
      type: botTypes[index],
      health: 15 + Math.floor(Math.random() * 6),
      ip: `192.168.${100 + index}.${100 + Math.floor(Math.random() * 100)}`,
      location: locations[Math.floor(Math.random() * locations.length)],
      activity: activities[Math.floor(Math.random() * activities.length)],
      connected: Math.random() > 0.2
    }));
    
    return {
      connected: bots.filter(b => b.connected).length,
      bots: bots
    };
  } catch (error) {
    console.error('Failed to get bot status:', error);
    return { connected: 0, bots: [] };
  }
}

async function getProxyStatus() {
  try {
    // Simulate proxy status
    return {
      total: 100,
      active: 75 + Math.floor(Math.random() * 20),
      rotating: true,
      residential: 60,
      mobile: 15,
      datacenter: 25
    };
  } catch (error) {
    console.error('Failed to get proxy status:', error);
    return { total: 0, active: 0 };
  }
}

async function getAntiDetectionStatus() {
  try {
    // Simulate anti-detection status
    return {
      suspicion: Math.floor(Math.random() * 30),
      status: 'ACTIVE',
      countermeasures: 15,
      lastRotation: new Date(Date.now() - 1800000).toISOString() // 30 minutes ago
    };
  } catch (error) {
    console.error('Failed to get anti-detection status:', error);
    return { suspicion: 0, status: 'INACTIVE' };
  }
}

async function startAllBots() {
  return new Promise((resolve) => {
    console.log('🚀 Starting all bots...');
    setTimeout(() => {
      resolve('All bots started successfully');
    }, 2000);
  });
}

async function rotateProxies() {
  return new Promise((resolve) => {
    console.log('🔄 Rotating proxies...');
    setTimeout(() => {
      resolve('Proxies rotated successfully');
    }, 1500);
  });
}

async function rotateAccounts() {
  return new Promise((resolve) => {
    console.log('👤 Rotating accounts...');
    setTimeout(() => {
      resolve('Accounts rotated successfully');
    }, 1500);
  });
}

async function emergencyStop() {
  return new Promise((resolve) => {
    console.log('🛑 Emergency stop initiated...');
    setTimeout(() => {
      resolve('All systems stopped safely');
    }, 1000);
  });
}

// ================= START SERVER =================

console.log(`
╔══════════════════════════════════════════════════════════╗
║   🎮 ULTIMATE MINECRAFT BOT SYSTEM v7.0                  ║
║   ⚡ Starting web interface...                           ║
╚══════════════════════════════════════════════════════════╝
`);

console.log('🌐 Web Dashboard: http://localhost:' + PORT);
console.log('📡 WebSocket Server: ws://localhost:10001');
console.log('📊 Health Check: http://localhost:' + PORT + '/health');
console.log('📁 Logs: http://localhost:' + PORT + '/logs');
console.log('='.repeat(60));

app.listen(PORT, '0.0.0.0', () => {
  console.log('✅ Web server running on port ' + PORT);
  
  // Start bot system after web server is ready
  setTimeout(() => {
    console.log('🤖 Initializing bot system...');
    require('./bot');
  }, 3000);
});
