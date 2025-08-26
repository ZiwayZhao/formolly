
-- Create the 'documents' storage bucket if it doesn't exist.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('documents', 'documents', false, 52428800, ARRAY['application/pdf', 'text/html', 'image/png', 'image/jpeg', 'image/jpg'])
ON CONFLICT (id) DO NOTHING;

-- Drop policies first to ensure a clean state
DROP POLICY IF EXISTS "Allow document uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow document access" ON storage.objects;
DROP POLICY IF EXISTS "Allow document updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow document deletions" ON storage.objects;

-- Create basic policies for authenticated users
CREATE POLICY "Allow document uploads" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Allow document access" ON storage.objects
FOR SELECT TO authenticated USING (bucket_id = 'documents');

CREATE POLICY "Allow document updates" ON storage.objects
FOR UPDATE TO authenticated USING (bucket_id = 'documents');

CREATE POLICY "Allow document deletions" ON storage.objects
FOR DELETE TO authenticated USING (bucket_id = 'documents');
