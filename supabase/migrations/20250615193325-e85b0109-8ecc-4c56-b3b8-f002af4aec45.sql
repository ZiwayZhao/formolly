
-- 数据库结构重大升级脚本
-- 该脚本将移除旧的文档处理相关表和数据，
-- 为直接导入高质量的Q&A和JSON数据做好准备。

-- 步骤 1: 删除与旧的非结构化文档处理相关的表。
-- CASCADE 选项会自动处理外键等依赖关系。
DROP TABLE IF EXISTS public.source_documents CASCADE;
DROP TABLE IF EXISTS public.knowledge_unit_sources CASCADE;

-- 步骤 2: 删除与Excel导入相关的 `school_programs` 表。
-- 新的JSON导入流程将取代其功能。
DROP TABLE IF EXISTS public.school_programs CASCADE;

-- 步骤 3: 从“火种属性”表中移除对已删除文档的引用。
ALTER TABLE public.academic_track_attributes DROP COLUMN IF EXISTS source_document_id;
ALTER TABLE public.career_track_attributes DROP COLUMN IF EXISTS source_document_id;

-- 步骤 4: 清理并重构核心的 `knowledge_units` 表。
ALTER TABLE public.knowledge_units
  DROP COLUMN IF EXISTS source_type,
  DROP COLUMN IF EXISTS source_url,
  DROP COLUMN IF EXISTS confidence_score,
  DROP COLUMN IF EXISTS hypothetical_question,
  DROP COLUMN IF EXISTS title;

-- 步骤 5: 新增一个 `data_type` 列，用于区分数据是“问答对”还是“JSON对象”。
-- 这对于后续优化RAG检索流程至关重要。
ALTER TABLE public.knowledge_units
  ADD COLUMN IF NOT EXISTS data_type VARCHAR(20) CHECK (data_type IN ('qa', 'json_object'));

-- 步骤 6: 根据您的要求，清空所有现存的知识单元，为新数据腾出空间。
TRUNCATE TABLE public.knowledge_units RESTART IDENTITY CASCADE;

