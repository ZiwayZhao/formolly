-- 创建向量搜索函数
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

-- 验证函数创建
SELECT 'Vector search function created successfully!' AS status;
