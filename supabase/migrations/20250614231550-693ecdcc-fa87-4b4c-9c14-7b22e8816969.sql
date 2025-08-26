
-- 1. 创建一个新的 ENUM 类型来表示向量化状态
CREATE TYPE public.embedding_status_type AS ENUM ('pending', 'processing', 'completed', 'failed');

-- 2. 向 knowledge_units 表中添加状态和错误信息字段
ALTER TABLE public.knowledge_units
ADD COLUMN IF NOT EXISTS embedding_status public.embedding_status_type NOT NULL DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS embedding_error TEXT;

-- 3. 为已存在的知识单元设置初始状态
-- 如果已经有向量，则视为已完成；否则视为待处理
UPDATE public.knowledge_units
SET embedding_status = CASE
  WHEN embedding IS NOT NULL THEN 'completed'::public.embedding_status_type
  ELSE 'pending'::public.embedding_status_type
END
WHERE embedding_status = 'pending';


-- 4. 为 knowledge_units 表启用行级别复制，这是实时功能所必需的
ALTER TABLE public.knowledge_units REPLICA IDENTITY FULL;

-- 5. 将 knowledge_units 表添加到实时广播出版物中
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.knowledge_units;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Table public.knowledge_units is already in publication supabase_realtime.';
END;
$$;
