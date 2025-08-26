
-- 为 source_documents 表添加 user_id 字段来关联用户
ALTER TABLE public.source_documents 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- 创建用户角色枚举
CREATE TYPE user_role AS ENUM ('admin', 'user');

-- 创建用户角色表
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role user_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, role)
);

-- 创建检查用户角色的安全函数
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_roles.user_id = is_admin.user_id 
        AND role = 'admin'
    );
$$;

-- 更新 source_documents 的 RLS 策略
DROP POLICY IF EXISTS "Allow all operations for now" ON public.source_documents;

-- 管理员可以查看所有文档，普通用户只能查看自己的文档
CREATE POLICY "Users can view documents" ON public.source_documents
    FOR SELECT USING (
        public.is_admin(auth.uid()) OR user_id = auth.uid()
    );

-- 用户可以插入自己的文档
CREATE POLICY "Users can insert documents" ON public.source_documents
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- 管理员可以更新所有文档，普通用户只能更新自己的文档
CREATE POLICY "Users can update documents" ON public.source_documents
    FOR UPDATE USING (
        public.is_admin(auth.uid()) OR user_id = auth.uid()
    );

-- 管理员可以删除所有文档，普通用户只能删除自己的文档
CREATE POLICY "Users can delete documents" ON public.source_documents
    FOR DELETE USING (
        public.is_admin(auth.uid()) OR user_id = auth.uid()
    );

-- 为现有文档设置默认用户ID（可选，如果需要保留现有数据）
-- UPDATE public.source_documents SET user_id = auth.uid() WHERE user_id IS NULL;
