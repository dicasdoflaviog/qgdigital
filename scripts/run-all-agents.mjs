#!/usr/bin/env node
import 'dotenv/config';
import { execSync } from 'child_process';

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║         🤖 QG Digital - Running All Agents               ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

const agents = [
  { name: 'Audit Agent', cmd: 'node scripts/run-audit.mjs' },
  // Suggestions and Errors need tables first
];

for (const agent of agents) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Running: ${agent.name}`);
  console.log('='.repeat(60));
  try {
    execSync(agent.cmd, { stdio: 'inherit' });
  } catch (err) {
    console.error(`❌ ${agent.name} failed`);
  }
}

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║                     ✅ All agents completed               ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');
