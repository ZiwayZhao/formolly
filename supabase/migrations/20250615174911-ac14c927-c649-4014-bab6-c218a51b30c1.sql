
-- 创建一个新的数据库函数，用于在知识单元更新时触发向量重新生成
CREATE OR REPLACE FUNCTION public.trigger_handle_knowledge_unit_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- 检查作为向量生成来源的 `content` 或 `entities` 字段是否发生变化
  IF NEW.content IS DISTINCT FROM OLD.content OR NEW.entities IS DISTINCT FROM OLD.entities THEN
    -- 如果有变化，则重置向量相关字段，为重新生成做准备
    NEW.embedding := NULL;
    NEW.embedding_status := 'pending'::public.embedding_status_type;
    NEW.embedding_error := NULL;

    -- 异步调用后台的 Edge Function 来生成新的向量
    PERFORM net.http_post(
      url := 'https://szjyrlafyvfwchzhggnt.supabase.co/functions/v1/generate-embeddings',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6anlybGFmeXZmd2NoemhnZ250Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MDIxNjIsImV4cCI6MjA2NTQ3ODE2Mn0.ixLaXPcdDZASjqL6Up3omRZUygGHvM4wf2j1DDOdWDY"}'::jsonb,
      body := jsonb_build_object('knowledgeUnitId', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$;

-- 创建一个触发器，在`knowledge_units`表每次有数据更新时，执行上面的函数
CREATE TRIGGER on_knowledge_unit_content_update
  BEFORE UPDATE ON public.knowledge_units
  FOR EACH ROW
  EXECUTE PROCEDURE public.trigger_handle_knowledge_unit_update();
