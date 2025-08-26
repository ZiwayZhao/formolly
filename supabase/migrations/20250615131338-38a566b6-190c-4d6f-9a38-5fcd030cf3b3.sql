
-- 1. 创建一个新的 ENUM 类型，用于表示贡献内容的状态
CREATE TYPE public.contribution_status AS ENUM ('pending', 'approved', 'rejected');

-- 2. 为 'profiles' 表添加火苗余额字段，并为现有用户设置默认值
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS flame_balance INT NOT NULL DEFAULT 3;

-- 3. 创建 'academic_tracks' (升学路径) 表
CREATE TABLE IF NOT EXISTS public.academic_tracks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_name TEXT NOT NULL,
    major_name TEXT NOT NULL,
    program_type TEXT,
    enrollment_details JSONB NOT NULL DEFAULT '{}'::jsonb,
    outcomes_details JSONB NOT NULL DEFAULT '{}'::jsonb,
    recommendations TEXT,
    status public.contribution_status NOT NULL DEFAULT 'pending',
    submitted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.academic_tracks IS '存储结构化的升学路径火种';
COMMENT ON COLUMN public.academic_tracks.enrollment_details IS '招生详情，如历年分数线等';
COMMENT ON COLUMN public.academic_tracks.outcomes_details IS '毕业去向，如就业率、深造率等';

-- 4. 创建 'career_tracks' (职业路径) 表
CREATE TABLE IF NOT EXISTS public.career_tracks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_title TEXT NOT NULL,
    industry TEXT,
    location TEXT,
    requirements JSONB NOT NULL DEFAULT '{}'::jsonb,
    person_profile JSONB NOT NULL DEFAULT '{}'::jsonb,
    compensation_details JSONB NOT NULL DEFAULT '{}'::jsonb,
    recommendations TEXT,
    status public.contribution_status NOT NULL DEFAULT 'pending',
    submitted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.career_tracks IS '存储结构化的职业路径火种';
COMMENT ON COLUMN public.career_tracks.requirements IS '工作要求，如技能、经验、证书';
COMMENT ON COLUMN public.career_tracks.person_profile IS '从业者画像，如性格、专业背景';
COMMENT ON COLUMN public.career_tracks.compensation_details IS '薪酬详情';

-- 5. 创建关联表 'track_connections'
CREATE TABLE IF NOT EXISTS public.track_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    academic_track_id UUID NOT NULL REFERENCES public.academic_tracks(id) ON DELETE CASCADE,
    career_track_id UUID NOT NULL REFERENCES public.career_tracks(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_track_connection UNIQUE (academic_track_id, career_track_id)
);
COMMENT ON TABLE public.track_connections IS '关联升学路径和职业路径';

-- 6. 创建一个函数来自动更新 'updated_at' 字段
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. 为新表创建 'updated_at' 触发器
DROP TRIGGER IF EXISTS on_academic_tracks_update ON public.academic_tracks;
CREATE TRIGGER on_academic_tracks_update
  BEFORE UPDATE ON public.academic_tracks
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS on_career_tracks_update ON public.career_tracks;
CREATE TRIGGER on_career_tracks_update
  BEFORE UPDATE ON public.career_tracks
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_updated_at();

-- 8. 为新表启用行级别安全 (RLS)
ALTER TABLE public.academic_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.track_connections ENABLE ROW LEVEL SECURITY;

-- 9. 为 'academic_tracks' 表创建 RLS 策略
DROP POLICY IF EXISTS "Enable read access for all approved tracks" ON public.academic_tracks;
CREATE POLICY "Enable read access for all approved tracks" ON public.academic_tracks FOR SELECT USING (status = 'approved');

DROP POLICY IF EXISTS "Users can insert their own tracks" ON public.academic_tracks;
CREATE POLICY "Users can insert their own tracks" ON public.academic_tracks FOR INSERT WITH CHECK (auth.uid() = submitted_by);

DROP POLICY IF EXISTS "Users can view their own submitted tracks" ON public.academic_tracks;
CREATE POLICY "Users can view their own submitted tracks" ON public.academic_tracks FOR SELECT USING (auth.uid() = submitted_by);

DROP POLICY IF EXISTS "Admins have full access on academic tracks" ON public.academic_tracks;
CREATE POLICY "Admins have full access on academic tracks" ON public.academic_tracks FOR ALL USING (public.is_admin(auth.uid()));

-- 10. 为 'career_tracks' 表创建 RLS 策略
DROP POLICY IF EXISTS "Enable read access for all approved tracks" ON public.career_tracks;
CREATE POLICY "Enable read access for all approved tracks" ON public.career_tracks FOR SELECT USING (status = 'approved');

DROP POLICY IF EXISTS "Users can insert their own tracks" ON public.career_tracks;
CREATE POLICY "Users can insert their own tracks" ON public.career_tracks FOR INSERT WITH CHECK (auth.uid() = submitted_by);

DROP POLICY IF EXISTS "Users can view their own submitted tracks" ON public.career_tracks;
CREATE POLICY "Users can view their own submitted tracks" ON public.career_tracks FOR SELECT USING (auth.uid() = submitted_by);

DROP POLICY IF EXISTS "Admins have full access on career tracks" ON public.career_tracks;
CREATE POLICY "Admins have full access on career tracks" ON public.career_tracks FOR ALL USING (public.is_admin(auth.uid()));

-- 11. 为 'track_connections' 表创建 RLS 策略
DROP POLICY IF EXISTS "Enable read access for all" ON public.track_connections;
CREATE POLICY "Enable read access for all" ON public.track_connections FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins have full access on track connections" ON public.track_connections;
CREATE POLICY "Admins have full access on track connections" ON public.track_connections FOR ALL USING (public.is_admin(auth.uid()));

