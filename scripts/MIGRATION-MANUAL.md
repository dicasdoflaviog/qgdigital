# 🗄️ Supabase Migration Manual

## Objetivo
Criar as tabelas necessárias para o QA Agent System (logs_erro, auditorias).

## Instruções

### Via Supabase Dashboard (Recomendado)

1. **Acesse o Supabase Dashboard**
   ```
   https://app.supabase.com/projects
   ```

2. **Selecione seu projeto** (mdtbwvyloaeixwxmvysj)

3. **Vá para SQL Editor**
   - Clique em "SQL Editor" no menu esquerdo
   - Clique em "New Query"

4. **Cole o SQL abaixo** e execute:

```sql
-- Create logs_erro table for error tracking
CREATE TABLE IF NOT EXISTS public.logs_erro (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message TEXT NOT NULL,
  stack TEXT,
  file TEXT,
  line INTEGER,
  usuario_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  context JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create auditorias table for audit results
CREATE TABLE IF NOT EXISTS public.auditorias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo VARCHAR(50) NOT NULL,
  issues JSONB NOT NULL DEFAULT '[]',
  stats JSONB NOT NULL DEFAULT '{}',
  markdown TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_logs_erro_created ON public.logs_erro(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_logs_erro_usuario ON public.logs_erro(usuario_id);
CREATE INDEX IF NOT EXISTS idx_auditorias_created ON public.auditorias(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auditorias_tipo ON public.auditorias(tipo);

-- Enable RLS (Row Level Security)
ALTER TABLE public.logs_erro ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditorias ENABLE ROW LEVEL SECURITY;

-- Create RLS policies - service_role only
CREATE POLICY "Service role only - logs_erro" 
  ON public.logs_erro 
  USING (auth.role() = 'service_role') 
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role only - auditorias" 
  ON public.auditorias 
  USING (auth.role() = 'service_role') 
  WITH CHECK (auth.role() = 'service_role');

-- Grant permissions to service_role
GRANT ALL ON public.logs_erro TO service_role;
GRANT ALL ON public.auditorias TO service_role;
```

5. **Clique em "Run"** (botão verde)

6. **Verifique se as tabelas foram criadas**
   - Vá para "Table Editor"
   - Procure por `logs_erro` e `auditorias`

---

## Após a Migration

### Rodar Audit Agent
```bash
node scripts/run-audit.mjs
```

**Output esperado:**
```
✅ Audit report saved to Supabase (auditorias table)
```

### Ver dados salvos
No Supabase Dashboard:
- Clique em "Table Editor"
- Selecione `auditorias`
- Veja os resultados do audit

---

## Troubleshooting

### "Could not find the table 'public.auditorias'"
→ Significa que a migration ainda não foi aplicada
→ Execute o SQL acima no Supabase Dashboard

### "Permission denied"
→ Verifique se está usando service_role (não anon)
→ As credenciais em .env devem ser do service_role

### SQL errors
→ Copie cada statement e execute um por um
→ Procure por erros de sintaxe

---

## Verificação

Execute no Supabase SQL Editor:

```sql
-- Ver tabelas criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('logs_erro', 'auditorias');

-- Resultado esperado:
-- logs_erro
-- auditorias
```

