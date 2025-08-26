-- Formolly 项目专属数据库设置
-- 为 Molly 的欧洲旅行攻略网站创建数据表

-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. 开屏须知表
CREATE TABLE IF NOT EXISTS formolly_welcome_notice (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL DEFAULT 'Welcome to Formolly',
    content TEXT NOT NULL DEFAULT '欢迎来到Formolly - 你的欧洲旅行助手！这里有Ziway为Molly精心准备的欧洲生活和旅行经验分享。',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. 旅行知识库表 (基于原有 knowledge_units 表结构，但专门用于旅行攻略)
CREATE TABLE IF NOT EXISTS formolly_travel_knowledge (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    entities JSONB, -- 存储问答对或结构化数据
    source_name TEXT NOT NULL,
    data_type VARCHAR(20) DEFAULT 'qa' CHECK (data_type IN ('qa', 'json_object', 'text')),
    category VARCHAR(50) DEFAULT 'travel_guide' CHECK (category IN ('travel_guide', 'living_tips', 'food_culture', 'transportation', 'accommodation', 'emergency', 'language', 'shopping', 'sightseeing', 'general')),
    location TEXT, -- 地理位置标签，如 'Paris', 'Berlin', 'Europe'
    tags TEXT[] DEFAULT '{}', -- 标签数组，如 ['budget', 'family-friendly', 'solo-travel']
    embedding VECTOR(1536), -- OpenAI embeddings
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. 云盘文件表
CREATE TABLE IF NOT EXISTS formolly_cloud_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    storage_path TEXT NOT NULL,
    description TEXT,
    tags TEXT[] DEFAULT '{}',
    is_public BOOLEAN DEFAULT false, -- 是否公开访问
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. 聊天历史表 (可选，用于记录与Ziway的对话)
CREATE TABLE IF NOT EXISTS formolly_chat_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    message TEXT NOT NULL,
    response TEXT,
    sources JSONB, -- 引用的知识来源
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 创建向量搜索函数 (基于原有的 search_knowledge_units 函数)
CREATE OR REPLACE FUNCTION search_travel_knowledge(
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 10,
  filter_category TEXT DEFAULT NULL,
  filter_location TEXT DEFAULT NULL
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
  WHERE 
    (1 - (fk.embedding <=> query_embedding)) > match_threshold
    AND (filter_category IS NULL OR fk.category = filter_category)
    AND (filter_location IS NULL OR fk.location ILIKE '%' || filter_location || '%')
  ORDER BY fk.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 创建索引提高查询性能
CREATE INDEX IF NOT EXISTS idx_formolly_travel_knowledge_embedding ON formolly_travel_knowledge USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_formolly_travel_knowledge_category ON formolly_travel_knowledge (category);
CREATE INDEX IF NOT EXISTS idx_formolly_travel_knowledge_location ON formolly_travel_knowledge (location);
CREATE INDEX IF NOT EXISTS idx_formolly_travel_knowledge_tags ON formolly_travel_knowledge USING gin (tags);
CREATE INDEX IF NOT EXISTS idx_formolly_cloud_files_filename ON formolly_cloud_files (filename);
CREATE INDEX IF NOT EXISTS idx_formolly_cloud_files_type ON formolly_cloud_files (file_type);
CREATE INDEX IF NOT EXISTS idx_formolly_chat_history_session ON formolly_chat_history (session_id);

-- 创建存储桶用于云盘文件
INSERT INTO storage.buckets (id, name, public) 
VALUES ('formolly-files', 'formolly-files', true)
ON CONFLICT (id) DO NOTHING;

-- 启用行级安全 (但设置为开放策略，因为不需要用户认证)
ALTER TABLE formolly_welcome_notice ENABLE ROW LEVEL SECURITY;
ALTER TABLE formolly_travel_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE formolly_cloud_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE formolly_chat_history ENABLE ROW LEVEL SECURITY;

-- 创建开放访问策略 (所有人都可以访问)
CREATE POLICY "Allow all access to welcome notice" ON formolly_welcome_notice FOR ALL USING (true);
CREATE POLICY "Allow all access to travel knowledge" ON formolly_travel_knowledge FOR ALL USING (true);
CREATE POLICY "Allow all access to cloud files" ON formolly_cloud_files FOR ALL USING (true);
CREATE POLICY "Allow all access to chat history" ON formolly_chat_history FOR ALL USING (true);

-- 创建存储桶访问策略
CREATE POLICY "Allow public file uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'formolly-files');
CREATE POLICY "Allow public file access" ON storage.objects FOR SELECT USING (bucket_id = 'formolly-files');
CREATE POLICY "Allow public file updates" ON storage.objects FOR UPDATE USING (bucket_id = 'formolly-files');
CREATE POLICY "Allow public file deletions" ON storage.objects FOR DELETE USING (bucket_id = 'formolly-files');

-- 插入默认开屏须知
INSERT INTO formolly_welcome_notice (title, content) 
VALUES (
    'Welcome to Formolly - Molly的欧洲旅行助手',
    '🌍 欢迎来到Formolly！

我是Ziway，你的AI旅行助手。我为Molly精心准备了丰富的欧洲生活和旅行经验，包括：

✈️ 旅行攻略与路线规划
🏨 住宿与交通指南  
🍽️ 美食文化体验
🛍️ 购物与实用信息
🚨 紧急情况处理
🗣️ 语言沟通技巧

你可以：
- 💬 随时向我提问，获取个性化的旅行建议
- 📁 使用云盘功能上传下载旅行文件
- 📚 浏览我整理的欧洲生活知识库

让我们一起探索美丽的欧洲吧！🎉'
)
ON CONFLICT DO NOTHING;

-- 创建自动更新 updated_at 字段的函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为相关表创建自动更新触发器
CREATE TRIGGER update_formolly_welcome_notice_updated_at BEFORE UPDATE ON formolly_welcome_notice FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_formolly_travel_knowledge_updated_at BEFORE UPDATE ON formolly_travel_knowledge FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_formolly_cloud_files_updated_at BEFORE UPDATE ON formolly_cloud_files FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
