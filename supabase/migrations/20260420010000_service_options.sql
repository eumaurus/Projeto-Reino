-- ═══════════════════════════════════════════════════════════════════════════
-- Variantes/opções por serviço (vacinação tem N vacinas, exames tem N tipos,
-- banho+tosa tem N pacotes, cirurgia tem N procedimentos).
-- Cada item: { id, name, price, description? }
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.services
    ADD COLUMN IF NOT EXISTS options JSONB NOT NULL DEFAULT '[]';

-- Seed: vacinas caninas e felinas já conhecidas do catálogo da clínica
UPDATE public.services
   SET options = '[
        { "id": "v8",          "name": "V8 (Óctupla canina)",              "price": 90.00 },
        { "id": "v10",         "name": "V10 (Décupla canina)",             "price": 110.00 },
        { "id": "antirrabica", "name": "Antirrábica",                      "price": 70.00 },
        { "id": "gripe",       "name": "Gripe canina",                     "price": 85.00 },
        { "id": "giardia",     "name": "Giárdia",                          "price": 120.00 },
        { "id": "leish",       "name": "Leishmaniose",                     "price": 210.00 },
        { "id": "v3",          "name": "V3 (Tríplice felina)",             "price": 95.00 },
        { "id": "v4",          "name": "V4 (Quádrupla felina)",            "price": 105.00 },
        { "id": "v5",          "name": "V5 (Quíntupla felina)",            "price": 120.00 },
        { "id": "felv",        "name": "FeLV (Leucemia felina)",           "price": 130.00 }
    ]'::jsonb
 WHERE id = 'vacina'
   AND (options IS NULL OR options = '[]'::jsonb);

UPDATE public.services
   SET options = '[
        { "id": "hemograma",     "name": "Hemograma completo",                  "price": 75.00 },
        { "id": "bioquimico",    "name": "Bioquímico (ALT, FA, Creat, Ureia)",  "price": 140.00 },
        { "id": "urinalise",     "name": "Urinálise",                           "price": 80.00 },
        { "id": "parasito",      "name": "Parasitológico de fezes",             "price": 50.00 },
        { "id": "rx-torax",      "name": "Raio-X torácico",                     "price": 180.00 },
        { "id": "rx-abd",        "name": "Raio-X abdominal",                    "price": 180.00 },
        { "id": "us-abd",        "name": "Ultrassonografia abdominal",          "price": 260.00 },
        { "id": "eco",           "name": "Ecocardiograma",                      "price": 340.00 }
    ]'::jsonb
 WHERE id = 'exame'
   AND (options IS NULL OR options = '[]'::jsonb);

UPDATE public.services
   SET options = '[
        { "id": "banho-p",       "name": "Banho (porte pequeno)",               "price":  70.00 },
        { "id": "banho-m",       "name": "Banho (porte médio)",                 "price":  90.00 },
        { "id": "banho-g",       "name": "Banho (porte grande)",                "price": 120.00 },
        { "id": "tosa-higie",    "name": "Tosa higiênica",                      "price":  50.00 },
        { "id": "tosa-bebe",     "name": "Tosa na máquina",                     "price": 110.00 },
        { "id": "tosa-tesoura",  "name": "Tosa na tesoura",                     "price": 160.00 }
    ]'::jsonb
 WHERE id = 'banho'
   AND (options IS NULL OR options = '[]'::jsonb);

UPDATE public.services
   SET options = '[
        { "id": "castra-macho",  "name": "Castração — macho",                   "price":  650.00 },
        { "id": "castra-femea",  "name": "Castração — fêmea",                   "price":  850.00 },
        { "id": "piometra",      "name": "Cirurgia de piometra",                "price": 1600.00 },
        { "id": "tumor",         "name": "Remoção de tumor",                    "price": 1200.00 },
        { "id": "cesarea",       "name": "Cesárea",                             "price": 1500.00 },
        { "id": "ortopedica",    "name": "Cirurgia ortopédica",                 "price": 2800.00 }
    ]'::jsonb
 WHERE id = 'cirurgia'
   AND (options IS NULL OR options = '[]'::jsonb);
