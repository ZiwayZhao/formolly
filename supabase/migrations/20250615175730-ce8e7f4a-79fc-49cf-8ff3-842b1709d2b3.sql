
-- 更新数据库函数，移除从数据库触发的后台调用。
-- 新的流程将由客户端在数据更新成功后，直接调用后台服务。
CREATE OR REPLACE FUNCTION public.trigger_handle_knowledge_unit_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- 检查作为向量生成来源的 `content` 或 `entities` 字段是否发生变化
  IF NEW.content IS DISTINCT FROM OLD.content OR NEW.entities IS DISTINCT FROM OLD.entities THEN
    -- 如果有变化，则重置向量相关字段，为重新生成做准备。
    -- Edge Function 的调用将由客户端处理。
    NEW.embedding := NULL;
    NEW.embedding_status := 'pending'::public.embedding_status_type;
    NEW.embedding_error := NULL;
  END IF;
  RETURN NEW;
END;
$$;
