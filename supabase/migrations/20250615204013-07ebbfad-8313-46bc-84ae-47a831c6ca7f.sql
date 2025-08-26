
-- 创建邀请码表
CREATE TABLE IF NOT EXISTS invitation_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('admin', 'user')), -- 管理员生成或用户生成
    created_by UUID REFERENCES auth.users(id), -- 创建者ID（用户生成的邀请码）
    created_by_admin BOOLEAN DEFAULT false, -- 是否由管理员创建
    max_uses INTEGER DEFAULT 1, -- 最大使用次数
    current_uses INTEGER DEFAULT 0, -- 当前使用次数
    expires_at TIMESTAMP WITH TIME ZONE, -- 过期时间
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 创建邀请记录表
CREATE TABLE IF NOT EXISTS invitation_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invitation_code_id UUID REFERENCES invitation_codes(id) ON DELETE CASCADE,
    inviter_id UUID REFERENCES auth.users(id), -- 邀请人
    invitee_id UUID REFERENCES auth.users(id), -- 被邀请人
    flame_reward_given BOOLEAN DEFAULT false, -- 是否已给予火苗奖励
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 为用户档案表添加邀请码字段（如果不存在）
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS invitation_code TEXT;

-- 创建函数：用户注册后自动生成邀请码
CREATE OR REPLACE FUNCTION generate_user_invitation_code()
RETURNS TRIGGER AS $$
DECLARE
    new_code TEXT;
BEGIN
    -- 生成8位随机邀请码
    new_code := upper(substring(md5(random()::text) from 1 for 8));
    
    -- 确保邀请码唯一
    WHILE EXISTS (SELECT 1 FROM invitation_codes WHERE code = new_code) LOOP
        new_code := upper(substring(md5(random()::text) from 1 for 8));
    END LOOP;
    
    -- 插入邀请码记录
    INSERT INTO invitation_codes (code, type, created_by, max_uses)
    VALUES (new_code, 'user', NEW.id, 5); -- 每个用户可邀请5人
    
    -- 更新用户档案中的邀请码
    UPDATE profiles SET invitation_code = new_code WHERE id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器：用户注册后自动生成邀请码
DROP TRIGGER IF EXISTS trigger_generate_invitation_code ON profiles;
CREATE TRIGGER trigger_generate_invitation_code
    AFTER INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION generate_user_invitation_code();

-- 创建函数：处理邀请奖励
CREATE OR REPLACE FUNCTION handle_invitation_reward()
RETURNS TRIGGER AS $$
DECLARE
    inviter_user_id UUID;
    invitation_type TEXT;
BEGIN
    -- 分别获取邀请码信息
    SELECT created_by, type INTO inviter_user_id, invitation_type
    FROM invitation_codes 
    WHERE id = NEW.invitation_code_id;
    
    -- 如果是用户生成的邀请码且未给过奖励
    IF invitation_type = 'user' AND NOT NEW.flame_reward_given AND inviter_user_id IS NOT NULL THEN
        -- 给邀请人添加20点火苗
        INSERT INTO flame_transactions (
            user_id, 
            transaction_type, 
            amount, 
            description,
            related_knowledge_unit_id
        ) VALUES (
            inviter_user_id,
            'initial_bonus',
            20,
            '成功邀请新用户注册奖励',
            NULL
        );
        
        -- 标记奖励已发放
        UPDATE invitation_records 
        SET flame_reward_given = true 
        WHERE id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器：邀请成功后自动发放奖励
DROP TRIGGER IF EXISTS trigger_invitation_reward ON invitation_records;
CREATE TRIGGER trigger_invitation_reward
    AFTER INSERT ON invitation_records
    FOR EACH ROW
    EXECUTE FUNCTION handle_invitation_reward();

-- 启用RLS
ALTER TABLE invitation_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitation_records ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
-- 用户可以查看自己创建的邀请码
CREATE POLICY "Users can view their own invitation codes" ON invitation_codes
    FOR SELECT USING (created_by = auth.uid());

-- 管理员可以查看和操作所有邀请码
CREATE POLICY "Admins can manage all invitation codes" ON invitation_codes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- 用户可以查看与自己相关的邀请记录
CREATE POLICY "Users can view their invitation records" ON invitation_records
    FOR SELECT USING (inviter_id = auth.uid() OR invitee_id = auth.uid());

-- 管理员可以查看所有邀请记录
CREATE POLICY "Admins can view all invitation records" ON invitation_records
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- 创建索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_invitation_codes_code ON invitation_codes(code);
CREATE INDEX IF NOT EXISTS idx_invitation_codes_created_by ON invitation_codes(created_by);
CREATE INDEX IF NOT EXISTS idx_invitation_records_inviter ON invitation_records(inviter_id);
CREATE INDEX IF NOT EXISTS idx_invitation_records_invitee ON invitation_records(invitee_id);

