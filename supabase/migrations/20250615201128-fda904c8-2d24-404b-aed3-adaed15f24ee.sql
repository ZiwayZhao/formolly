
-- 创建贡献状态枚举（如果不存在）
DO $$ BEGIN
    CREATE TYPE contribution_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 创建用户积分变动类型枚举
CREATE TYPE flame_transaction_type AS ENUM (
    'initial_bonus',
    'link_contribution', 
    'spark_contribution',
    'qa_contribution',
    'ai_query_cost',
    'admin_adjustment'
);

-- 1. 学校信息表
CREATE TABLE IF NOT EXISTS schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    location TEXT,
    type TEXT, -- 985/211/普通本科/专科等
    website TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. 专业信息表
CREATE TABLE IF NOT EXISTS majors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT, -- 理工/文史/艺术等
    degree_level TEXT, -- 本科/硕士/博士
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. 学校-专业项目表
CREATE TABLE IF NOT EXISTS school_programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    major_id UUID REFERENCES majors(id) ON DELETE CASCADE,
    school_name TEXT NOT NULL, -- 冗余存储，便于检索
    program_name TEXT NOT NULL, -- 冗余存储，便于检索
    program_type TEXT, -- 普通批次/强基计划/综合评价等
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(school_id, major_id, program_type)
);

-- 4. 工作职位表
CREATE TABLE IF NOT EXISTS job_positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    industry TEXT,
    location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. 学术火种表（学校-专业相关的火种）
CREATE TABLE IF NOT EXISTS academic_sparks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    spark_number TEXT UNIQUE NOT NULL, -- 火种编号，如 AS-2024-001
    program_id UUID REFERENCES school_programs(id) ON DELETE CASCADE,
    school_name TEXT NOT NULL,
    major_name TEXT NOT NULL,
    status contribution_status DEFAULT 'pending',
    submitted_by UUID, -- 提交用户ID
    reviewed_by UUID, -- 审核管理员ID
    flame_points INTEGER DEFAULT 20, -- 火苗奖励
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. 学术火种属性表（存储具体的数据点）
CREATE TABLE IF NOT EXISTS academic_spark_attributes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    spark_id UUID REFERENCES academic_sparks(id) ON DELETE CASCADE,
    attribute_type TEXT NOT NULL, -- 'admission_rate', 'graduate_rate', 'employment_rate', 'further_study_destination', 'employment_destination', 'recommendations'
    attribute_value TEXT NOT NULL,
    year INTEGER, -- 数据年份
    source_url TEXT, -- 数据来源链接
    confidence_level TEXT DEFAULT 'medium', -- high/medium/low
    status contribution_status DEFAULT 'approved',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 7. 职业火种表
CREATE TABLE IF NOT EXISTS career_sparks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    spark_number TEXT UNIQUE NOT NULL, -- 火种编号，如 CS-2024-001
    job_position_id UUID REFERENCES job_positions(id) ON DELETE CASCADE,
    job_title TEXT NOT NULL,
    location TEXT,
    industry TEXT,
    status contribution_status DEFAULT 'pending',
    submitted_by UUID, -- 提交用户ID
    reviewed_by UUID, -- 审核管理员ID
    flame_points INTEGER DEFAULT 20, -- 火苗奖励
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 8. 职业火种属性表
CREATE TABLE IF NOT EXISTS career_spark_attributes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    spark_id UUID REFERENCES career_sparks(id) ON DELETE CASCADE,
    attribute_type TEXT NOT NULL, -- 'experience_years', 'required_skills', 'required_certificates', 'personality_fit', 'education_background', 'school_background', 'salary_range', 'recommendations'
    attribute_value TEXT NOT NULL,
    year INTEGER, -- 数据年份
    source_url TEXT,
    confidence_level TEXT DEFAULT 'medium',
    status contribution_status DEFAULT 'approved',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 9. 火种连接表（学术火种与职业火种的关联）
CREATE TABLE IF NOT EXISTS spark_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    academic_spark_id UUID REFERENCES academic_sparks(id) ON DELETE CASCADE,
    career_spark_id UUID REFERENCES career_sparks(id) ON DELETE CASCADE,
    connection_strength FLOAT DEFAULT 1.0, -- 连接强度
    connection_type TEXT, -- 'direct', 'related', 'potential'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(academic_spark_id, career_spark_id)
);

-- 10. 用户火苗交易记录表
CREATE TABLE IF NOT EXISTS flame_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    transaction_type flame_transaction_type NOT NULL,
    amount INTEGER NOT NULL, -- 正数为获得，负数为消费
    description TEXT,
    related_spark_id UUID, -- 关联的火种ID（如果适用）
    related_knowledge_unit_id UUID, -- 关联的知识单元ID（如果适用）
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 11. 用户任务表
CREATE TABLE IF NOT EXISTS user_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    task_type TEXT NOT NULL, -- 'link_contribution', 'spark_contribution', 'qa_contribution'
    task_title TEXT NOT NULL,
    task_description TEXT,
    flame_reward INTEGER NOT NULL,
    status TEXT DEFAULT 'active', -- 'active', 'completed', 'expired'
    completed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 12. 更新现有的 knowledge_units 表，添加火苗奖励字段
ALTER TABLE knowledge_units 
ADD COLUMN IF NOT EXISTS flame_points INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS submitted_by UUID,
ADD COLUMN IF NOT EXISTS reviewed_by UUID,
ADD COLUMN IF NOT EXISTS review_status contribution_status DEFAULT 'approved';

