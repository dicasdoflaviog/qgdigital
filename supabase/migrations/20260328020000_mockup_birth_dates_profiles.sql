-- Mock birth dates para perfis dos vereadores/assessores
-- Popula birth_date, whatsapp e genero para testes de aniversariantes no N4
-- Data de referência: 2026-03-28 (alguns aniversários já nesta semana!)

-- ──────────────────────────────────────────────
-- 1. Vereadores de Teixeira de Freitas
-- ──────────────────────────────────────────────
UPDATE profiles SET
  birth_date = '1978-03-28',  -- HOJE (para teste imediato!)
  genero = 'M',
  whatsapp = '73999110001'
WHERE full_name ILIKE '%Jonatas%' AND birth_date IS NULL;

UPDATE profiles SET
  birth_date = '1982-03-29',  -- amanhã
  genero = 'M',
  whatsapp = '73999110002'
WHERE full_name ILIKE '%Tequinha%' AND birth_date IS NULL;

UPDATE profiles SET
  birth_date = '1975-04-01',  -- daqui 4 dias
  genero = 'M',
  whatsapp = '73999110003'
WHERE full_name ILIKE '%Joris%' AND birth_date IS NULL;

UPDATE profiles SET
  birth_date = '1970-04-05',  -- daqui 8 dias
  genero = 'F',
  whatsapp = '73999110004'
WHERE full_name ILIKE '%Simara%' AND birth_date IS NULL;

UPDATE profiles SET
  birth_date = '1980-04-10',  -- daqui 13 dias
  genero = 'M',
  whatsapp = '73999110005'
WHERE full_name ILIKE '%Marcelo Teixeira%' AND birth_date IS NULL;

UPDATE profiles SET
  birth_date = '1972-04-14',  -- daqui 17 dias
  genero = 'M',
  whatsapp = '73999110006'
WHERE full_name ILIKE '%João Garçom%' AND birth_date IS NULL;

UPDATE profiles SET
  birth_date = '1985-04-18',  -- daqui 21 dias
  genero = 'M',
  whatsapp = '73999110007'
WHERE full_name ILIKE '%Adriano Souza%' AND birth_date IS NULL;

UPDATE profiles SET
  birth_date = '1968-04-22',  -- daqui 25 dias
  genero = 'M',
  whatsapp = '73999110008'
WHERE full_name ILIKE '%Ailton Cruz%' AND birth_date IS NULL;

UPDATE profiles SET
  birth_date = '1990-04-27',  -- daqui 30 dias
  genero = 'M',
  whatsapp = '73999110009'
WHERE full_name ILIKE '%Bernardo%' AND birth_date IS NULL;

UPDATE profiles SET
  birth_date = '1988-05-05',  -- próximo mês
  genero = 'M',
  whatsapp = '73999110010'
WHERE full_name ILIKE '%Bruno Barbosa%' AND birth_date IS NULL;

UPDATE profiles SET
  birth_date = '1973-05-12',
  genero = 'M',
  whatsapp = '73999110011'
WHERE full_name ILIKE '%Cláudio%' AND birth_date IS NULL;

UPDATE profiles SET
  birth_date = '1979-05-20',
  genero = 'M',
  whatsapp = '73999110012'
WHERE full_name ILIKE '%Clemeson%' AND birth_date IS NULL;

UPDATE profiles SET
  birth_date = '1983-06-08',
  genero = 'M',
  whatsapp = '73999110013'
WHERE full_name ILIKE '%Marquinhos%' AND birth_date IS NULL;

UPDATE profiles SET
  birth_date = '1976-07-15',
  genero = 'M',
  whatsapp = '73999110014'
WHERE full_name ILIKE '%Jucelio%' AND birth_date IS NULL;

UPDATE profiles SET
  birth_date = '1969-08-22',
  genero = 'M',
  whatsapp = '73999110015'
WHERE full_name ILIKE '%Ronaldo%' AND birth_date IS NULL;

UPDATE profiles SET
  birth_date = '1981-09-10',
  genero = 'M',
  whatsapp = '73999110016'
WHERE full_name ILIKE '%Vanderley%' AND birth_date IS NULL;

