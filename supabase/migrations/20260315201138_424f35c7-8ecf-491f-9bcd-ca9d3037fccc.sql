
-- Update seeded test eleitores in Teixeira de Freitas to use real bairro names from BAIRRO_COORDS
UPDATE public.eleitores SET bairro = 'Bela Vista'    WHERE cidade = 'Teixeira de Freitas' AND bairro = 'Boa Vista';
UPDATE public.eleitores SET bairro = 'Castelinho'    WHERE cidade = 'Teixeira de Freitas' AND bairro = 'Industrial';
UPDATE public.eleitores SET bairro = 'Jardim Caraípe' WHERE cidade = 'Teixeira de Freitas' AND bairro = 'Jardim';
UPDATE public.eleitores SET bairro = 'Nova Teixeira'  WHERE cidade = 'Teixeira de Freitas' AND bairro = 'Nova Esperança';
UPDATE public.eleitores SET bairro = 'Ouro Verde'     WHERE cidade = 'Teixeira de Freitas' AND bairro = 'Parque Real';
UPDATE public.eleitores SET bairro = 'Santa Rita'     WHERE cidade = 'Teixeira de Freitas' AND bairro = 'Santa Cruz';
UPDATE public.eleitores SET bairro = 'São Lourenço'   WHERE cidade = 'Teixeira de Freitas' AND bairro = 'São José';
UPDATE public.eleitores SET bairro = 'Vila Vargas'    WHERE cidade = 'Teixeira de Freitas' AND bairro = 'Vila Nova';

-- Also update demandas bairro to match
UPDATE public.demandas SET bairro = e.bairro
FROM public.eleitores e
WHERE public.demandas.eleitor_id = e.id
AND e.cidade = 'Teixeira de Freitas';
