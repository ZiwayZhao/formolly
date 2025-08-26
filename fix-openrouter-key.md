# 🔧 修复OpenRouter API密钥问题

## 问题诊断

CSV上传失败的根本原因是：**OpenRouter API密钥无效**

当前使用的密钥 `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` 是一个假的测试密钥，导致API返回HTML错误页面而不是JSON响应。

## 解决方案

### 1. 获取真实的OpenRouter API密钥

1. 访问 [OpenRouter.ai](https://openrouter.ai/)
2. 注册账户并登录
3. 前往 [API Keys 页面](https://openrouter.ai/keys)
4. 创建新的API密钥
5. 复制真实的API密钥（格式应该是 `sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`）

### 2. 更新云端环境变量

使用以下命令更新Supabase项目的环境变量：

```bash
npx supabase secrets set --project-ref ijrbyfpesocafkkwmfht OPENROUTER_API_KEY=你的真实API密钥
```

### 3. 重新部署Edge Functions

更新密钥后，需要重新部署相关的Edge Functions：

```bash
npx supabase functions deploy formolly-upload-knowledge --project-ref ijrbyfpesocafkkwmfht
npx supabase functions deploy formolly-chat --project-ref ijrbyfpesocafkkwmfht
npx supabase functions deploy formolly-chat-simple --project-ref ijrbyfpesocafkkwmfht
```

### 4. 验证修复

运行测试脚本验证修复：

```bash
node test-csv-upload.js
node test-openrouter.js
```

## 错误详情

当前错误信息：
```
"Item 1: Unexpected token '<', \"<!DOCTYPE \"... is not valid JSON"
```

这表明API返回的是HTML页面（OpenRouter的错误页面），而不是预期的JSON响应。这是典型的API密钥无效的症状。

## 注意事项

- OpenRouter API需要有效的API密钥才能工作
- 确保API密钥有足够的额度进行嵌入和聊天请求
- API密钥应该保密，不要在代码中硬编码