UPDATE profiles SET
  birth_date = '1987-10-03',
  genero = 'M',
  whatsapp = '73999110017'
WHERE full_name ILIKE '%Wemerson%' AND birth_date IS NULL;

UPDATE profiles SET
  birth_date = '1971-11-18',
  genero = 'M',
  whatsapp = '73999110018'
WHERE full_name ILIKE '%Adalgiso%' AND birth_date IS NULL;

UPDATE profiles SET
  birth_date = '1977-12-25',
  genero = 'F',
  whatsapp = '73999110019'
WHERE full_name ILIKE '%Rose%Assistente%' AND birth_date IS NULL;

-- ──────────────────────────────────────────────
-- 2. Vereadores de outras cidades (spread ao longo do ano)
-- ──────────────────────────────────────────────
UPDATE profiles SET
  birth_date = '1980-03-30',  -- amanhã depois de amanhã
  genero = 'F',
  whatsapp = '73988220001'
WHERE full_name ILIKE '%Rose da Saúde%' AND birth_date IS NULL;

UPDATE profiles SET
  birth_date = '1975-04-02',
  genero = 'M',
  whatsapp = '73988220002'
WHERE full_name ILIKE '%Galego%' AND birth_date IS NULL;

UPDATE profiles SET
  birth_date = '1983-04-08',
  genero = 'F',
  whatsapp = '73988220003'
WHERE full_name ILIKE '%Evalcy%' AND birth_date IS NULL;

-- ──────────────────────────────────────────────
-- 3. Para qualquer perfil restante sem birth_date — spread automático
-- ──────────────────────────────────────────────
DO $$
DECLARE
  rec RECORD;
  i   INT := 0;
  offsets INT[] := ARRAY[2, 6, 9, 11, 16, 19, 23, 26, 32, 38, 45, 52, 60, 70, 80, 95, 110, 130, 150, 180, 200, 220, 250, 280, 310, 340];
  ages    INT[] := ARRAY[42, 38, 55, 47, 33, 51, 39, 44, 57, 36, 48, 41, 53, 35, 46, 50, 37, 43, 58, 31, 45, 52, 40, 34, 56, 29];
  target_date DATE;
  birth_year  INT;
  month_day   TEXT;
BEGIN
  FOR rec IN
    SELECT id FROM profiles
    WHERE birth_date IS NULL AND is_active = TRUE
    ORDER BY created_at
  LOOP
    i := i + 1;
    target_date := CURRENT_DATE + offsets[LEAST(i, array_length(offsets, 1))];
    birth_year  := EXTRACT(YEAR FROM CURRENT_DATE)::INT - ages[LEAST(i, array_length(ages, 1))];
    month_day   := to_char(target_date, 'MM-DD');

    -- Evitar 29/02 em anos não bissextos
    IF month_day = '02-29' AND (birth_year % 4 != 0 OR (birth_year % 100 = 0 AND birth_year % 400 != 0)) THEN
      month_day := '02-28';
    END IF;

    UPDATE profiles
    SET birth_date = (birth_year::TEXT || '-' || month_day)
    WHERE id = rec.id;
  END LOOP;
END $$;

-- ──────────────────────────────────────────────
-- 4. Preenche whatsapp faltante com número fictício
-- ──────────────────────────────────────────────
UPDATE profiles
SET whatsapp = '73' || LPAD((EXTRACT(EPOCH FROM created_at)::BIGINT % 900000000 + 100000000)::TEXT, 9, '0')
WHERE whatsapp IS NULL AND is_active = TRUE;

-- ──────────────────────────────────────────────
-- 5. Confirmar
-- ──────────────────────────────────────────────
SELECT
  full_name,
  birth_date,
  genero,
  whatsapp,
  (EXTRACT(YEAR FROM CURRENT_DATE) - EXTRACT(YEAR FROM birth_date::DATE))::INT AS idade_aprox,
  (DATE(DATE_TRUNC('year', CURRENT_DATE) + (birth_date::DATE - DATE_TRUNC('year', birth_date::DATE))) - CURRENT_DATE)::INT AS dias_para_aniversario
FROM profiles
WHERE birth_date IS NOT NULL AND is_active = TRUE
ORDER BY dias_para_aniversario
LIMIT 30;
