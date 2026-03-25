import { glob } from 'glob';
import * as fs from 'fs';
import * as path from 'path';
import { analyzeCode } from '../utils/code-analyzer.js';

async function runAuditDemo() {
  console.log('🔍 QG Digital - Code Quality Audit (DEMO MODE)');
  console.log('=' .repeat(60));
  console.log('');

  const srcDir = path.join(process.cwd(), '..', 'src');
  const files = await glob('**/*.{ts,tsx}', { cwd: srcDir });
  
  console.log(`📊 Scanning ${files.length} TypeScript files...`);
  console.log('');

  let totalIssues = 0;
  let criticalCount = 0;
  let importantCount = 0;

  for (const file of files.slice(0, 10)) {
    const filepath = path.join(srcDir, file);
    const content = fs.readFileSync(filepath, 'utf-8');
    const report = analyzeCode(content, file);

    if (report.issues.length > 0) {
      console.log(`📄 ${file}`);
      report.issues.forEach(issue => {
        const icon = issue.severity === 'critico' ? '🔴' : issue.severity === 'importante' ? '🟠' : '🟡';
        console.log(`  ${icon} ${issue.severity}: ${issue.message} (line ${issue.line})`);
        totalIssues++;
        if (issue.severity === 'critico') criticalCount++;
        else if (issue.severity === 'importante') importantCount++;
      });
    }
  }

  console.log('');
  console.log('=' .repeat(60));
  console.log(`📈 SUMMARY:`);
  console.log(`   Critical: ${criticalCount}`);
  console.log(`   Important: ${importantCount}`);
  console.log(`   Total Issues: ${totalIssues}`);
  console.log('');
  console.log('✅ Audit completed successfully');
}

runAuditDemo().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
