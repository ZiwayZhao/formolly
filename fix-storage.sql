-- 修复Formolly存储桶问题
-- 在 https://supabase.com/dashboard/project/ijrbyfpesocafkkwmfht/sql 中执行

-- 创建存储桶（如果不存在）
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES ('formolly-files', 'formolly-files', true, 52428800, NULL)
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = 52428800;

-- 删除现有策略（如果存在）
DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access" ON storage.objects;
DROP POLICY IF EXISTS "Allow public updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow public deletes" ON storage.objects;

-- 创建新的存储桶策略
CREATE POLICY "Allow public file uploads" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'formolly-files');

CREATE POLICY "Allow public file access" ON storage.objects 
FOR SELECT USING (bucket_id = 'formolly-files');

CREATE POLICY "Allow public file updates" ON storage.objects 
FOR UPDATE USING (bucket_id = 'formolly-files');

CREATE POLICY "Allow public file deletions" ON storage.objects 
FOR DELETE USING (bucket_id = 'formolly-files');

-- 验证存储桶创建
SELECT id, name, public, file_size_limit FROM storage.buckets WHERE name = 'formolly-files';