-- 插入两个示例关联的火种数据（移除冲突约束）
-- 首先插入学校和专业基础数据
INSERT INTO schools (id, name, location, type) 
SELECT '550e8400-e29b-41d4-a716-446655440001', '清华大学', '北京', '985/211'
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name = '清华大学');

INSERT INTO schools (id, name, location, type) 
SELECT '550e8400-e29b-41d4-a716-446655440002', '北京大学', '北京', '985/211'
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name = '北京大学');

INSERT INTO majors (id, name, category, degree_level) 
SELECT '660e8400-e29b-41d4-a716-446655440001', '计算机科学与技术', '理工', '本科'
WHERE NOT EXISTS (SELECT 1 FROM majors WHERE name = '计算机科学与技术');

INSERT INTO majors (id, name, category, degree_level) 
SELECT '660e8400-e29b-41d4-a716-446655440002', '软件工程', '理工', '本科'
WHERE NOT EXISTS (SELECT 1 FROM majors WHERE name = '软件工程');

INSERT INTO job_positions (id, title, industry, location) 
SELECT '770e8400-e29b-41d4-a716-446655440001', '软件工程师', '互联网', '北京'
WHERE NOT EXISTS (SELECT 1 FROM job_positions WHERE title = '软件工程师' AND industry = '互联网' AND location = '北京');

INSERT INTO job_positions (id, title, industry, location) 
SELECT '770e8400-e29b-41d4-a716-446655440002', '算法工程师', '互联网', '上海'
WHERE NOT EXISTS (SELECT 1 FROM job_positions WHERE title = '算法工程师' AND industry = '互联网' AND location = '上海');

-- 插入学校专业项目
INSERT INTO school_programs (id, school_id, major_id, school_name, program_name, program_type) 
SELECT '880e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', '清华大学', '计算机科学与技术', '普通批次'
WHERE NOT EXISTS (SELECT 1 FROM school_programs WHERE school_id = '550e8400-e29b-41d4-a716-446655440001' AND major_id = '660e8400-e29b-41d4-a716-446655440001');

INSERT INTO school_programs (id, school_id, major_id, school_name, program_name, program_type) 
SELECT '880e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', '北京大学', '软件工程', '普通批次'
WHERE NOT EXISTS (SELECT 1 FROM school_programs WHERE school_id = '550e8400-e29b-41d4-a716-446655440002' AND major_id = '660e8400-e29b-41d4-a716-446655440002');

-- 插入学术火种
INSERT INTO academic_sparks (id, spark_number, program_id, school_name, major_name, status, flame_points) 
SELECT 'aa0e8400-e29b-41d4-a716-446655440001', 'AS-2024-001', '880e8400-e29b-41d4-a716-446655440001', '清华大学', '计算机科学与技术', 'approved', 20
WHERE NOT EXISTS (SELECT 1 FROM academic_sparks WHERE spark_number = 'AS-2024-001');

INSERT INTO academic_sparks (id, spark_number, program_id, school_name, major_name, status, flame_points) 
SELECT 'aa0e8400-e29b-41d4-a716-446655440002', 'AS-2024-002', '880e8400-e29b-41d4-a716-446655440002', '北京大学', '软件工程', 'approved', 20
WHERE NOT EXISTS (SELECT 1 FROM academic_sparks WHERE spark_number = 'AS-2024-002');

-- 插入职业火种
INSERT INTO career_sparks (id, spark_number, job_position_id, job_title, location, industry, status, flame_points) 
SELECT 'bb0e8400-e29b-41d4-a716-446655440001', 'CS-2024-001', '770e8400-e29b-41d4-a716-446655440001', '软件工程师', '北京', '互联网', 'approved', 20
WHERE NOT EXISTS (SELECT 1 FROM career_sparks WHERE spark_number = 'CS-2024-001');

INSERT INTO career_sparks (id, spark_number, job_position_id, job_title, location, industry, status, flame_points) 
SELECT 'bb0e8400-e29b-41d4-a716-446655440002', 'CS-2024-002', '770e8400-e29b-41d4-a716-446655440002', '算法工程师', '上海', '互联网', 'approved', 20
WHERE NOT EXISTS (SELECT 1 FROM career_sparks WHERE spark_number = 'CS-2024-002');

-- 插入学术火种属性
INSERT INTO academic_spark_attributes (spark_id, attribute_type, attribute_value, year, confidence_level, status) 
SELECT 'aa0e8400-e29b-41d4-a716-446655440001', 'admission_rate', '清华大学计算机科学与技术专业录取率约为0.8%，需要高考成绩达到690分以上', 2024, 'high', 'approved'
WHERE NOT EXISTS (SELECT 1 FROM academic_spark_attributes WHERE spark_id = 'aa0e8400-e29b-41d4-a716-446655440001' AND attribute_type = 'admission_rate');

