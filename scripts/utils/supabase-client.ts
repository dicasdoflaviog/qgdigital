import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase credentials not found in environment');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Tipos
export interface Sugestao {
  id: string;
  user_id: string;
  gabinete_id: string;
  conteudo: string;
  tipo: 'feature' | 'bug' | 'melhoria';
  status: 'pendente' | 'analisando' | 'aprovado' | 'rejeitado' | 'implementado';
  prioridade: number;
  analise_ia?: string;
  spec_gerada?: string;
  created_at: string;
  updated_at?: string;
}

export interface LogErro {
  id: string;
  tipo: 'frontend' | 'backend' | 'api' | 'database';
  mensagem: string;
  stack_trace?: string;
  arquivo?: string;
  linha?: number;
  user_id?: string;
  url?: string;
  status: 'novo' | 'analisando' | 'corrigido' | 'ignorado';
  created_at: string;
}
