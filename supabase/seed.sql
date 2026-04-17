-- Seed de usuários para desenvolvimento local
-- As senhas abaixo são bcrypt de: admin123 | vet12345 | joao1234

INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    created_at, updated_at, raw_user_meta_data, role, aud
) VALUES
(
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'admin@reinoanimal.com',
    crypt('admin123', gen_salt('bf')),
    now(), now(), now(),
    '{"name":"Admin Reino Animal","document":"00000000000100","phone":"(11) 90000-0000","role":"admin"}',
    'authenticated', 'authenticated'
),
(
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'vet@reinoanimal.com',
    crypt('vet12345', gen_salt('bf')),
    now(), now(), now(),
    '{"name":"Veterinário de Teste","document":"33333333333","phone":"(11) 91111-1111","role":"vet"}',
    'authenticated', 'authenticated'
),
(
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000000',
    'joao@example.com',
    crypt('joao1234', gen_salt('bf')),
    now(), now(), now(),
    '{"name":"João Silva","document":"11111111111","phone":"(11) 98888-7777","role":"client"}',
    'authenticated', 'authenticated'
)
ON CONFLICT (id) DO NOTHING;
