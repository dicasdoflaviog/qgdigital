import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

export interface CodeIssue {
  tipo: 'critico' | 'importante' | 'menor';
  categoria: string;
  arquivo: string;
  linha?: number;
  descricao: string;
  codigo?: string;
  sugestao: string;
}

export interface AuditReport {
  summary: {
    criticos: number;
    importantes: number;
    menores: number;
    total: number;
  };
  issues: CodeIssue[];
}

const CHECKS = {
  hardcodedStrings: /(['"])(?:senha|token|secret|api[_-]?key|authorization)\1\s*[:=]/gi,
  consoleLogs: /console\.(log|warn|error|debug)\(/g,
  anyType: /:\s*any\b/g,
  noErrorHandling: /await\s+\w+\(/g,
  largeFiles: 0,
};

export async function analyzeCode(): Promise<AuditReport> {
  const srcPath = path.resolve(__dirname, '../../src');
  const files = await glob('**/*.{ts,tsx,js,jsx}', { cwd: srcPath });

  const issues: CodeIssue[] = [];

  for (const file of files) {
    const fullPath = path.join(srcPath, file);
    try {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const lines = content.split('\n');

      // Check 1: Hardcoded secrets
      const secretMatches = content.matchAll(CHECKS.hardcodedStrings);
      for (const match of secretMatches) {
        const line = content.slice(0, match.index).split('\n').length;
        issues.push({
          tipo: 'critico',
          categoria: 'Segurança',
          arquivo: file,
          linha: line,
          descricao: 'Possível secret ou token hardcoded',
          codigo: match[0],
          sugestao: 'Mover para variáveis de ambiente (.env)',
        });
      }

      // Check 2: Console.log em produção
      const consoleMatches = content.matchAll(CHECKS.consoleLogs);
      for (const match of consoleMatches) {
        const line = content.slice(0, match.index).split('\n').length;
        issues.push({
          tipo: 'importante',
          categoria: 'Performance',
          arquivo: file,
          linha: line,
          descricao: 'console.log desnecessário encontrado',
          sugestao: 'Remover ou usar logger estruturado',
        });
      }

      // Check 3: Type 'any' usage
      const anyMatches = content.matchAll(CHECKS.anyType);
      for (const match of anyMatches) {
        const line = content.slice(0, match.index).split('\n').length;
        issues.push({
          tipo: 'importante',
          categoria: 'TypeScript',
          arquivo: file,
          linha: line,
          descricao: 'Uso de "any" type reduz type safety',
          sugestao: 'Definir tipo específico ou usar unknown com type guard',
        });
      }

      // Check 4: Large files
      if (lines.length > 400) {
        issues.push({
          tipo: 'importante',
          categoria: 'Complexidade',
          arquivo: file,
          descricao: `Arquivo muito grande (${lines.length} linhas)`,
          sugestao: 'Dividir em componentes menores e reutilizáveis',
        });
      }
    } catch (error) {
      console.error(`Erro ao ler ${file}:`, error);
    }
  }

  // Calcular resumo
  const summary = {
    criticos: issues.filter(i => i.tipo === 'critico').length,
    importantes: issues.filter(i => i.tipo === 'importante').length,
    menores: issues.filter(i => i.tipo === 'menor').length,
    total: issues.length,
  };

  return { summary, issues };
}
