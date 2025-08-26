
-- 1. 修改 'academic_tracks' 表 (升学火种)
-- 移除旧的 JSON 字段
ALTER TABLE public.academic_tracks DROP COLUMN IF EXISTS enrollment_details;
ALTER TABLE public.academic_tracks DROP COLUMN IF EXISTS outcomes_details;

-- 添加新的具体字段
ALTER TABLE public.academic_tracks ADD COLUMN IF NOT EXISTS further_study_rate TEXT;
ALTER TABLE public.academic_tracks ADD COLUMN IF NOT EXISTS further_study_destination TEXT;
ALTER TABLE public.academic_tracks ADD COLUMN IF NOT EXISTS employment_rate TEXT;
ALTER TABLE public.academic_tracks ADD COLUMN IF NOT EXISTS employment_destination TEXT;

-- 为新字段添加注释
COMMENT ON COLUMN public.academic_tracks.further_study_rate IS '升学率';
COMMENT ON COLUMN public.academic_tracks.further_study_destination IS '升学去向';
COMMENT ON COLUMN public.academic_tracks.employment_rate IS '就业率';
COMMENT ON COLUMN public.academic_tracks.employment_destination IS '可能的就业去向';


-- 2. 修改 'career_tracks' 表 (求职火种)
-- 移除旧的 JSON 字段
ALTER TABLE public.career_tracks DROP COLUMN IF EXISTS requirements;
ALTER TABLE public.career_tracks DROP COLUMN IF EXISTS person_profile;
ALTER TABLE public.career_tracks DROP COLUMN IF EXISTS compensation_details;

-- 添加新的具体字段
ALTER TABLE public.career_tracks ADD COLUMN IF NOT EXISTS experience_duration TEXT;
ALTER TABLE public.career_tracks ADD COLUMN IF NOT EXISTS required_skills TEXT;
ALTER TABLE public.career_tracks ADD COLUMN IF NOT EXISTS personality_fit TEXT;
ALTER TABLE public.career_tracks ADD COLUMN IF NOT EXISTS practitioner_major TEXT;
ALTER TABLE public.career_tracks ADD COLUMN IF NOT EXISTS practitioner_school TEXT;
ALTER TABLE public.career_tracks ADD COLUMN IF NOT EXISTS salary_range TEXT;

-- 为新字段添加注释
COMMENT ON COLUMN public.career_tracks.experience_duration IS '工作经验（已经工作的时长）';
COMMENT ON COLUMN public.career_tracks.required_skills IS '这份工作必须要的经验/技能/证书';
COMMENT ON COLUMN public.career_tracks.personality_fit IS '工作适合什么样性格的人';
COMMENT ON COLUMN public.career_tracks.practitioner_major IS '从事这份工作人的专业';
COMMENT ON COLUMN public.career_tracks.practitioner_school IS '从事这份工作的人的毕业学校';
COMMENT ON COLUMN public.career_tracks.salary_range IS '薪资';

