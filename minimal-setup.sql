-- 最小化Formolly设置脚本
-- 在 https://supabase.com/dashboard/project/ijrbyfpesocafkkwmfht/sql 中执行

-- 启用vector扩展
CREATE EXTENSION IF NOT EXISTS vector;

-- 创建核心表
CREATE TABLE formolly_welcome_notice (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL DEFAULT 'Welcome to Formolly',
    content TEXT NOT NULL DEFAULT '欢迎来到Formolly！',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE formolly_travel_knowledge (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    entities JSONB,
    source_name TEXT NOT NULL,
    data_type VARCHAR(20) DEFAULT 'qa',
    category VARCHAR(50) DEFAULT 'travel_guide',
    location TEXT,
    tags TEXT[] DEFAULT '{}',
    embedding VECTOR(1536),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE formolly_cloud_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    storage_path TEXT NOT NULL,
    description TEXT,
    tags TEXT[] DEFAULT '{}',
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE formolly_chat_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    message TEXT NOT NULL,
    response TEXT,
    sources JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 创建存储桶
INSERT INTO storage.buckets (id, name, public) 
VALUES ('formolly-files', 'formolly-files', true)
ON CONFLICT (id) DO NOTHING;

-- 设置开放访问策略
ALTER TABLE formolly_welcome_notice ENABLE ROW LEVEL SECURITY;
ALTER TABLE formolly_travel_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE formolly_cloud_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE formolly_chat_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access" ON formolly_welcome_notice FOR ALL USING (true);
CREATE POLICY "Allow all access" ON formolly_travel_knowledge FOR ALL USING (true);
CREATE POLICY "Allow all access" ON formolly_cloud_files FOR ALL USING (true);
CREATE POLICY "Allow all access" ON formolly_chat_history FOR ALL USING (true);

-- 存储桶策略
CREATE POLICY "Allow public uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'formolly-files');
CREATE POLICY "Allow public access" ON storage.objects FOR SELECT USING (bucket_id = 'formolly-files');
CREATE POLICY "Allow public updates" ON storage.objects FOR UPDATE USING (bucket_id = 'formolly-files');
CREATE POLICY "Allow public deletes" ON storage.objects FOR DELETE USING (bucket_id = 'formolly-files');

-- 插入欢迎信息
INSERT INTO formolly_welcome_notice (title, content) 
VALUES ('Welcome to Formolly', '🌍 欢迎来到Formolly！我是Ziway，你的AI旅行助手！');

-- 创建搜索函数
CREATE OR REPLACE FUNCTION search_travel_knowledge(
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  entities JSONB,
  source_name TEXT,
  category TEXT,
  location TEXT,
  tags TEXT[],
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    fk.id,
    fk.content,
    fk.entities,
    fk.source_name,
    fk.category,
    fk.location,
    fk.tags,
    1 - (fk.embedding <=> query_embedding) AS similarity
  FROM formolly_travel_knowledge fk
  WHERE (1 - (fk.embedding <=> query_embedding)) > match_threshold
  ORDER BY fk.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
