
-- 启用 pg_net 扩展，允许数据库进行出站 HTTP 请求
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
