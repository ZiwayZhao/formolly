
-- 创建知识单元表，存储处理后的知识片段
CREATE TABLE public.knowledge_units (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  source_type VARCHAR(20) NOT NULL CHECK (source_type IN ('html', 'pdf', 'image')),
  source_name TEXT NOT NULL,
  source_url TEXT,
  labels TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 创建原始文档表，存储上传的原始文件信息
CREATE TABLE public.source_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  filename TEXT NOT NULL,
  file_type VARCHAR(10) NOT NULL,
  file_size INTEGER,
  storage_path TEXT NOT NULL,
  processing_status VARCHAR(20) DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  extracted_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- 创建知识单元与原始文档的关联表
CREATE TABLE public.knowledge_unit_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  knowledge_unit_id UUID REFERENCES public.knowledge_units(id) ON DELETE CASCADE,
  source_document_id UUID REFERENCES public.source_documents(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 创建索引提高查询性能
CREATE INDEX idx_knowledge_units_labels ON public.knowledge_units USING GIN (labels);
CREATE INDEX idx_knowledge_units_source_type ON public.knowledge_units (source_type);
CREATE INDEX idx_source_documents_status ON public.source_documents (processing_status);

-- 启用行级安全
ALTER TABLE public.knowledge_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.source_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_unit_sources ENABLE ROW LEVEL SECURITY;

-- 创建管理员访问策略（暂时允许所有操作，后续可以根据需要添加身份验证）
CREATE POLICY "Allow all operations for now" ON public.knowledge_units FOR ALL USING (true);
CREATE POLICY "Allow all operations for now" ON public.source_documents FOR ALL USING (true);
CREATE POLICY "Allow all operations for now" ON public.knowledge_unit_sources FOR ALL USING (true);

-- 创建存储桶用于文件上传
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

-- 创建存储桶访问策略
CREATE POLICY "Allow document uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'documents');
CREATE POLICY "Allow document access" ON storage.objects FOR SELECT USING (bucket_id = 'documents');
CREATE POLICY "Allow document updates" ON storage.objects FOR UPDATE USING (bucket_id = 'documents');
CREATE POLICY "Allow document deletions" ON storage.objects FOR DELETE USING (bucket_id = 'documents');
