-- ─── TABELA: bookings ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bookings (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id        UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    pet_id          TEXT        NOT NULL REFERENCES public.pets(id)     ON DELETE CASCADE,
    service         TEXT        NOT NULL,
    vaccines        JSONB       NOT NULL DEFAULT '[]',
    requested_date  DATE        NOT NULL,
    requested_time  TEXT        NOT NULL,
    status          TEXT        NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('pending','confirmed','cancelled','done')),
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- ─── RLS: bookings ────────────────────────────────────────────────────────────
CREATE POLICY "owner read"
    ON public.bookings FOR SELECT
    USING (owner_id = auth.uid());

CREATE POLICY "staff read all"
    ON public.bookings FOR SELECT
    USING (public.current_user_role() IN ('admin','vet'));

CREATE POLICY "owner insert"
    ON public.bookings FOR INSERT
    WITH CHECK (owner_id = auth.uid());

CREATE POLICY "staff update"
    ON public.bookings FOR UPDATE
    USING (public.current_user_role() IN ('admin','vet'));

CREATE POLICY "owner update"
    ON public.bookings FOR UPDATE
    USING (owner_id = auth.uid());

CREATE POLICY "admin delete"
    ON public.bookings FOR DELETE
    USING (public.current_user_role() = 'admin');
