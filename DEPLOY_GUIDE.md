# 🚀 Formolly 云端部署指南

## 📋 部署步骤

### 1️⃣ 数据库迁移

1. 访问 Supabase Dashboard: https://supabase.com/dashboard/project/ijrbyfpesocafkkwmfht
2. 点击左侧菜单 **SQL Editor**
3. 复制 `deploy-formolly.sql` 文件的全部内容
4. 粘贴到 SQL Editor 中并执行
5. 确认所有表和函数都创建成功

### 2️⃣ 部署 Edge Functions

由于CLI连接问题，我们需要手动部署Edge Functions：

#### 方法1：使用Supabase CLI（推荐）
```bash
# 设置环境变量
export SUPABASE_ACCESS_TOKEN="your_access_token"

# 部署函数
npx supabase functions deploy formolly-chat --project-ref ijrbyfpesocafkkwmfht
npx supabase functions deploy formolly-upload-knowledge --project-ref ijrbyfpesocafkkwmfht
```

#### 方法2：通过Dashboard手动创建
1. 访问 **Edge Functions** 页面
2. 创建新函数 `formolly-chat`
3. 复制 `supabase/functions/formolly-chat/index.ts` 内容
4. 重复步骤创建 `formolly-upload-knowledge` 函数

### 3️⃣ 设置环境变量

在 Supabase Dashboard 的 **Settings > Environment Variables** 中添加：

```
OPENAI_API_KEY=your_openai_api_key_here
```

### 4️⃣ 验证部署

1. **检查数据库表**：
   - formolly_welcome_notice
   - formolly_travel_knowledge  
   - formolly_cloud_files
   - formolly_chat_history

2. **检查存储桶**：
   - formolly-files (应该已创建)

3. **检查函数**：
   - formolly-chat
   - formolly-upload-knowledge

### 5️⃣ 测试应用

1. 启动本地开发服务器：`npm run dev`
2. 访问 http://localhost:5174
3. 测试所有功能：
   - ✅ 开屏须知显示
   - ✅ Ziway 聊天功能
   - ✅ CSV 知识上传
   - ✅ 云盘文件管理

## 🔧 配置信息

- **项目URL**: https://ijrbyfpesocafkkwmfht.supabase.co
- **项目ID**: ijrbyfpesocafkkwmfht
- **API Key**: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqcmJ5ZnBlc29jYWZra3dtZmh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMDcxNDQsImV4cCI6MjA3MTc4MzE0NH0.ZGjfGxJrPdA0xXliixUjFDK7vapEJKxIs56LorPRImM

## ⚠️ 注意事项

1. **OpenAI API密钥**：确保在环境变量中设置了有效的OpenAI API密钥
2. **存储桶权限**：已配置为公开访问，适合文件分享
3. **RLS策略**：已设置为开放访问，无需用户认证
4. **向量扩展**：已启用vector扩展用于RAG功能

## 🎯 下一步

部署完成后，您可以：
1. 上传欧洲旅行相关的CSV知识文件
2. 测试与Ziway的对话功能
3. 使用云盘存储旅行文档
4. 根据需要调整开屏须知内容

## 🆘 故障排除

如果遇到问题：
1. 检查浏览器控制台错误信息
2. 确认所有数据库表都已创建
3. 验证Edge Functions部署状态
4. 检查环境变量配置
5. 确认API密钥有效且有足够权限
