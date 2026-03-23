-- Trigger function for eleitor creation
CREATE OR REPLACE FUNCTION public.log_eleitor_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_nome TEXT;
  v_role_level INT;
  v_gabinete TEXT;
BEGIN
  SELECT full_name INTO v_nome FROM profiles WHERE id = auth.uid();
  SELECT role_level INTO v_role_level FROM user_roles WHERE user_id = auth.uid() LIMIT 1;
  SELECT full_name INTO v_gabinete FROM profiles WHERE id = NEW.gabinete_id;

  INSERT INTO audit_logs (user_id, action, usuario_nome, role_level, gabinete_nome, acao, details)
  VALUES (
    auth.uid(),
    'CADASTRO_ELEITOR',
    v_nome,
    v_role_level,
    v_gabinete,
    'CADASTRO_ELEITOR',
    jsonb_build_object('eleitor_id', NEW.id, 'eleitor_nome', NEW.nome, 'bairro', NEW.bairro, 'cidade', NEW.cidade)
  );
  RETURN NEW;
END;
$$;

-- Trigger function for demanda update
CREATE OR REPLACE FUNCTION public.log_demanda_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_nome TEXT;
  v_role_level INT;
  v_gabinete TEXT;
BEGIN
  SELECT full_name INTO v_nome FROM profiles WHERE id = auth.uid();
  SELECT role_level INTO v_role_level FROM user_roles WHERE user_id = auth.uid() LIMIT 1;
  SELECT full_name INTO v_gabinete FROM profiles WHERE id = NEW.gabinete_id;

  INSERT INTO audit_logs (user_id, action, usuario_nome, role_level, gabinete_nome, acao, details)
  VALUES (
    auth.uid(),
    'EDITAR_DEMANDA',
    v_nome,
    v_role_level,
    v_gabinete,
    'EDITAR_DEMANDA',
    jsonb_build_object(
      'demanda_id', NEW.id,
      'status_anterior', OLD.status,
      'status_novo', NEW.status,
      'categoria', NEW.categoria,
      'descricao', LEFT(NEW.descricao, 100)
    )
  );
  RETURN NEW;
END;
$$;

-- Trigger function for demanda creation
CREATE OR REPLACE FUNCTION public.log_demanda_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_nome TEXT;
  v_role_level INT;
  v_gabinete TEXT;
BEGIN
  SELECT full_name INTO v_nome FROM profiles WHERE id = auth.uid();
  SELECT role_level INTO v_role_level FROM user_roles WHERE user_id = auth.uid() LIMIT 1;
  SELECT full_name INTO v_gabinete FROM profiles WHERE id = NEW.gabinete_id;

  INSERT INTO audit_logs (user_id, action, usuario_nome, role_level, gabinete_nome, acao, details)
  VALUES (
    auth.uid(),
    'CRIAR_DEMANDA',
    v_nome,
    v_role_level,
    v_gabinete,
    'CRIAR_DEMANDA',
    jsonb_build_object('demanda_id', NEW.id, 'categoria', NEW.categoria, 'status', NEW.status)
  );
  RETURN NEW;
END;
$$;

-- Create triggers
DROP TRIGGER IF EXISTS trg_log_eleitor_insert ON public.eleitores;
CREATE TRIGGER trg_log_eleitor_insert
AFTER INSERT ON public.eleitores
FOR EACH ROW EXECUTE FUNCTION public.log_eleitor_insert();

DROP TRIGGER IF EXISTS trg_log_demanda_update ON public.demandas;
CREATE TRIGGER trg_log_demanda_update
AFTER UPDATE ON public.demandas
FOR EACH ROW
WHEN (OLD.* IS DISTINCT FROM NEW.*)
EXECUTE FUNCTION public.log_demanda_update();

DROP TRIGGER IF EXISTS trg_log_demanda_insert ON public.demandas;
CREATE TRIGGER trg_log_demanda_insert
AFTER INSERT ON public.demandas
FOR EACH ROW EXECUTE FUNCTION public.log_demanda_insert();