-- 13. 更新用户资料表，添加火苗余额更新触发器需要的函数
CREATE OR REPLACE FUNCTION update_user_flame_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- 更新用户的火苗余额
    UPDATE profiles 
    SET flame_balance = (
        SELECT COALESCE(SUM(amount), 0) 
        FROM flame_transactions 
        WHERE user_id = NEW.user_id
    )
    WHERE id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 14. 创建触发器自动更新用户火苗余额
DROP TRIGGER IF EXISTS update_flame_balance_trigger ON flame_transactions;
CREATE TRIGGER update_flame_balance_trigger
    AFTER INSERT ON flame_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_user_flame_balance();

-- 15. 创建索引提高查询性能
CREATE INDEX IF NOT EXISTS idx_academic_sparks_program ON academic_sparks(program_id);
CREATE INDEX IF NOT EXISTS idx_academic_sparks_status ON academic_sparks(status);
CREATE INDEX IF NOT EXISTS idx_career_sparks_job ON career_sparks(job_position_id);
CREATE INDEX IF NOT EXISTS idx_career_sparks_status ON career_sparks(status);
CREATE INDEX IF NOT EXISTS idx_spark_attributes_spark_id ON academic_spark_attributes(spark_id);
CREATE INDEX IF NOT EXISTS idx_career_attributes_spark_id ON career_spark_attributes(spark_id);
CREATE INDEX IF NOT EXISTS idx_flame_transactions_user ON flame_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tasks_user_status ON user_tasks(user_id, status);

-- 16. 创建全文搜索索引（使用simple配置）
CREATE INDEX IF NOT EXISTS idx_schools_name_gin ON schools USING gin(to_tsvector('simple', name));
CREATE INDEX IF NOT EXISTS idx_majors_name_gin ON majors USING gin(to_tsvector('simple', name));
CREATE INDEX IF NOT EXISTS idx_job_positions_title_gin ON job_positions USING gin(to_tsvector('simple', title));
CREATE INDEX IF NOT EXISTS idx_academic_sparks_school_gin ON academic_sparks USING gin(to_tsvector('simple', school_name));
CREATE INDEX IF NOT EXISTS idx_academic_sparks_major_gin ON academic_sparks USING gin(to_tsvector('simple', major_name));
CREATE INDEX IF NOT EXISTS idx_career_sparks_title_gin ON career_sparks USING gin(to_tsvector('simple', job_title));
CREATE INDEX IF NOT EXISTS idx_career_sparks_location_gin ON career_sparks USING gin(to_tsvector('simple', location));
CREATE INDEX IF NOT EXISTS idx_academic_attributes_value_gin ON academic_spark_attributes USING gin(to_tsvector('simple', attribute_value));
CREATE INDEX IF NOT EXISTS idx_career_attributes_value_gin ON career_spark_attributes USING gin(to_tsvector('simple', attribute_value));

-- 17. 启用RLS
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE majors ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_sparks ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_spark_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_sparks ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_spark_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE spark_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE flame_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tasks ENABLE ROW LEVEL SECURITY;

-- 18. 创建基本的RLS策略（允许读取已审核通过的数据）
CREATE POLICY "Allow reading approved academic sparks" ON academic_sparks FOR SELECT USING (status = 'approved');
CREATE POLICY "Allow reading approved career sparks" ON career_sparks FOR SELECT USING (status = 'approved');
CREATE POLICY "Allow reading approved academic attributes" ON academic_spark_attributes FOR SELECT USING (status = 'approved');
CREATE POLICY "Allow reading approved career attributes" ON career_spark_attributes FOR SELECT USING (status = 'approved');
CREATE POLICY "Allow reading all schools" ON schools FOR SELECT USING (true);
CREATE POLICY "Allow reading all majors" ON majors FOR SELECT USING (true);
CREATE POLICY "Allow reading all programs" ON school_programs FOR SELECT USING (true);
CREATE POLICY "Allow reading all jobs" ON job_positions FOR SELECT USING (true);
CREATE POLICY "Allow reading all connections" ON spark_connections FOR SELECT USING (true);

-- 用户相关策略
CREATE POLICY "Users can view their flame transactions" ON flame_transactions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can view their tasks" ON user_tasks FOR SELECT USING (user_id = auth.uid());

-- 管理员策略（暂时允许所有操作，后续可以基于角色细化）
CREATE POLICY "Allow all operations for admins" ON academic_sparks FOR ALL USING (true);
CREATE POLICY "Allow all operations for admins" ON career_sparks FOR ALL USING (true);
CREATE POLICY "Allow all operations for admins" ON academic_spark_attributes FOR ALL USING (true);
CREATE POLICY "Allow all operations for admins" ON career_spark_attributes FOR ALL USING (true);
CREATE POLICY "Allow all operations for admins" ON schools FOR ALL USING (true);
CREATE POLICY "Allow all operations for admins" ON majors FOR ALL USING (true);
CREATE POLICY "Allow all operations for admins" ON school_programs FOR ALL USING (true);
CREATE POLICY "Allow all operations for admins" ON job_positions FOR ALL USING (true);
CREATE POLICY "Allow all operations for admins" ON spark_connections FOR ALL USING (true);
CREATE POLICY "Allow all operations for admins" ON flame_transactions FOR ALL USING (true);
CREATE POLICY "Allow all operations for admins" ON user_tasks FOR ALL USING (true);
