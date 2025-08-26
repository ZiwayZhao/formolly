
-- Allow 'document' as a valid source_type in the knowledge_units table
ALTER TABLE public.knowledge_units DROP CONSTRAINT IF EXISTS knowledge_units_source_type_check;
ALTER TABLE public.knowledge_units ADD CONSTRAINT knowledge_units_source_type_check CHECK (source_type IN ('html', 'pdf', 'image', 'document'));
