-- ─── TABELA: profiles ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
    id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name        TEXT        NOT NULL,
    email       TEXT        NOT NULL,
    document    TEXT        NOT NULL UNIQUE,
    phone       TEXT,
    role        TEXT        NOT NULL DEFAULT 'client'
                            CHECK (role IN ('client','admin','vet')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ─── TABELA: pets ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pets (
    id                    TEXT        PRIMARY KEY,
    owner_id              UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name                  TEXT        NOT NULL,
    species               TEXT        NOT NULL,
    breed                 TEXT,
    age                   TEXT,
    weight                TEXT,
    image                 TEXT,
    notes                 TEXT,
    next_vaccine          TEXT,
    birth_date            TEXT,
    upcoming_appointments JSONB       NOT NULL DEFAULT '[]',
    vaccines              JSONB       NOT NULL DEFAULT '[]',
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;

-- ─── TRIGGER: updated_at automático ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER set_pets_updated_at
    BEFORE UPDATE ON public.pets
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ─── TRIGGER: criar profile ao registrar usuário ─────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    INSERT INTO public.profiles (id, name, email, document, phone, role)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'name',
        NEW.email,
        NEW.raw_user_meta_data->>'document',
        NEW.raw_user_meta_data->>'phone',
        COALESCE(NEW.raw_user_meta_data->>'role', 'client')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Função auxiliar: lê role sem acionar RLS (evita recursão nas policies)
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

-- ─── RLS: profiles ───────────────────────────────────────────────────────────
CREATE POLICY "own read"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "staff read all"
    ON public.profiles FOR SELECT
    USING (public.current_user_role() IN ('admin','vet'));

CREATE POLICY "own update"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "admin update"
    ON public.profiles FOR UPDATE
    USING (public.current_user_role() = 'admin');

CREATE POLICY "admin delete"
    ON public.profiles FOR DELETE
    USING (public.current_user_role() = 'admin');

-- ─── RLS: pets ───────────────────────────────────────────────────────────────
CREATE POLICY "owner read"
    ON public.pets FOR SELECT
    USING (owner_id = auth.uid());

CREATE POLICY "staff read all"
    ON public.pets FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role IN ('admin','vet')
    ));

CREATE POLICY "owner insert"
    ON public.pets FOR INSERT
    WITH CHECK (owner_id = auth.uid());

CREATE POLICY "staff insert"
    ON public.pets FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role IN ('admin','vet')
    ));

CREATE POLICY "owner staff update"
    ON public.pets FOR UPDATE
    USING (
        owner_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role IN ('admin','vet')
        )
    );

CREATE POLICY "admin delete"
    ON public.pets FOR DELETE
    USING (
        owner_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role IN ('admin','vet')
        )
    );
