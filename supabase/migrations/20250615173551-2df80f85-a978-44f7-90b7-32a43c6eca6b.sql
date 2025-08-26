
-- 步骤 1: 为 academic_tracks 表添加一个 program_id 外键列，关联到 school_programs 表
-- 这个外键允许我们将每个“火种”明确关联到一个“学校-专业”条目上
-- ON DELETE SET NULL 意味着如果一个学校专业被删除，相关的火种不会被删除，只是关联会断开
ALTER TABLE public.academic_tracks
ADD COLUMN IF NOT EXISTS program_id UUID REFERENCES public.school_programs(id) ON DELETE SET NULL;

-- 步骤 2: 为新的 program_id 列创建索引，以提高查询效率
CREATE INDEX IF NOT EXISTS idx_academic_tracks_program_id ON public.academic_tracks(program_id);

-- 步骤 3: 尝试为现有的火种数据回填 program_id
-- 这个操作会根据学校名称和专业名称，在 school_programs 表中查找匹配项
-- 并将找到的 program ID 填充到 academic_tracks 表中。这是一个尽力而为的操作，
-- 未能匹配的现有火种，其 program_id 将保持为 NULL，后续可以手动关联。
UPDATE public.academic_tracks at
SET program_id = sp.id
FROM public.school_programs sp
WHERE at.school_name = sp.school_name 
  AND at.major_name = sp.program_name
  AND at.program_id IS NULL;
