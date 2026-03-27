# PRD — Multitenancy Individual & RLS (Privacidade por Nível)

> **Versão:** 1.0 | **Data:** 2026-03-27 | **Método:** SDD

---

## Problema

O sistema atual trata a privacidade de forma **permissiva demais para N1/N2**:
- N2 (secretaria) enxerga **todos** os eleitores do gabinete, mesmo os que não cadastrou
- N1 (assessor) usa `assessor_id` para isolamento, mas N2 não tem esse mecanismo
- N4 (líder político) tem acesso irrestrito a dados sensíveis (whatsapp, data_nascimento, endereço)
- A segurança é feita apenas no frontend — o banco não garante o isolamento individualmente

---

## Objetivo

**Regra absoluta:** *"Privacidade individual na base, visibilidade total no topo."*

| Nível | Papel | O que vê |
|-------|-------|----------|
| N1 (assessor) | Assessor | Apenas os eleitores que ele mesmo cadastrou |
| N2 (secretaria) | Secretária | Apenas os eleitores que ela mesma cadastrou |
| N3 (admin) | Vereador | Todos os eleitores do gabinete |
| N4 (lider_politico) | Líder político | Volume e métricas — sem campos sensíveis |
| N5 (super_admin) | System Master | Acesso total irrestrito |

---

## Achados Técnicos (Research)

### Tabela `eleitores` — colunas relevantes
```
id, nome, whatsapp*, data_nascimento*, bairro*, cidade*,
gabinete_id, assessor_id, created_at, excluido, latitude, longitude, sexo
```
`*` = campos sensíveis a mascarar para N4

### Campos sensíveis confirmados no banco
- `whatsapp` — contato (telefone)
- `data_nascimento` — PII (data de nascimento)
- `bairro` + `cidade` — endereço residencial
- **NÃO existem**: CPF, email (não estão na tabela)

### Coluna `created_by` — NÃO existe
- Atualmente usa `assessor_id` (links to `assessores.user_id`) para rastrear criação de N1
- N2 (secretaria) **não tem** registro na tabela `assessores` → sem rastreio de criação
- **Solução**: adicionar `created_by UUID REFERENCES auth.users(id)` com trigger automático

### RLS atual
- Habilitado na tabela `eleitores`
- N1: filtra por `assessor_id IN (SELECT id FROM assessores WHERE user_id = auth.uid())`
- N2: filtra por `gabinete_id = get_user_gabinete_id()` → **muito permissivo**
- N3: full gabinete access ✅
- N4/N5: acesso irrestrito → **N4 deve ser restrito**

### Funções auxiliares existentes
```sql
get_user_gabinete_id()    -- retorna gabinete_id do usuário atual
get_user_role_level()     -- retorna 1-5 do nível do usuário atual
has_role(uid, role)       -- verifica role por enum
```

### Hooks que consultam `eleitores`
| Hook | Usado em | Impacto |
|------|----------|---------|
| `useVoters` | Lista de eleitores | Filtrar por created_by para N1/N2 |
| `useVotersPaginated` | Lista paginada | Idem |
| `useVoterDemographics` | Perfil eleitoral | N4: não selecionar campos sensíveis |
| `useVotersForMap` | Mapa de calor | N4: sem whatsapp/data_nascimento |
| `useVoterStats` | Dashboard | Apenas contagens — ok |
| `useGabinetePerformance` | Desempenho | Apenas bairro/assessor_id — ok |

### Registros órfãos (sem `created_by`)
- Registros existentes sem `assessor_id`: ficam órfãos para N1/N2
- **Regra do usuário**: N1/N2 não enxergam até N3 os atribuir → aparecerão como "sem responsável" no painel do vereador
- Backfill dos que têm `assessor_id`: `created_by = assessores.user_id`

---

## Fora do Escopo

- Demandas, ofícios e outros módulos: mantêm regra atual (usuário confirmou: apenas `eleitores`)
- Criação de UI para N3 reatribuir eleitores órfãos: fase futura
- N4 em listas de eleitores individuais: restrito ao nível de linha (sem acesso a listas), apenas métricas agregadas

---

## Restrições Técnicas

- RLS no Supabase: não suporta **column-level security** nativo
- Para mascarar campos de N4: usar **PostgreSQL VIEW com CASE WHEN** (security barrier)
- Frontend: complementar com seleção condicional de campos (não substituir o RLS)
- Todas as políticas devem usar `SECURITY DEFINER` functions para evitar recursão
