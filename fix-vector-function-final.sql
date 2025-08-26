-- 最终修复向量搜索函数的数据类型问题

-- 1. 删除现有函数
DROP FUNCTION IF EXISTS search_travel_knowledge(vector, float, int, text, text);

-- 2. 检查表结构
SELECT column_name, data_type, character_maximum_length 
FROM information_schema.columns 
WHERE table_name = 'formolly_travel_knowledge' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. 重新创建函数，确保数据类型匹配
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
    CAST(fk.category AS TEXT),
    CAST(fk.location AS TEXT),
    fk.tags,
    CAST(1 - (fk.embedding <=> query_embedding) AS FLOAT) AS similarity
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
