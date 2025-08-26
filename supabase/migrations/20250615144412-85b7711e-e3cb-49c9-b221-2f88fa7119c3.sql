
-- 为 'academic_tracks' 表启用行级安全并设置策略
ALTER TABLE public.academic_tracks ENABLE ROW LEVEL SECURITY;

-- 删除可能存在的旧策略以避免冲突
DROP POLICY IF EXISTS "Admins can manage all academic tracks" ON public.academic_tracks;
DROP POLICY IF EXISTS "Users can insert their own tracks" ON public.academic_tracks;
DROP POLICY IF EXISTS "Public can view approved tracks" ON public.academic_tracks;

-- 创建新策略
CREATE POLICY "Admins can manage all academic tracks"
ON public.academic_tracks FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Users can insert their own tracks"
ON public.academic_tracks FOR INSERT
WITH CHECK (submitted_by = auth.uid());

CREATE POLICY "Public can view approved tracks"
ON public.academic_tracks FOR SELECT
USING (status = 'approved' OR public.is_admin(auth.uid()));


-- 为 'career_tracks' 表启用行级安全并设置策略
ALTER TABLE public.career_tracks ENABLE ROW LEVEL SECURITY;

-- 删除可能存在的旧策略以避免冲突
DROP POLICY IF EXISTS "Admins can manage all career tracks" ON public.career_tracks;
DROP POLICY IF EXISTS "Users can insert their own tracks" ON public.career_tracks;
DROP POLICY IF EXISTS "Public can view approved tracks" ON public.career_tracks;

-- 创建新策略
CREATE POLICY "Admins can manage all career tracks"
ON public.career_tracks FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Users can insert their own tracks"
ON public.career_tracks FOR INSERT
WITH CHECK (submitted_by = auth.uid());

CREATE POLICY "Public can view approved tracks"
ON public.career_tracks FOR SELECT
USING (status = 'approved' OR public.is_admin(auth.uid()));
