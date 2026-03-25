import { supabase } from '../utils/supabase-client.js';
import { analyzeWithAI, isAIAvailable } from '../utils/ai-client.js';
import { analyzeCode } from '../utils/code-analyzer.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPORT_DIR = path.resolve(__dirname, '../reports');

async function auditCode() {
  return analyzeCode();
}

function generateMarkdownReport(report: any): string {
  let md = `# 📊 Relatório de Auditoria de Código\n\n`;
  md += `**Data:** ${new Date().toLocaleString('pt-BR')}\n\n`;
  md += `## Resumo\n\n`;
  md += `- 🔴 **Problemas Críticos:** ${report.summary.criticos}\n`;
  md += `- 🟡 **Problemas Importantes:** ${report.summary.importantes}\n`;
  md += `- 🟢 **Problemas Menores:** ${report.summary.menores}\n`;
  md += `- 📁 **Total:** ${report.summary.total}\n\n`;

  if (report.summary.criticos > 0) {
    md += `## 🔴 Problemas Críticos\n\n`;
    report.issues
      .filter((issue: any) => issue.tipo === 'critico')
      .forEach((issue: any, idx: number) => {
        md += `### ${idx + 1}. ${issue.categoria} - ${issue.arquivo}\n`;
        md += `- **Linha:** ${issue.linha || 'N/A'}\n`;
        md += `- **Problema:** ${issue.descricao}\n`;
        if (issue.codigo) md += `- **Código:** \`${issue.codigo}\`\n`;
        md += `- **Sugestão:** ${issue.sugestao}\n\n`;
      });
  }

  if (report.summary.importantes > 0) {
    md += `## 🟡 Problemas Importantes\n\n`;
    report.issues
      .filter((issue: any) => issue.tipo === 'importante')
      .forEach((issue: any, idx: number) => {
        md += `### ${idx + 1}. ${issue.categoria} - ${issue.arquivo}\n`;
        md += `- **Linha:** ${issue.linha || 'N/A'}\n`;
        md += `- **Problema:** ${issue.descricao}\n`;
        if (issue.codigo) md += `- **Código:** \`${issue.codigo}\`\n`;
        md += `- **Sugestão:** ${issue.sugestao}\n\n`;
      });
  }

  if (report.summary.menores > 0) {
    md += `## 🟢 Problemas Menores\n\n`;
    report.issues
      .filter((issue: any) => issue.tipo === 'menor')
      .forEach((issue: any, idx: number) => {
        md += `${idx + 1}. **${issue.arquivo}:${issue.linha}** - ${issue.descricao}\n`;
      });
  }

  return md;
}

async function main() {
  try {
    console.log('\n' + '='.repeat(50));
    console.log('🔍 INICIANDO AUDITORIA DE CÓDIGO');
    console.log('='.repeat(50) + '\n');

    const report = await auditCode();
    
    // Criar diretório de reports se não existir
    if (!fs.existsSync(REPORT_DIR)) {
      fs.mkdirSync(REPORT_DIR, { recursive: true });
    }

    // Salvar JSON
    const jsonPath = path.join(REPORT_DIR, `audit-${Date.now()}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));

    // Salvar Markdown
    const mdPath = path.join(REPORT_DIR, `audit-${Date.now()}.md`);
    const markdown = generateMarkdownReport(report);
    fs.writeFileSync(mdPath, markdown);

    // Salvar no Supabase
    try {
      await supabase.from('auditorias').insert({
        tipo: 'code_audit',
        resultado: report,
        problemas_criticos: report.summary.criticos,
        problemas_importantes: report.summary.importantes,
        problemas_menores: report.summary.menores,
      });
      console.log('✅ Auditoria salva no Supabase\n');
    } catch (dbError) {
      console.warn('⚠️ Erro ao salvar no Supabase (continuando):', dbError);
    }

    // Exibir resumo
    console.log('='.repeat(50));
    console.log('📊 RESUMO DA AUDITORIA');
    console.log('='.repeat(50));
    console.log(`🔴 Críticos: ${report.summary.criticos}`);
    console.log(`🟡 Importantes: ${report.summary.importantes}`);
    console.log(`🟢 Menores: ${report.summary.menores}`);
    console.log(`📁 Total: ${report.summary.total}`);
    console.log('='.repeat(50));
    console.log(`\n✅ Relatório salvo em:\n   ${mdPath}\n`);

  } catch (error) {
    console.error('❌ Erro na auditoria:', error);
    process.exit(1);
  }
}

main();
