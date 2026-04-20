-- ═══════════════════════════════════════════════════════════════════════════
--  Função RPC: admin força troca de senha de qualquer usuário.
--  Usa SECURITY DEFINER para atualizar auth.users.encrypted_password.
--  Valida internamente que o chamador é admin — policies RLS não afetam funções DEFINER.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.admin_reset_password(
    target_user_id UUID,
    new_password   TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
    caller_role TEXT;
BEGIN
    -- Valida tamanho da senha
    IF new_password IS NULL OR length(new_password) < 6 THEN
        RAISE EXCEPTION 'Senha precisa ter ao menos 6 caracteres.';
    END IF;

    -- Valida que o chamador é admin
    SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();
    IF caller_role IS NULL OR caller_role <> 'admin' THEN
        RAISE EXCEPTION 'Apenas administradores podem forçar troca de senha.';
    END IF;

    -- Atualiza a senha no schema auth (encrypted via bcrypt do pgcrypto)
    UPDATE auth.users
       SET encrypted_password = extensions.crypt(new_password, extensions.gen_salt('bf')),
           updated_at         = now()
     WHERE id = target_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Usuário não encontrado.';
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_reset_password(UUID, TEXT) TO authenticated;
