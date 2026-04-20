-- ════════════════════════════════════════════════════════════════════════════
--  COMANDAS / CHECKOUTS — vet monta conta durante consulta e envia p/ recepção
-- ════════════════════════════════════════════════════════════════════════════

-- ─── 1. Permitir role 'reception' em profiles ───────────────────────────────
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD  CONSTRAINT profiles_role_check
    CHECK (role IN ('client','admin','vet','reception'));


-- ─── 2. TABELA: checkouts (comandas) ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.checkouts (
    id                 UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    pet_id             TEXT          NOT NULL REFERENCES public.pets(id)          ON DELETE CASCADE,
    owner_id           UUID          NOT NULL REFERENCES public.profiles(id)      ON DELETE CASCADE,
    consultation_id    UUID                   REFERENCES public.consultations(id) ON DELETE SET NULL,
    booking_id         UUID                   REFERENCES public.bookings(id)      ON DELETE SET NULL,
    created_by         UUID                   REFERENCES public.profiles(id)      ON DELETE SET NULL,
    settled_by         UUID                   REFERENCES public.profiles(id)      ON DELETE SET NULL,
    -- linha a linha: [{ "service_id": "consulta", "name": "Consulta Clínica", "qty": 1, "unit_price": 180.00, "subtotal": 180.00 }, ...]
    items              JSONB         NOT NULL DEFAULT '[]',
    subtotal           NUMERIC(10,2) NOT NULL DEFAULT 0,
    discount_type      TEXT          NOT NULL DEFAULT 'none'
                                     CHECK (discount_type IN ('none','value','percent')),
    discount_value     NUMERIC(10,2) NOT NULL DEFAULT 0,
    total              NUMERIC(10,2) NOT NULL DEFAULT 0,
    payment_method     TEXT,  -- preenchido ao marcar como pago: 'pix','debit','credit','cash','transfer','other'
    status             TEXT          NOT NULL DEFAULT 'pending'
                                     CHECK (status IN ('pending','paid','cancelled')),
    notes              TEXT,
    settled_at         TIMESTAMPTZ,
    created_at         TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ   NOT NULL DEFAULT now()
);
ALTER TABLE public.checkouts ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS checkouts_pet_idx     ON public.checkouts(pet_id);
CREATE INDEX IF NOT EXISTS checkouts_owner_idx   ON public.checkouts(owner_id);
CREATE INDEX IF NOT EXISTS checkouts_status_idx  ON public.checkouts(status);
CREATE INDEX IF NOT EXISTS checkouts_created_idx ON public.checkouts(created_at DESC);

CREATE TRIGGER set_checkouts_updated_at
    BEFORE UPDATE ON public.checkouts
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- ─── 3. RLS POLICIES ─────────────────────────────────────────────────────────
CREATE POLICY "checkouts owner read"
    ON public.checkouts FOR SELECT
    USING (owner_id = auth.uid());

CREATE POLICY "checkouts staff read all"
    ON public.checkouts FOR SELECT
    USING (public.current_user_role() IN ('admin','vet','reception'));

CREATE POLICY "checkouts staff insert"
    ON public.checkouts FOR INSERT
    WITH CHECK (public.current_user_role() IN ('admin','vet','reception'));

CREATE POLICY "checkouts staff update"
    ON public.checkouts FOR UPDATE
    USING (public.current_user_role() IN ('admin','vet','reception'));

CREATE POLICY "checkouts admin delete"
    ON public.checkouts FOR DELETE
    USING (public.current_user_role() = 'admin');


-- ─── 4. TRIGGER: notifica recepção/admin ao enviar nova comanda ─────────────
CREATE OR REPLACE FUNCTION public.notify_reception_on_new_checkout()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_pet_name TEXT;
BEGIN
    SELECT name INTO v_pet_name FROM public.pets WHERE id = NEW.pet_id;

    INSERT INTO public.notifications (user_id, type, title, body, link)
    SELECT
        p.id,
        'checkout_sent',
        'Nova comanda para fechamento',
        'Pet: ' || COALESCE(v_pet_name, '—') || ' · Total: R$ ' ||
            to_char(NEW.total, 'FM999999990.00'),
        '/reception/checkouts'
    FROM public.profiles p
    WHERE p.role IN ('admin','reception');

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_checkout_created ON public.checkouts;
CREATE TRIGGER on_checkout_created
    AFTER INSERT ON public.checkouts
    FOR EACH ROW EXECUTE FUNCTION public.notify_reception_on_new_checkout();


-- ─── 5. TRIGGER: notifica tutor quando comanda é paga ───────────────────────
CREATE OR REPLACE FUNCTION public.notify_owner_on_checkout_paid()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    IF OLD.status <> 'paid' AND NEW.status = 'paid' THEN
        INSERT INTO public.notifications (user_id, type, title, body, link)
        VALUES (
            NEW.owner_id,
            'checkout_paid',
            'Pagamento recebido',
            'Recebemos o pagamento de R$ ' || to_char(NEW.total, 'FM999999990.00') ||
                '. Obrigado!',
            '/bookings'
        );
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_checkout_paid ON public.checkouts;
CREATE TRIGGER on_checkout_paid
    AFTER UPDATE OF status ON public.checkouts
    FOR EACH ROW EXECUTE FUNCTION public.notify_owner_on_checkout_paid();
