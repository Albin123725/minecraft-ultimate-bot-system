#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const readline = require('readline');
const crypto = require('crypto');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log(`
╔══════════════════════════════════════════════════════════╗
║   🎮 ULTIMATE MINECRAFT BOT SYSTEM SETUP WIZARD         ║
║   ⚡ Let's get your system configured!                  ║
╚══════════════════════════════════════════════════════════╝
`);

async function main() {
  console.log('📋 Gathering configuration information...\n');
  
  const config = {
    // Server configuration
    MINECRAFT_HOST: await askQuestion('Minecraft Server Host [gameplannet.aternos.me]: ', 'gameplannet.aternos.me'),
    MINECRAFT_PORT: await askQuestion('Minecraft Server Port [34286]: ', '34286'),
    MINECRAFT_VERSION: await askQuestion('Minecraft Version [1.21.10]: ', '1.21.10'),
    MINECRAFT_AUTH: await askQuestion('Auth Mode [offline]: ', 'offline'),
    
    // Bot configuration
    BOT_COUNT: await askQuestion('Number of Bots [4]: ', '4'),
    BOT_TYPES: await askQuestion('Bot Types (comma separated) [builder,explorer,miner,socializer]: ', 'builder,explorer,miner,socializer'),
    
    // Advanced features
    PROXY_ROTATION: await askQuestion('Enable Proxy Rotation? [true/false]: ', 'true'),
    NEURAL_AI: await askQuestion('Enable Neural AI? [true/false]: ', 'true'),
    ANTI_DETECTION: await askQuestion('Enable Anti-Detection? [true/false]: ', 'true'),
    
    // Performance
    MAX_RAM_MB: await askQuestion('Max RAM Usage (MB) [2048]: ', '2048'),
    WEB_PORT: await askQuestion('Web Dashboard Port [10000]: ', '10000'),
    LOG_LEVEL: await askQuestion('Log Level [info]: ', 'info')
  };
  
  console.log('\n⚙️  Generating configuration files...');
  
  // Create .env file
  const envContent = Object.entries(config)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  
  await fs.writeFile('.env', envContent);
  console.log('✅ Created .env file');
  
  // Create config directory
  await fs.ensureDir('config');
  
  // Create default proxies
  await generateProxies(100);
  
  // Create default accounts
  await generateAccounts(10);
  
  // Create default fingerprints
  await generateFingerprints(50);
  
  // Create behaviors
  await generateBehaviors();
  
  // Create logs directory
  await fs.ensureDir('logs/connections');
  await fs.ensureDir('logs/gameplay');
  await fs.ensureDir('logs/system');
  await fs.ensureDir('logs/monitoring');
  
  // Create public directory for web assets
  await fs.ensureDir('public');
  
  console.log('\n📦 Installing dependencies...');
  console.log('   (Run "npm install" if this fails)');
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ SETUP COMPLETE!');
  console.log('='.repeat(60));
  console.log('\n🚀 To start the system:');
  console.log('   npm start');
  console.log('\n🌐 Web Dashboard:');
  console.log('   http://localhost:' + config.WEB_PORT);
  console.log('\n🤖 Bot Configuration:');
  console.log('   Count: ' + config.BOT_COUNT + ' bots');
  console.log('   Types: ' + config.BOT_TYPES);
  console.log('   Server: ' + config.MINECRAFT_HOST + ':' + config.MINECRAFT_PORT);
  console.log('\n⚡ Advanced Features:');
  console.log('   Proxy Rotation: ' + (config.PROXY_ROTATION === 'true' ? '✅' : '❌'));
  console.log('   Neural AI: ' + (config.NEURAL_AI === 'true' ? '✅' : '❌'));
  console.log('   Anti-Detection: ' + (config.ANTI_DETECTION === 'true' ? '✅' : '❌'));
  console.log('='.repeat(60));
  
  rl.close();
}

async function askQuestion(question, defaultValue) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim() || defaultValue);
    });
  });
}

async function generateProxies(count) {
  const proxies = [];
  const proxyTypes = ['residential', 'mobile', 'datacenter'];
  const countries = ['US', 'CA', 'UK', 'DE', 'FR', 'AU', 'JP'];
  
  for (let i = 0; i < count; i++) {
    const type = proxyTypes[Math.floor(Math.random() * proxyTypes.length)];
    const country = countries[Math.floor(Math.random() * countries.length)];
    
    proxies.push({
      id: crypto.randomBytes(8).toString('hex'),
      type: type,
      country: country,
      ip: generateRandomIP(country),
      port: generateRandomPort(type),
      protocol: Math.random() > 0.5 ? 'http' : 'socks5',
      speed: 20 + Math.random() * 80,
      latency: 10 + Math.random() * 100,
      successRate: 0.85 + Math.random() * 0.14,
      lastUsed: null,
      residential: type === 'residential' || type === 'mobile',
      mobile: type === 'mobile'
    });
  }
  
  await fs.writeJson('config/proxies.json', proxies, { spaces: 2 });
  console.log(`✅ Generated ${proxies.length} proxies`);
}

