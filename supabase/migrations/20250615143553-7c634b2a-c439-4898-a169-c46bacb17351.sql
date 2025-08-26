
-- 首先，我们将为升学火种和求职火种创建新的“属性”表。
-- 这将允许我们存储多个、有版本的、可单独审核的数据点。

-- 1. 为“升学火种”创建属性表
CREATE TABLE public.academic_track_attributes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    track_id UUID NOT NULL REFERENCES public.academic_tracks(id) ON DELETE CASCADE,
    attribute_name TEXT NOT NULL,
    attribute_value TEXT NOT NULL,
    source_document_id UUID REFERENCES public.source_documents(id) ON DELETE SET NULL,
    year INT,
    status contribution_status NOT NULL DEFAULT 'pending',
    submitted_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_academic_attribute_per_source UNIQUE(track_id, attribute_name, source_document_id, attribute_value)
);
COMMENT ON TABLE public.academic_track_attributes IS '存储升学火种的各个数据点，支持多值和历史记录。';
COMMENT ON COLUMN public.academic_track_attributes.track_id IS '关联到父级升学火种。';
COMMENT ON COLUMN public.academic_track_attributes.attribute_name IS '数据点的名称，例如 "further_study_rate"。';
COMMENT ON COLUMN public.academic_track_attributes.attribute_value IS '数据点的值，例如 "95%"。';
COMMENT ON COLUMN public.academic_track_attributes.source_document_id IS '关联到信息提取的源文档。';
COMMENT ON COLUMN public.academic_track_attributes.year IS '此数据适用的年份（如果相关）。';
COMMENT ON COLUMN public.academic_track_attributes.status IS '此特定数据点的审核状态。';

-- 2. 为“求职火种”创建属性表
CREATE TABLE public.career_track_attributes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    track_id UUID NOT NULL REFERENCES public.career_tracks(id) ON DELETE CASCADE,
    attribute_name TEXT NOT NULL,
    attribute_value TEXT NOT NULL,
    source_document_id UUID REFERENCES public.source_documents(id) ON DELETE SET NULL,
    year INT,
    status contribution_status NOT NULL DEFAULT 'pending',
    submitted_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_career_attribute_per_source UNIQUE(track_id, attribute_name, source_document_id, attribute_value)
);
COMMENT ON TABLE public.career_track_attributes IS '存储求职火种的各个数据点，支持多值和历史记录。';
COMMENT ON COLUMN public.career_track_attributes.track_id IS '关联到父级求职火种。';
COMMENT ON COLUMN public.career_track_attributes.attribute_name IS '数据点的名称，例如 "salary_range"。';
COMMENT ON COLUMN public.career_track_attributes.attribute_value IS '数据点的值，例如 "10k-15k"。';
COMMENT ON COLUMN public.career_track_attributes.source_document_id IS '关联到信息提取的源文档。';
COMMENT ON COLUMN public.career_track_attributes.year IS '此数据适用的年份（如果相关）。';
COMMENT ON COLUMN public.career_track_attributes.status IS '此特定数据点的审核状态。';


-- 3. 现在，我们从主火种表中移除旧的、固定的字段。
-- 我们正在将这些数据迁移到新的属性表中。

ALTER TABLE public.academic_tracks
DROP COLUMN IF EXISTS further_study_rate,
DROP COLUMN IF EXISTS further_study_destination,
DROP COLUMN IF EXISTS employment_rate,
DROP COLUMN IF EXISTS employment_destination,
DROP COLUMN IF EXISTS recommendations;

ALTER TABLE public.career_tracks
DROP COLUMN IF EXISTS experience_duration,
DROP COLUMN IF EXISTS required_skills,
DROP COLUMN IF EXISTS personality_fit,
DROP COLUMN IF EXISTS practitioner_major,
DROP COLUMN IF EXISTS practitioner_school,
DROP COLUMN IF EXISTS salary_range,
DROP COLUMN IF EXISTS recommendations;

-- 4. 为新表启用行级安全（RLS）并设置策略
ALTER TABLE public.academic_track_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_track_attributes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read approved attributes"
ON public.academic_track_attributes FOR SELECT
USING (status = 'approved');

CREATE POLICY "Admins can manage all academic attributes"
ON public.academic_track_attributes FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Public can read approved career attributes"
ON public.career_track_attributes FOR SELECT
USING (status = 'approved');

CREATE POLICY "Admins can manage all career attributes"
ON public.career_track_attributes FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));
