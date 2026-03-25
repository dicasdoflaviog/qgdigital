#!/usr/bin/env node
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { glob } from 'glob';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function analyzeCodeFiles() {
  const srcPath = path.join(__dirname, '..', 'src');
  const files = await glob('**/*.{ts,tsx}', { cwd: srcPath });

  const issues = [];
  const summary = { critico: 0, importante: 0, menor: 0 };

  // Simple analysis patterns
  const patterns = [
    {
      name: 'Hardcoded secrets',
      regex: /(['"])(?:senha|token|secret|api[_-]?key|authorization)\1\s*[:=]/gi,
      severity: 'critico'
    },
    {
      name: 'console.log',
      regex: /console\.(log|warn|debug)\(/g,
      severity: 'importante'
    },
    {
      name: 'Type any',
      regex: /:\s*any\b/g,
      severity: 'importante'
    }
  ];

  for (const file of files) {
    try {
      const fullPath = path.join(srcPath, file);
      const content = fs.readFileSync(fullPath, 'utf-8');
      const lines = content.split('\n');

      patterns.forEach(pattern => {
        let match;
        while ((match = pattern.regex.exec(content))) {
          const line = content.substring(0, match.index).split('\n').length;
          issues.push({
            severity: pattern.severity,
            message: pattern.name,
            file,
            line
          });
          summary[pattern.severity]++;
        }
      });

      // Check file size
      if (lines.length > 400) {
        issues.push({
          severity: 'menor',
          message: `Large file (${lines.length} lines)`,
          file,
          line: 1
        });
        summary.menor++;
      }
    } catch (err) {
      // Skip files that can't be read
    }
  }

  return { issues, summary, filesScanned: files.length };
}

async function main() {
  console.log('\n🔍 QG Digital - Code Quality Audit');
  console.log('='.repeat(70));
  console.log('');

  console.log('📊 Analyzing TypeScript files...\n');
  const result = await analyzeCodeFiles();

  console.log('📈 AUDIT RESULTS');
  console.log('='.repeat(70));
  console.log(`📁 Files scanned:  ${result.filesScanned}`);
  console.log(`🔴 Critical:       ${result.summary.critico}`);
  console.log(`🟠 Important:      ${result.summary.importante}`);
  console.log(`🟡 Minor:          ${result.summary.menor}`);
  console.log(`📊 Total issues:   ${result.issues.length}`);
  console.log('');

  // Show top issues
  const topIssues = result.issues.slice(0, 20);
  if (topIssues.length > 0) {
    console.log('📋 Top Issues Found:');
    console.log('-'.repeat(70));
    topIssues.forEach((issue, idx) => {
      const icon = issue.severity === 'critico' ? '🔴' : issue.severity === 'importante' ? '🟠' : '🟡';
      console.log(`${String(idx + 1).padStart(2)}. ${icon} [${issue.severity.toUpperCase()}] ${issue.file}:${issue.line}`);
      console.log(`    ${issue.message}`);
    });
    console.log('');
  } else {
    console.log('✅ No issues found!\n');
  }

  // Save reports
  const timestamp = new Date().toISOString().split('T')[0];
  const reportsDir = path.join(__dirname, 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const report = {
    timestamp: new Date().toISOString(),
    filesScanned: result.filesScanned,
    issues: result.issues,
    summary: result.summary
  };

  const jsonFile = path.join(reportsDir, `audit-${timestamp}.json`);
  fs.writeFileSync(jsonFile, JSON.stringify(report, null, 2));

  let markdown = `# 📊 Code Quality Audit Report\n\n`;
  markdown += `**Generated:** ${new Date().toLocaleString()}\n`;
  markdown += `**Files Scanned:** ${result.filesScanned}\n\n`;
  markdown += `## Summary\n\n`;
  markdown += `| Severity | Count |\n|----------|-------|\n`;
  markdown += `| 🔴 Critical | ${result.summary.critico} |\n`;
  markdown += `| 🟠 Important | ${result.summary.importante} |\n`;
  markdown += `| 🟡 Minor | ${result.summary.menor} |\n\n`;

  if (topIssues.length > 0) {
    markdown += `## Issues\n\n`;
    topIssues.forEach((issue, idx) => {
      markdown += `${idx + 1}. **${issue.file}:${issue.line}** - ${issue.severity}\n`;
      markdown += `   ${issue.message}\n\n`;
    });
  }

  const mdFile = path.join(reportsDir, `audit-${timestamp}.md`);
  fs.writeFileSync(mdFile, markdown);

  console.log(`📄 Saved: ${jsonFile}`);
  console.log(`📄 Saved: ${mdFile}`);
  console.log('');

  // Try to save to Supabase
  try {
    const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;
    if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
      console.log('💾 Saving to Supabase...');
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

      const { error } = await supabase.from('auditorias').insert({
        tipo: 'code_quality',
        issues: result.issues.slice(0, 100),
        stats: result.summary,
        markdown
      });

      if (!error) {
        console.log('✅ Audit report saved to Supabase (auditorias table)\n');
      } else {
        console.log(`⚠️  Supabase save error: ${error.message}\n`);
      }
    } else {
      console.log('⚠️  Supabase credentials not found\n');
    }
  } catch (err) {
    console.log('⚠️  Could not connect to Supabase (offline mode)\n');
  }

  console.log('✅ Audit completed successfully\n');
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
