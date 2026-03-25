import { glob } from 'glob';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function checkSecrets(content) {
  const secrets = [];
  const patterns = [
    { regex: /api[_-]?key\s*[=:]\s*['"](.*?)['"]/gi, name: 'API Key' },
    { regex: /password\s*[=:]\s*['"](.*?)['"]/gi, name: 'Password' },
    { regex: /token\s*[=:]\s*['"](.*?)['"]/gi, name: 'Token' },
  ];
  
  patterns.forEach(p => {
    let match;
    while ((match = p.regex.exec(content))) {
      secrets.push({ name: p.name, line: content.substring(0, match.index).split('\n').length });
    }
  });
  return secrets;
}

function checkConsoleLog(content) {
  const lines = content.split('\n');
  const issues = [];
  lines.forEach((line, idx) => {
    if (/console\.(log|error|warn|info)/.test(line)) {
      issues.push({ line: idx + 1, type: 'console.log' });
    }
  });
  return issues;
}

async function runDemo() {
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║        🤖 QG Digital Agents System - DEMO MODE            ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('');

  const srcDir = path.join(__dirname, '..', 'src');
  const files = await glob('**/*.{ts,tsx}', { cwd: srcDir });
  
  console.log(`📊 AUDIT AGENT - Code Quality Scan`);
  console.log(`─`.repeat(60));
  console.log(`   Scanning ${files.length} TypeScript files...`);
  console.log('');

  let totalSecrets = 0;
  let totalConsole = 0;

  const sampleFiles = files.slice(0, 5);
  for (const file of sampleFiles) {
    const filepath = path.join(srcDir, file);
    const content = fs.readFileSync(filepath, 'utf-8');
    
    const secrets = checkSecrets(content);
    const consoles = checkConsoleLog(content);
    
    if (secrets.length > 0) {
      console.log(`🔴 ${file}`);
      console.log(`   Found ${secrets.length} potential secrets`);
      totalSecrets += secrets.length;
    }
    
    if (consoles.length > 0) {
      console.log(`🟠 ${file}`);
      console.log(`   Found ${consoles.length} console.log statements`);
      totalConsole += consoles.length;
    }
  }

  console.log('');
  console.log('📈 AUDIT SUMMARY');
  console.log(`─`.repeat(60));
  console.log(`   Files scanned:        ${sampleFiles.length}`);
  console.log(`   Secrets found:        ${totalSecrets}`);
  console.log(`   Console.log found:    ${totalConsole}`);
  console.log('');

  console.log('✅ Audit completed - Demo Mode');
  console.log('');
  console.log('🔧 PRODUCTION MODE');
  console.log(`─`.repeat(60));
  console.log('To run agents with Supabase integration:');
  console.log('');
  console.log('1. Add environment variables:');
  console.log('   SUPABASE_URL=your-url');
  console.log('   SUPABASE_SERVICE_KEY=your-key');
  console.log('   ANTHROPIC_API_KEY=your-key');
  console.log('');
  console.log('2. Run agents:');
  console.log('   npm run audit');
  console.log('   npm run suggestions');
  console.log('   npm run errors');
  console.log('');
  console.log('💾 Reports will be saved to: scripts/reports/');
  console.log('');
}

runDemo().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
