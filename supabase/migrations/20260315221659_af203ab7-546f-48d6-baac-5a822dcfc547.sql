-- Trigger function: when excluido changes to true on eleitores
-- 1. Log to audit_logs with context
-- 2. Notify L3 (admin/vereador) of the gabinete
-- 3. Check for sabotage (>5 deletes in 1 min) and alert L5
CREATE OR REPLACE FUNCTION public.on_soft_delete_eleitor()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_nome TEXT;
  v_role_level INT;
  v_gabinete TEXT;
  v_recent_count INT;
  v_admin_id UUID;
BEGIN
  -- Only fire when excluido changes from false to true
  IF OLD.excluido = true OR NEW.excluido = false THEN
    RETURN NEW;
  END IF;

  -- Get actor info
  SELECT full_name INTO v_nome FROM profiles WHERE id = auth.uid();
  SELECT role_level INTO v_role_level FROM user_roles WHERE user_id = auth.uid() LIMIT 1;
  SELECT full_name INTO v_gabinete FROM profiles WHERE id = NEW.gabinete_id;

  -- 1. Audit log
  INSERT INTO audit_logs (user_id, action, acao, usuario_nome, role_level, gabinete_nome, details)
  VALUES (
    auth.uid(), 'EXCLUIR_ELEITOR', 'EXCLUIR_ELEITOR', v_nome, v_role_level, v_gabinete,
    jsonb_build_object(
      'eleitor_id', NEW.id,
      'eleitor_nome', NEW.nome,
      'bairro', NEW.bairro,
      'gabinete_id', NEW.gabinete_id,
      'responsavel', v_nome,
      'data_exclusao', now()
    )
  );

  -- 2. Notify L3 (admin) of the gabinete
  FOR v_admin_id IN
    SELECT ur.user_id FROM user_roles ur
    JOIN profiles p ON p.id = ur.user_id
    WHERE ur.role = 'admin' AND p.gabinete_id = NEW.gabinete_id AND p.is_active = true
  LOOP
    INSERT INTO notifications (user_id, title, message, type, metadata)
    VALUES (
      v_admin_id,
      '⚠️ Eleitor removido',
      'Atenção: ' || COALESCE(v_nome, 'Usuário') || ' acabou de remover o eleitor "' || NEW.nome || '". O dado está seguro no backup master.',
      'alerta_exclusao',
      jsonb_build_object('eleitor_id', NEW.id, 'eleitor_nome', NEW.nome, 'responsavel', v_nome)
    );
  END LOOP;

  -- 3. Sabotage detection: >5 deletes in last minute by same user
  SELECT count(*) INTO v_recent_count
  FROM audit_logs
  WHERE user_id = auth.uid()
    AND action = 'EXCLUIR_ELEITOR'
    AND created_at > now() - interval '1 minute';

  IF v_recent_count > 5 THEN
    -- Alert all L5 users
    INSERT INTO notifications (user_id, title, message, type, metadata)
    SELECT ur.user_id,
      '🚨 Alerta de Sabotagem',
      '⚠️ Possível tentativa de sabotagem no Gabinete ' || COALESCE(v_gabinete, 'desconhecido') || '. ' || v_recent_count || ' registros excluídos em menos de 1 minuto por ' || COALESCE(v_nome, 'desconhecido') || '. Reversão disponível na Lixeira.',
      'alerta_critico',
      jsonb_build_object('gabinete_id', NEW.gabinete_id, 'gabinete_nome', v_gabinete, 'responsavel', v_nome, 'qtd_exclusoes', v_recent_count)
    FROM user_roles ur WHERE ur.role_level = 5;
  END IF;

  RETURN NEW;
END;
$$;

-- Same for demandas
CREATE OR REPLACE FUNCTION public.on_soft_delete_demanda()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_nome TEXT;
  v_role_level INT;
  v_gabinete TEXT;
  v_recent_count INT;
  v_admin_id UUID;
BEGIN
  IF OLD.excluido = true OR NEW.excluido = false THEN
    RETURN NEW;
  END IF;

  SELECT full_name INTO v_nome FROM profiles WHERE id = auth.uid();
  SELECT role_level INTO v_role_level FROM user_roles WHERE user_id = auth.uid() LIMIT 1;
  SELECT full_name INTO v_gabinete FROM profiles WHERE id = NEW.gabinete_id;

  INSERT INTO audit_logs (user_id, action, acao, usuario_nome, role_level, gabinete_nome, details)
  VALUES (
    auth.uid(), 'EXCLUIR_DEMANDA', 'EXCLUIR_DEMANDA', v_nome, v_role_level, v_gabinete,
    jsonb_build_object(
      'demanda_id', NEW.id,
      'categoria', NEW.categoria,
      'descricao', LEFT(NEW.descricao, 100),
      'gabinete_id', NEW.gabinete_id,
      'responsavel', v_nome,
      'data_exclusao', now()
    )
  );

  FOR v_admin_id IN
    SELECT ur.user_id FROM user_roles ur
    JOIN profiles p ON p.id = ur.user_id
    WHERE ur.role = 'admin' AND p.gabinete_id = NEW.gabinete_id AND p.is_active = true
  LOOP
    INSERT INTO notifications (user_id, title, message, type, metadata)
    VALUES (
      v_admin_id,
      '⚠️ Demanda removida',
      'Atenção: ' || COALESCE(v_nome, 'Usuário') || ' acabou de remover uma demanda (' || COALESCE(NEW.categoria, 'sem categoria') || '). O dado está seguro no backup master.',
      'alerta_exclusao',
      jsonb_build_object('demanda_id', NEW.id, 'responsavel', v_nome)
    );
  END LOOP;

  SELECT count(*) INTO v_recent_count
  FROM audit_logs
  WHERE user_id = auth.uid()
    AND action = 'EXCLUIR_DEMANDA'
    AND created_at > now() - interval '1 minute';

  IF v_recent_count > 5 THEN
    INSERT INTO notifications (user_id, title, message, type, metadata)
    SELECT ur.user_id,
      '🚨 Alerta de Sabotagem',
      '⚠️ Possível tentativa de sabotagem no Gabinete ' || COALESCE(v_gabinete, 'desconhecido') || '. ' || v_recent_count || ' demandas excluídas em menos de 1 minuto por ' || COALESCE(v_nome, 'desconhecido') || '. Reversão disponível na Lixeira.',
      'alerta_critico',
      jsonb_build_object('gabinete_id', NEW.gabinete_id, 'gabinete_nome', v_gabinete, 'responsavel', v_nome, 'qtd_exclusoes', v_recent_count)
    FROM user_roles ur WHERE ur.role_level = 5;
  END IF;

  RETURN NEW;
END;
$$;

-- Create triggers
DROP TRIGGER IF EXISTS trg_soft_delete_eleitor ON public.eleitores;
CREATE TRIGGER trg_soft_delete_eleitor
  AFTER UPDATE OF excluido ON public.eleitores
  FOR EACH ROW
  EXECUTE FUNCTION public.on_soft_delete_eleitor();

DROP TRIGGER IF EXISTS trg_soft_delete_demanda ON public.demandas;
CREATE TRIGGER trg_soft_delete_demanda
  AFTER UPDATE OF excluido ON public.demandas
  FOR EACH ROW
  EXECUTE FUNCTION public.on_soft_delete_demanda();