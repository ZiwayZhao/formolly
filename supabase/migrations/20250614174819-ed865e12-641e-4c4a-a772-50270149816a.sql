
-- 扩展 source_documents 表中 file_type 字段的长度限制
ALTER TABLE public.source_documents 
ALTER COLUMN file_type TYPE VARCHAR(100);

-- 同时检查并修复可能存在的其他长度限制问题
-- 确保 processing_status 字段也有足够的长度
ALTER TABLE public.source_documents 
ALTER COLUMN processing_status TYPE VARCHAR(50);
