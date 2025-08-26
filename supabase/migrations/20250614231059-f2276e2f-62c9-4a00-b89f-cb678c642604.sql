
-- 这段 SQL 创建了一个数据库函数和一个触发器。
-- 函数的作用是调用一个后台服务，为新的知识单元生成向量。
-- 触发器的作用是，在任何新的知识单元被添加到数据库后，自动执行这个函数。

-- 1. 创建一个函数，用于调用向量生成服务
create or replace function public.trigger_generate_embeddings_on_insert()
returns trigger
language plpgsql
as $$
begin
  -- 使用 pg_net 插件进行一个非阻塞的 HTTP POST 请求
  -- 这会通知后台服务为新创建的知识单元生成向量
  perform net.http_post(
    url:='https://szjyrlafyvfwchzhggnt.supabase.co/functions/v1/generate-embeddings',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6anlybGFmeXZmd2NoemhnZ250Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MDIxNjIsImV4cCI6MjA2NTQ3ODE2Mn0.ixLaXPcdDZASjqL6Up3omRZUygGHvM4wf2j1DDOdWDY"}'::jsonb,
    body:=jsonb_build_object('knowledgeUnitId', new.id)
  );
  return new;
end;
$$;

-- 2. 创建一个触发器，在有新知识单元插入时触发上述函数
create trigger on_new_knowledge_unit_insert
  after insert on public.knowledge_units
  for each row
  execute procedure public.trigger_generate_embeddings_on_insert();
