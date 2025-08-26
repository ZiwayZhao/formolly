// 测试OpenRouter API连接
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://ijrbyfpesocafkkwmfht.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqcmJ5ZnBlc29jYWZra3dtZmh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMDcxNDQsImV4cCI6MjA3MTc4MzE0NH0.ZGjfGxJrPdA0xXliixUjFDK7vapEJKxIs56LorPRImM";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testOpenRouter() {
  console.log('🧪 测试OpenRouter API连接...\n');

  try {
    // 创建一个简单的测试函数来验证API连接
    const { data, error } = await supabase.functions.invoke('formolly-upload-knowledge', {
      body: { 
        knowledgeItems: [{
          question: "测试问题",
          answer: "测试答案",
          category: "test",
          location: "测试",
          source_name: "api-test"
        }]
      }
    });

    if (error) {
      console.error('❌ 函数调用错误:', error);
      return;
    }

    console.log('📊 API测试结果:', JSON.stringify(data, null, 2));

    if (data.errorCount > 0) {
      console.log('\n❌ 发现错误:');
      data.errors.forEach((err, index) => {
        console.log(`  ${index + 1}. ${err}`);
      });
    }

  } catch (err) {
    console.error('❌ 测试失败:', err.message);
  }
}

testOpenRouter();
