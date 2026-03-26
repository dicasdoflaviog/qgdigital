import { supabase } from '@/lib/supabase';

interface ErrorLog {
  tipo: 'frontend' | 'api' | 'database';
  mensagem: string;
  stack_trace?: string;
  arquivo?: string;
  linha?: number;
  url?: string;
  metadata?: Record<string, unknown>;
}

export async function logError(error: Error | ErrorLog, context?: Record<string, unknown>) {
  try {
    const errorData: ErrorLog = error instanceof Error 
      ? {
          tipo: 'frontend',
          mensagem: error.message,
          stack_trace: error.stack,
          url: typeof window !== 'undefined' ? window.location.href : undefined,
          metadata: context,
        }
      : error;

    // Extrair arquivo e linha do stack trace
    if (errorData.stack_trace) {
      const match = errorData.stack_trace.match(/at\s+.*?\s+\(?(.*?):(\d+):\d+\)?/);
      if (match) {
        errorData.arquivo = match[1];
        errorData.linha = parseInt(match[2]);
      }
    }

    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from('logs_erro').insert({
      ...errorData,
      user_id: user?.id,
    });
  } catch (e) {
    // Fallback silencioso - não quebrar o app por erro de logging
    console.error('Erro ao logar erro:', e);
  }
}

// Capturar erros globais no navegador
if (typeof window !== 'undefined') {
  window.onerror = (message, source, lineno, colno, error) => {
    logError({
      tipo: 'frontend',
      mensagem: String(message),
      stack_trace: error?.stack,
      arquivo: source || undefined,
      linha: lineno,
      url: window.location.href,
    });
  };

  window.onunhandledrejection = (event) => {
    logError({
      tipo: 'frontend',
      mensagem: `Unhandled Promise Rejection: ${event.reason}`,
      stack_trace: event.reason?.stack,
      url: window.location.href,
    });
  };
}
