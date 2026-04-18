-- ════════════════════════════════════════════════════════════════
--  STORAGE: buckets públicos para avatares e fotos de pets
-- ════════════════════════════════════════════════════════════════

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
    ('pets',    'pets',    true,  5242880, ARRAY['image/jpeg','image/png','image/webp','image/gif']),
    ('avatars', 'avatars', true,  2097152, ARRAY['image/jpeg','image/png','image/webp']),
    ('exams',   'exams',   true, 10485760, ARRAY['image/jpeg','image/png','image/webp','application/pdf'])
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ─── Policies: pets bucket ──────────────────────────────────────
DROP POLICY IF EXISTS "pets public read"    ON storage.objects;
DROP POLICY IF EXISTS "pets auth upload"    ON storage.objects;
DROP POLICY IF EXISTS "pets auth update"    ON storage.objects;
DROP POLICY IF EXISTS "pets auth delete"    ON storage.objects;

CREATE POLICY "pets public read"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'pets');

CREATE POLICY "pets auth upload"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'pets');

CREATE POLICY "pets auth update"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'pets');

CREATE POLICY "pets auth delete"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'pets');

-- ─── Policies: avatars bucket ───────────────────────────────────
DROP POLICY IF EXISTS "avatars public read" ON storage.objects;
DROP POLICY IF EXISTS "avatars auth upload" ON storage.objects;
DROP POLICY IF EXISTS "avatars auth update" ON storage.objects;
DROP POLICY IF EXISTS "avatars auth delete" ON storage.objects;

CREATE POLICY "avatars public read"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');

CREATE POLICY "avatars auth upload"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "avatars auth update"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'avatars' AND owner = auth.uid());

CREATE POLICY "avatars auth delete"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'avatars' AND owner = auth.uid());

-- ─── Policies: exams bucket ─────────────────────────────────────
DROP POLICY IF EXISTS "exams public read"   ON storage.objects;
DROP POLICY IF EXISTS "exams staff upload"  ON storage.objects;
DROP POLICY IF EXISTS "exams staff update"  ON storage.objects;
DROP POLICY IF EXISTS "exams staff delete"  ON storage.objects;

CREATE POLICY "exams public read"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'exams');

CREATE POLICY "exams staff upload"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'exams');

CREATE POLICY "exams staff update"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'exams');

CREATE POLICY "exams staff delete"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'exams');