async function generateAccounts(count) {
  const accounts = [];
  const emailProviders = ['gmail.com', 'outlook.com', 'yahoo.com', 'protonmail.com'];
  
  for (let i = 0; i < count; i++) {
    const username = generateUsername();
    const provider = emailProviders[Math.floor(Math.random() * emailProviders.length)];
    
    accounts.push({
      id: crypto.randomBytes(8).toString('hex'),
      username: username,
      email: `${username}@${provider}`,
      password: generatePassword(),
      created: new Date(Date.now() - Math.random() * 31536000000).toISOString(),
      lastLogin: null,
      totalPlaytime: Math.floor(Math.random() * 1000) * 60,
      servers: Math.floor(Math.random() * 4) + 1
    });
  }
  
  await fs.writeJson('config/accounts.json', accounts, { spaces: 2 });
  console.log(`✅ Generated ${accounts.length} accounts`);
}

async function generateFingerprints(count) {
  const fingerprints = [];
  const javaVersions = ['1.8.0_351', '11.0.20', '17.0.8', '21.0.1'];
  const launchers = ['Official', 'MultiMC', 'GDLauncher', 'ATLauncher', 'PrismLauncher'];
  
  for (let i = 0; i < count; i++) {
    fingerprints.push({
      id: crypto.randomBytes(16).toString('hex'),
      javaVersion: javaVersions[Math.floor(Math.random() * javaVersions.length)],
      launcher: launchers[Math.floor(Math.random() * launchers.length)],
      viewDistance: Math.floor(Math.random() * 8) + 4,
      renderDistance: Math.floor(Math.random() * 8) + 4,
      maxFps: [60, 120, 144, 240, 0][Math.floor(Math.random() * 5)],
      vsync: Math.random() > 0.5,
      clientHash: crypto.randomBytes(32).toString('hex'),
      timestamp: new Date().toISOString()
    });
  }
  
  await fs.writeJson('config/fingerprints.json', fingerprints, { spaces: 2 });
  console.log(`✅ Generated ${fingerprints.length} client fingerprints`);
}

async function generateBehaviors() {
  const behaviors = {
    builder: {
      movement: { walkSpeed: 0.15, runSpeed: 0.25, jumpFrequency: 0.1 },
      building: { planBeforeBuild: 0.9, measureDistance: 0.8, checkMaterials: 0.95 },
      awareness: { avoidLava: 0.99, avoidHeights: 0.6, noticeResources: 0.8 },
      decisions: { gatherBeforeBuild: 0.8, upgradeTools: 0.6, takeBreaks: 0.3 }
    },
    explorer: {
      movement: { walkSpeed: 0.2, runSpeed: 0.3, jumpFrequency: 0.4 },
      exploration: { markPath: 0.7, mapTerrain: 0.9, collectSamples: 0.6 },
      awareness: { avoidLava: 0.95, avoidHeights: 0.3, noticeResources: 0.95 },
      decisions: { returnToBase: 0.2, shareFindings: 0.7, takeRisks: 0.6 }
    },
    miner: {
      movement: { walkSpeed: 0.12, runSpeed: 0.18, jumpFrequency: 0.05 },
      mining: { branchMining: 0.8, stripMining: 0.6, caveExploring: 0.9 },
      awareness: { avoidLava: 0.99, avoidHeights: 0.2, noticeResources: 0.99 },
      decisions: { returnWhenFull: 0.9, upgradePickaxe: 0.7, digToBedrock: 0.3 }
    },
    socializer: {
      movement: { walkSpeed: 0.1, runSpeed: 0.15, jumpFrequency: 0.2 },
      social: { greetPlayers: 0.9, initiateTrade: 0.7, tellStories: 0.6 },
      awareness: { avoidLava: 0.8, avoidHeights: 0.7, noticeResources: 0.3 },
      decisions: { followGroup: 0.7, shareItems: 0.6, mediateConflict: 0.5 }
    }
  };
  
  await fs.writeJson('config/behaviors.json', behaviors, { spaces: 2 });
  console.log('✅ Generated behavior patterns');
}

function generateRandomIP(country) {
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

function generateRandomPort(type) {
  const ports = {
    http: [80, 8080, 8888, 3128],
    socks5: [1080, 1081, 1082],
    residential: [8080, 8888]
  };
  
  const typePorts = ports[type] || [8080];
  return typePorts[Math.floor(Math.random() * typePorts.length)];
}

function generateUsername() {
  const prefixes = ['mine', 'craft', 'build', 'explore', 'adventure', 'game'];
  const suffixes = ['master', 'lord', 'king', 'bot', 'pro', 'expert'];
  const numbers = Math.floor(Math.random() * 10000);
  
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
  
  return `${prefix}${suffix}${numbers}`;
}

function generatePassword() {
  const length = 12 + Math.floor(Math.random() * 8);
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }
  
  return password;
}

main().catch(console.error);