INSERT INTO academic_spark_attributes (spark_id, attribute_type, attribute_value, year, confidence_level, status) 
SELECT 'aa0e8400-e29b-41d4-a716-446655440001', 'employment_rate', '就业率高达98%，主要去向为腾讯、字节跳动、阿里巴巴等知名互联网公司', 2024, 'high', 'approved'
WHERE NOT EXISTS (SELECT 1 FROM academic_spark_attributes WHERE spark_id = 'aa0e8400-e29b-41d4-a716-446655440001' AND attribute_type = 'employment_rate');

INSERT INTO academic_spark_attributes (spark_id, attribute_type, attribute_value, year, confidence_level, status) 
SELECT 'aa0e8400-e29b-41d4-a716-446655440002', 'admission_rate', '北京大学软件工程专业录取率约为1.2%，高考成绩需达到680分以上', 2024, 'high', 'approved'
WHERE NOT EXISTS (SELECT 1 FROM academic_spark_attributes WHERE spark_id = 'aa0e8400-e29b-41d4-a716-446655440002' AND attribute_type = 'admission_rate');

INSERT INTO academic_spark_attributes (spark_id, attribute_type, attribute_value, year, confidence_level, status) 
SELECT 'aa0e8400-e29b-41d4-a716-446655440002', 'graduate_rate', '深造率为75%，多数学生选择在清华、北大、斯坦福等顶尖院校继续读研', 2024, 'high', 'approved'
WHERE NOT EXISTS (SELECT 1 FROM academic_spark_attributes WHERE spark_id = 'aa0e8400-e29b-41d4-a716-446655440002' AND attribute_type = 'graduate_rate');

-- 插入职业火种属性
INSERT INTO career_spark_attributes (spark_id, attribute_type, attribute_value, year, confidence_level, status) 
SELECT 'bb0e8400-e29b-41d4-a716-446655440001', 'required_skills', '需要熟练掌握Java、Python、JavaScript等编程语言，具备分布式系统开发经验', 2024, 'high', 'approved'
WHERE NOT EXISTS (SELECT 1 FROM career_spark_attributes WHERE spark_id = 'bb0e8400-e29b-41d4-a716-446655440001' AND attribute_type = 'required_skills');

INSERT INTO career_spark_attributes (spark_id, attribute_type, attribute_value, year, confidence_level, status) 
SELECT 'bb0e8400-e29b-41d4-a716-446655440001', 'salary_range', '薪资范围：15-35万/年，一线互联网公司新入职工程师起薪通常在20-25万', 2024, 'medium', 'approved'
WHERE NOT EXISTS (SELECT 1 FROM career_spark_attributes WHERE spark_id = 'bb0e8400-e29b-41d4-a716-446655440001' AND attribute_type = 'salary_range');

INSERT INTO career_spark_attributes (spark_id, attribute_type, attribute_value, year, confidence_level, status) 
SELECT 'bb0e8400-e29b-41d4-a716-446655440002', 'education_background', '通常要求计算机、数学、统计学等相关专业背景，硕士学历优先', 2024, 'high', 'approved'
WHERE NOT EXISTS (SELECT 1 FROM career_spark_attributes WHERE spark_id = 'bb0e8400-e29b-41d4-a716-446655440002' AND attribute_type = 'education_background');

INSERT INTO career_spark_attributes (spark_id, attribute_type, attribute_value, year, confidence_level, status) 
SELECT 'bb0e8400-e29b-41d4-a716-446655440002', 'salary_range', '薪资范围：25-50万/年，顶级公司资深算法工程师年薪可达80万以上', 2024, 'medium', 'approved'
WHERE NOT EXISTS (SELECT 1 FROM career_spark_attributes WHERE spark_id = 'bb0e8400-e29b-41d4-a716-446655440002' AND attribute_type = 'salary_range');

-- 创建火种连接关系
INSERT INTO spark_connections (academic_spark_id, career_spark_id, connection_strength, connection_type) 
SELECT 'aa0e8400-e29b-41d4-a716-446655440001', 'bb0e8400-e29b-41d4-a716-446655440001', 0.9, 'direct'
WHERE NOT EXISTS (SELECT 1 FROM spark_connections WHERE academic_spark_id = 'aa0e8400-e29b-41d4-a716-446655440001' AND career_spark_id = 'bb0e8400-e29b-41d4-a716-446655440001');

INSERT INTO spark_connections (academic_spark_id, career_spark_id, connection_strength, connection_type) 
SELECT 'aa0e8400-e29b-41d4-a716-446655440002', 'bb0e8400-e29b-41d4-a716-446655440002', 0.85, 'direct'
WHERE NOT EXISTS (SELECT 1 FROM spark_connections WHERE academic_spark_id = 'aa0e8400-e29b-41d4-a716-446655440002' AND career_spark_id = 'bb0e8400-e29b-41d4-a716-446655440002');
