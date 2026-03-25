import 'dotenv/config';
import { glob } from 'glob';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { analyzeCode } from '../utils/code-analyzer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface AuditIssue {
  severity: 'critico' | 'importante' | 'menor';
  message: string;
  file: string;
  line: number;
}

interface AuditReport {
  timestamp: string;
  filesScanned: number;
  issues: AuditIssue[];
  summary: {
    critico: number;
    importante: number;
    menor: number;
  };
}

async function runAudit(): Promise<void> {
  console.log('\n🔍 QG Digital - Code Quality Audit');
  console.log('='.repeat(60));
  console.log('');

  const srcDir = path.join(__dirname, '..', '..', 'src');
  const files = await glob('**/*.{ts,tsx}', { cwd: srcDir });

  console.log(`📊 Scanning ${files.length} TypeScript files...`);
  console.log('');

  const report: AuditReport = {
    timestamp: new Date().toISOString(),
    filesScanned: files.length,
    issues: [],
    summary: { critico: 0, importante: 0, menor: 0 }
  };

  // Analyze files
  for (const file of files) {
    try {
      const filepath = path.join(srcDir, file);
      const content = fs.readFileSync(filepath, 'utf-8');
      const analysis = analyzeCode(content, file);

      analysis.issues.forEach(issue => {
        report.issues.push({
          severity: issue.severity,
          message: issue.message,
          file: issue.file,
          line: issue.line
        });
        report.summary[issue.severity]++;
      });
    } catch (err) {
      // Skip files that can't be read
    }
  }

  // Print summary
  console.log('📈 AUDIT RESULTS');
  console.log('='.repeat(60));
  console.log(`🔴 Critical:  ${report.summary.critico}`);
  console.log(`🟠 Important: ${report.summary.importante}`);
  console.log(`🟡 Minor:     ${report.summary.menor}`);
  console.log(`📊 Total:     ${report.issues.length}`);
  console.log('');

  // Show top issues
  const topIssues = report.issues.slice(0, 15);
  if (topIssues.length > 0) {
    console.log('Top Issues Found:');
    console.log('-'.repeat(60));
    topIssues.forEach((issue, idx) => {
      const icon = issue.severity === 'critico' ? '🔴' : issue.severity === 'importante' ? '🟠' : '🟡';
      console.log(`${String(idx + 1).padStart(2)}. ${icon} [${issue.severity.toUpperCase()}] ${issue.file}`);
      console.log(`    Line ${issue.line}: ${issue.message}`);
    });
    console.log('');
  }

  // Save JSON report
  const timestamp = new Date().toISOString().split('T')[0];
  const reportsDir = path.join(__dirname, '..', 'reports');
  
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const jsonFile = path.join(reportsDir, `audit-${timestamp}.json`);
  fs.writeFileSync(jsonFile, JSON.stringify(report, null, 2));

  // Save Markdown report
  let markdown = `# 📊 Code Quality Audit Report\n\n`;
  markdown += `**Date:** ${new Date().toLocaleString()}\n`;
  markdown += `**Files Scanned:** ${report.filesScanned}\n\n`;
  markdown += `## Summary\n\n`;
  markdown += `| Severity | Count |\n`;
  markdown += `|----------|-------|\n`;
  markdown += `| 🔴 Critical | ${report.summary.critico} |\n`;
  markdown += `| 🟠 Important | ${report.summary.importante} |\n`;
  markdown += `| 🟡 Minor | ${report.summary.menor} |\n\n`;

  if (topIssues.length > 0) {
    markdown += `## Top Issues\n\n`;
    topIssues.forEach((issue, idx) => {
      markdown += `${idx + 1}. **${issue.file}:${issue.line}** (${issue.severity})\n`;
      markdown += `   - ${issue.message}\n\n`;
    });
  }

  const mdFile = path.join(reportsDir, `audit-${timestamp}.md`);
  fs.writeFileSync(mdFile, markdown);

  console.log(`✅ JSON Report: ${jsonFile}`);
  console.log(`✅ Markdown:    ${mdFile}`);
  console.log('');

  // Try to save to Supabase
  try {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

    if (SUPABASE_URL && SERVICE_KEY) {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

      const { error } = await supabase
        .from('auditorias')
        .insert({
          tipo: 'code_quality',
          issues: report.issues.slice(0, 100), // Limit to 100
          stats: report.summary,
          markdown: markdown
        });

      if (error) {
        console.warn(`⚠️  Supabase save failed: ${error.message}`);
      } else {
        console.log('✅ Report saved to Supabase (auditorias table)');
      }
    }
  } catch (err) {
    console.warn('⚠️  Supabase integration unavailable (continuing offline)');
  }

  console.log('\n✅ Audit completed successfully\n');
}

runAudit().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
