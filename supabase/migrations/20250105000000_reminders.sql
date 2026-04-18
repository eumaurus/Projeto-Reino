-- ════════════════════════════════════════════════════════════════
--  LEMBRETES AUTOMÁTICOS via pg_cron
--  - Vacinas vencendo em 7 dias (diário às 09:00)
--  - Consulta de amanhã (diário às 18:00)
--  - Marca bookings vencidos como 'cancelled' (hourly)
-- ════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ─── Função: lembretes de vacina vencendo em 7 dias ────────
CREATE OR REPLACE FUNCTION public.generate_vaccine_reminders()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    r RECORD;
    v JSONB;
    due_date DATE;
BEGIN
    FOR r IN SELECT id, owner_id, name, vaccines FROM public.pets
    LOOP
        FOR v IN SELECT * FROM jsonb_array_elements(r.vaccines)
        LOOP
            BEGIN
                due_date := (v->>'nextDue')::DATE;
            EXCEPTION WHEN OTHERS THEN
                CONTINUE;
            END;

            IF due_date IS NULL THEN CONTINUE; END IF;

            -- Notifica quando faltar exatamente 7 dias
            IF due_date = CURRENT_DATE + INTERVAL '7 days' THEN
                -- Evita duplicar: só insere se ainda não houver notificação idêntica hoje
                IF NOT EXISTS (
                    SELECT 1 FROM public.notifications n
                    WHERE n.user_id = r.owner_id
                      AND n.type = 'vaccine_reminder'
                      AND n.body LIKE '%' || (v->>'name') || '%' || r.name || '%'
                      AND n.created_at::date = CURRENT_DATE
                ) THEN
                    INSERT INTO public.notifications (user_id, type, title, body, link)
                    VALUES (
                        r.owner_id,
                        'vaccine_reminder',
                        'Lembrete de vacina',
                        'A vacina ' || (v->>'name') || ' do ' || r.name || ' vence em 7 dias (' || to_char(due_date, 'DD/MM/YYYY') || '). Agende o reforço.',
                        '/booking?petId=' || r.id
                    );
                END IF;
            END IF;
        END LOOP;
    END LOOP;
END;
$$;

-- ─── Função: lembrete de consulta de amanhã ────────────────
CREATE OR REPLACE FUNCTION public.generate_tomorrow_booking_reminders()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    SELECT
        b.owner_id,
        'booking_tomorrow',
        'Lembrete: agendamento amanhã',
        'Você tem ' || b.service || ' amanhã às ' || b.requested_time || '.',
        '/bookings'
    FROM public.bookings b
    WHERE b.status IN ('pending','confirmed')
      AND b.requested_date = CURRENT_DATE + INTERVAL '1 day'
      AND NOT EXISTS (
          SELECT 1 FROM public.notifications n
          WHERE n.user_id = b.owner_id
            AND n.type = 'booking_tomorrow'
            AND n.created_at::date = CURRENT_DATE
      );
END;
$$;

-- ─── Função: cancelar bookings vencidos ────────────────────
CREATE OR REPLACE FUNCTION public.auto_expire_bookings()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    UPDATE public.bookings
    SET status = 'cancelled',
        cancelled_reason = 'Expirado sem confirmação'
    WHERE status = 'pending'
      AND requested_date < CURRENT_DATE;
END;
$$;

-- ─── Agendamentos (pg_cron) ──────────────────────────────
-- Remove jobs anteriores com mesmo nome para reexecutar com segurança
DO $$
DECLARE j RECORD;
BEGIN
    FOR j IN SELECT jobid, jobname FROM cron.job WHERE jobname IN (
        'reino-vaccine-reminders',
        'reino-tomorrow-reminders',
        'reino-auto-expire'
    ) LOOP
        PERFORM cron.unschedule(j.jobid);
    END LOOP;
END $$;

-- Roda todo dia às 09:00 (horário do servidor)
SELECT cron.schedule(
    'reino-vaccine-reminders',
    '0 9 * * *',
    $$SELECT public.generate_vaccine_reminders();$$
);

-- Roda todo dia às 18:00
SELECT cron.schedule(
    'reino-tomorrow-reminders',
    '0 18 * * *',
    $$SELECT public.generate_tomorrow_booking_reminders();$$
);

-- Roda a cada hora
SELECT cron.schedule(
    'reino-auto-expire',
    '0 * * * *',
    $$SELECT public.auto_expire_bookings();$$
);
