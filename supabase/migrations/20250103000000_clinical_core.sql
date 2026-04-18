-- ════════════════════════════════════════════════════════════════════════════
--  PRONTUÁRIO ELETRÔNICO + RECEITAS + EXAMES + NOTIFICAÇÕES + CATÁLOGO
-- ════════════════════════════════════════════════════════════════════════════

-- ─── TABELA: services (catálogo configurável) ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.services (
    id          TEXT        PRIMARY KEY,
    name        TEXT        NOT NULL,
    description TEXT,
    icon        TEXT,
    duration    INT         NOT NULL DEFAULT 30,
    price       NUMERIC(10,2),
    active      BOOLEAN     NOT NULL DEFAULT true,
    sort_order  INT         NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

INSERT INTO public.services (id, name, description, icon, duration, price, sort_order) VALUES
    ('consulta',   'Consulta Clínica',         'Avaliação clínica geral, diagnóstico e orientação.', 'Stethoscope',   40, 180.00, 1),
    ('vacina',     'Vacinação',                'Aplicação de vacinas com protocolo individualizado.', 'Syringe',       20,  90.00, 2),
    ('exame',      'Exames',                   'Exames laboratoriais e de imagem.',                   'Microscope',    30, 120.00, 3),
    ('cirurgia',   'Cirurgia',                 'Procedimentos cirúrgicos em pequenos animais.',       'Scissors',      90, 850.00, 4),
    ('banho',      'Banho & Tosa',             'Estética animal segura e profissional.',              'Droplets',      60, 110.00, 5),
    ('domiciliar', 'Consulta Domiciliar',      'Atendimento no conforto da sua casa.',                'Home',          60, 260.00, 6),
    ('retorno',    'Retorno',                  'Revisão pós-consulta ou pós-procedimento.',           'ActivitySquare',30,   0.00, 7)
ON CONFLICT (id) DO NOTHING;


-- ─── TABELA: consultations (prontuário) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.consultations (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    pet_id          TEXT        NOT NULL REFERENCES public.pets(id)     ON DELETE CASCADE,
    owner_id        UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    vet_id          UUID                 REFERENCES public.profiles(id) ON DELETE SET NULL,
    booking_id      UUID                 REFERENCES public.bookings(id) ON DELETE SET NULL,
    consulted_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    reason          TEXT,
    anamnesis       TEXT,
    procedures      TEXT,
    diagnosis       TEXT,
    treatment       TEXT,
    notes           TEXT,
    weight_kg       NUMERIC(5,2),
    temperature_c   NUMERIC(4,1),
    heart_rate      INT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS consultations_pet_idx      ON public.consultations(pet_id);
CREATE INDEX IF NOT EXISTS consultations_owner_idx    ON public.consultations(owner_id);
CREATE INDEX IF NOT EXISTS consultations_vet_idx      ON public.consultations(vet_id);
CREATE INDEX IF NOT EXISTS consultations_date_idx     ON public.consultations(consulted_at DESC);

CREATE TRIGGER set_consultations_updated_at
    BEFORE UPDATE ON public.consultations
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- ─── TABELA: prescriptions (receitas) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.prescriptions (
    id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    pet_id            TEXT        NOT NULL REFERENCES public.pets(id)     ON DELETE CASCADE,
    owner_id          UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    vet_id            UUID                 REFERENCES public.profiles(id) ON DELETE SET NULL,
    consultation_id   UUID                 REFERENCES public.consultations(id) ON DELETE CASCADE,
    items             JSONB       NOT NULL DEFAULT '[]',
    instructions      TEXT,
    issued_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    valid_until       DATE,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS prescriptions_pet_idx      ON public.prescriptions(pet_id);
CREATE INDEX IF NOT EXISTS prescriptions_owner_idx    ON public.prescriptions(owner_id);


-- ─── TABELA: exams (exames) ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.exams (
    id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    pet_id            TEXT        NOT NULL REFERENCES public.pets(id)     ON DELETE CASCADE,
    owner_id          UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    vet_id            UUID                 REFERENCES public.profiles(id) ON DELETE SET NULL,
    consultation_id   UUID                 REFERENCES public.consultations(id) ON DELETE SET NULL,
    type              TEXT        NOT NULL,
    category          TEXT        NOT NULL DEFAULT 'laboratorial',
    status            TEXT        NOT NULL DEFAULT 'requested'
                                  CHECK (status IN ('requested','in_progress','completed','cancelled')),
    requested_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at      TIMESTAMPTZ,
    results           TEXT,
    conclusion        TEXT,
    file_url          TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS exams_pet_idx      ON public.exams(pet_id);
CREATE INDEX IF NOT EXISTS exams_owner_idx    ON public.exams(owner_id);
CREATE INDEX IF NOT EXISTS exams_status_idx   ON public.exams(status);


-- ─── TABELA: notifications (central de avisos in-app) ───────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type        TEXT        NOT NULL,
    title       TEXT        NOT NULL,
    body        TEXT,
    link        TEXT,
    read_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS notifications_user_idx    ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_created_idx ON public.notifications(created_at DESC);


-- ─── ADIÇÃO: profiles.avatar_url ────────────────────────────────────────────
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio         TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS crmv        TEXT;


-- ─── ADIÇÃO: bookings.confirmed_by, cancelled_reason ────────────────────────
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS confirmed_by       UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS confirmed_at       TIMESTAMPTZ;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS cancelled_reason   TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS duration_minutes   INT NOT NULL DEFAULT 30;


-- ═══════════════════════════ RLS POLICIES ═══════════════════════════════════

-- services: leitura pública (incluindo anônimos) + escrita admin
CREATE POLICY "services read all"
    ON public.services FOR SELECT
    USING (true);

CREATE POLICY "services admin write"
    ON public.services FOR ALL
    USING (public.current_user_role() = 'admin')
    WITH CHECK (public.current_user_role() = 'admin');


-- consultations
CREATE POLICY "consultations owner read"
    ON public.consultations FOR SELECT
    USING (owner_id = auth.uid());

CREATE POLICY "consultations staff read all"
    ON public.consultations FOR SELECT
    USING (public.current_user_role() IN ('admin','vet'));

CREATE POLICY "consultations staff insert"
    ON public.consultations FOR INSERT
    WITH CHECK (public.current_user_role() IN ('admin','vet'));

CREATE POLICY "consultations staff update"
    ON public.consultations FOR UPDATE
    USING (public.current_user_role() IN ('admin','vet'));

CREATE POLICY "consultations admin delete"
    ON public.consultations FOR DELETE
    USING (public.current_user_role() = 'admin');


-- prescriptions
CREATE POLICY "prescriptions owner read"
    ON public.prescriptions FOR SELECT
    USING (owner_id = auth.uid());

CREATE POLICY "prescriptions staff read all"
    ON public.prescriptions FOR SELECT
    USING (public.current_user_role() IN ('admin','vet'));

CREATE POLICY "prescriptions staff insert"
    ON public.prescriptions FOR INSERT
    WITH CHECK (public.current_user_role() IN ('admin','vet'));

CREATE POLICY "prescriptions staff update"
    ON public.prescriptions FOR UPDATE
    USING (public.current_user_role() IN ('admin','vet'));

CREATE POLICY "prescriptions admin delete"
    ON public.prescriptions FOR DELETE
    USING (public.current_user_role() = 'admin');


-- exams
CREATE POLICY "exams owner read"
    ON public.exams FOR SELECT
    USING (owner_id = auth.uid());

CREATE POLICY "exams staff read all"
    ON public.exams FOR SELECT
    USING (public.current_user_role() IN ('admin','vet'));

CREATE POLICY "exams staff insert"
    ON public.exams FOR INSERT
    WITH CHECK (public.current_user_role() IN ('admin','vet'));

CREATE POLICY "exams staff update"
    ON public.exams FOR UPDATE
    USING (public.current_user_role() IN ('admin','vet'));

CREATE POLICY "exams admin delete"
    ON public.exams FOR DELETE
    USING (public.current_user_role() = 'admin');


-- notifications: cada user só vê as suas
CREATE POLICY "notifications own read"
    ON public.notifications FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "notifications own update"
    ON public.notifications FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "notifications staff insert"
    ON public.notifications FOR INSERT
    WITH CHECK (public.current_user_role() IN ('admin','vet') OR user_id = auth.uid());

CREATE POLICY "notifications admin delete"
    ON public.notifications FOR DELETE
    USING (public.current_user_role() = 'admin' OR user_id = auth.uid());


-- ═══════════════════════════ TRIGGERS AUTOMÁTICOS ═══════════════════════════

-- Ao criar um booking, notifica o staff (admin+vet)
CREATE OR REPLACE FUNCTION public.notify_staff_on_new_booking()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    SELECT
        p.id,
        'booking_new',
        'Novo agendamento recebido',
        'Serviço: ' || NEW.service || ' — ' || to_char(NEW.requested_date, 'DD/MM/YYYY') || ' às ' || NEW.requested_time,
        '/vet/agenda'
    FROM public.profiles p
    WHERE p.role IN ('admin','vet');
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_booking_created ON public.bookings;
CREATE TRIGGER on_booking_created
    AFTER INSERT ON public.bookings
    FOR EACH ROW EXECUTE FUNCTION public.notify_staff_on_new_booking();


-- Ao mudar status de booking, notifica o dono do pet
CREATE OR REPLACE FUNCTION public.notify_owner_on_booking_status()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_title TEXT;
    v_body  TEXT;
BEGIN
    IF OLD.status = NEW.status THEN RETURN NEW; END IF;

    v_body := 'Serviço: ' || NEW.service || ' em ' || to_char(NEW.requested_date, 'DD/MM/YYYY') || ' às ' || NEW.requested_time;

    IF NEW.status = 'confirmed' THEN
        v_title := 'Agendamento confirmado';
    ELSIF NEW.status = 'cancelled' THEN
        v_title := 'Agendamento cancelado';
    ELSIF NEW.status = 'done' THEN
        v_title := 'Atendimento concluído';
    ELSE
        RETURN NEW;
    END IF;

    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (NEW.owner_id, 'booking_status', v_title, v_body, '/bookings');
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_booking_status_changed ON public.bookings;
CREATE TRIGGER on_booking_status_changed
    AFTER UPDATE OF status ON public.bookings
    FOR EACH ROW EXECUTE FUNCTION public.notify_owner_on_booking_status();


-- Ao criar uma consulta, notifica o tutor
CREATE OR REPLACE FUNCTION public.notify_owner_on_consultation()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (
        NEW.owner_id,
        'consultation_new',
        'Novo prontuário disponível',
        COALESCE(NEW.reason, 'Consulta registrada') || ' — acesse a carteirinha do pet para ver detalhes',
        '/dashboard/pet/' || NEW.pet_id
    );
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_consultation_created ON public.consultations;
CREATE TRIGGER on_consultation_created
    AFTER INSERT ON public.consultations
    FOR EACH ROW EXECUTE FUNCTION public.notify_owner_on_consultation();


-- Ao criar uma receita, notifica o tutor
CREATE OR REPLACE FUNCTION public.notify_owner_on_prescription()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (
        NEW.owner_id,
        'prescription_new',
        'Nova receita disponível',
        'Uma receita foi emitida para o seu pet. Acesse o prontuário para visualizar.',
        '/dashboard/pet/' || NEW.pet_id
    );
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_prescription_created ON public.prescriptions;
CREATE TRIGGER on_prescription_created
    AFTER INSERT ON public.prescriptions
    FOR EACH ROW EXECUTE FUNCTION public.notify_owner_on_prescription();


-- Ao criar um exame, notifica o tutor
CREATE OR REPLACE FUNCTION public.notify_owner_on_exam()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (
        NEW.owner_id,
        'exam_new',
        'Novo exame solicitado',
        NEW.type || ' — acompanhe o status no prontuário do pet.',
        '/dashboard/pet/' || NEW.pet_id
    );
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_exam_created ON public.exams;
CREATE TRIGGER on_exam_created
    AFTER INSERT ON public.exams
    FOR EACH ROW EXECUTE FUNCTION public.notify_owner_on_exam();


-- Ao concluir um exame, notifica o tutor
CREATE OR REPLACE FUNCTION public.notify_owner_on_exam_completed()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    IF OLD.status != 'completed' AND NEW.status = 'completed' THEN
        INSERT INTO public.notifications (user_id, type, title, body, link)
        VALUES (
            NEW.owner_id,
            'exam_completed',
            'Resultado de exame disponível',
            NEW.type || ' — resultado pronto para visualização.',
            '/dashboard/pet/' || NEW.pet_id
        );
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_exam_completed ON public.exams;
CREATE TRIGGER on_exam_completed
    AFTER UPDATE OF status ON public.exams
    FOR EACH ROW EXECUTE FUNCTION public.notify_owner_on_exam_completed();
