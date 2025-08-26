-- 修复向量搜索函数的重载冲突问题

-- 1. 删除所有现有的 search_travel_knowledge 函数
DROP FUNCTION IF EXISTS search_travel_knowledge(vector, float, int);
DROP FUNCTION IF EXISTS search_travel_knowledge(vector, float, int, text, text);

-- 2. 重新创建唯一的向量搜索函数
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
    fk.embedding IS NOT NULL
    AND (1 - (fk.embedding <=> query_embedding)) > match_threshold
    AND (filter_category IS NULL OR fk.category = filter_category)
    AND (filter_location IS NULL OR fk.location ILIKE '%' || filter_location || '%')
  ORDER BY fk.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 3. 重新创建索引
DROP INDEX IF EXISTS idx_formolly_travel_knowledge_embedding;
CREATE INDEX idx_formolly_travel_knowledge_embedding ON formolly_travel_knowledge USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- 4. 为没有向量的记录重新生成向量（设置标记）
UPDATE formolly_travel_knowledge 
SET updated_at = now() 
WHERE embedding IS NULL;

-- 显示统计信息
SELECT 
  COUNT(*) as total_records,
  COUNT(embedding) as records_with_embedding,
  COUNT(*) - COUNT(embedding) as records_without_embedding
FROM formolly_travel_knowledge;
