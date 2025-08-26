
-- 启用向量扩展
CREATE EXTENSION IF NOT EXISTS vector;

-- 创建知识分类枚举
CREATE TYPE knowledge_category AS ENUM (
  'school_info',      -- 学校信息
  'major_info',       -- 专业信息
  'admission_data',   -- 录取数据
  'policy_analysis',  -- 政策解读
  'experience_guide', -- 经验指导
  'employment_data'   -- 就业数据
);

-- 创建知识重要性枚举
CREATE TYPE knowledge_importance AS ENUM ('low', 'medium', 'high', 'critical');

-- 升级知识单元表，添加向量和分类字段
ALTER TABLE knowledge_units 
ADD COLUMN IF NOT EXISTS category knowledge_category DEFAULT 'experience_guide',
ADD COLUMN IF NOT EXISTS importance knowledge_importance DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS embedding vector(1536),
ADD COLUMN IF NOT EXISTS keywords TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS entities JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS confidence_score FLOAT DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS region TEXT,
ADD COLUMN IF NOT EXISTS year INTEGER,
ADD COLUMN IF NOT EXISTS school_names TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS major_names TEXT[] DEFAULT '{}';

-- 创建向量搜索索引
CREATE INDEX IF NOT EXISTS knowledge_units_embedding_idx ON knowledge_units 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- 创建分类和重要性索引
CREATE INDEX IF NOT EXISTS knowledge_units_category_idx ON knowledge_units (category);
CREATE INDEX IF NOT EXISTS knowledge_units_importance_idx ON knowledge_units (importance);
CREATE INDEX IF NOT EXISTS knowledge_units_region_idx ON knowledge_units (region);
CREATE INDEX IF NOT EXISTS knowledge_units_year_idx ON knowledge_units (year);

-- 创建学校和专业名称的GIN索引
CREATE INDEX IF NOT EXISTS knowledge_units_school_names_idx ON knowledge_units USING GIN (school_names);
CREATE INDEX IF NOT EXISTS knowledge_units_major_names_idx ON knowledge_units USING GIN (major_names);
CREATE INDEX IF NOT EXISTS knowledge_units_keywords_idx ON knowledge_units USING GIN (keywords);

-- 创建RAG查询日志表
CREATE TABLE IF NOT EXISTS rag_query_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  query TEXT NOT NULL,
  retrieved_units_count INTEGER DEFAULT 0,
  response TEXT,
  response_quality_score FLOAT,
  user_feedback INTEGER CHECK (user_feedback >= 1 AND user_feedback <= 5),
  processing_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 创建向量搜索函数
CREATE OR REPLACE FUNCTION search_knowledge_units(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10,
  filter_category knowledge_category DEFAULT NULL,
  filter_importance knowledge_importance DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  content text,
  category knowledge_category,
  importance knowledge_importance,
  labels text[],
  school_names text[],
  major_names text[],
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ku.id,
    ku.content,
    ku.category,
    ku.importance,
    ku.labels,
    ku.school_names,
    ku.major_names,
    1 - (ku.embedding <=> query_embedding) as similarity
  FROM knowledge_units ku
  WHERE 
    ku.embedding IS NOT NULL
    AND (filter_category IS NULL OR ku.category = filter_category)
    AND (filter_importance IS NULL OR ku.importance = filter_importance)
    AND 1 - (ku.embedding <=> query_embedding) > match_threshold
  ORDER BY ku.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 启用RLS
ALTER TABLE rag_query_logs ENABLE ROW LEVEL SECURITY;

-- 创建公开访问策略（用于演示，生产环境需要更严格的策略）
CREATE POLICY "Allow all operations for now" ON rag_query_logs FOR ALL USING (true);
