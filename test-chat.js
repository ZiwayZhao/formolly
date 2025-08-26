// 测试聊天功能
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://ijrbyfpesocafkkwmfht.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqcmJ5ZnBlc29jYWZra3dtZmh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMDcxNDQsImV4cCI6MjA3MTc4MzE0NH0.ZGjfGxJrPdA0xXliixUjFDK7vapEJKxIs56LorPRImM";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testChat() {
  console.log('🧪 测试Ziway聊天功能...\n');

  try {
    console.log('💬 向Ziway提问...');
    
    const { data, error } = await supabase.functions.invoke('formolly-chat', {
      body: {
        message: "巴黎地铁怎么买票？",
        category: null,
        location: null
      }
    });

    if (error) {
      console.error('❌ 聊天函数调用错误:', error);
      return;
    }

    console.log('✅ 聊天函数调用成功');
    console.log('🤖 Ziway的回答:');
    console.log(data.response);
    
    if (data.sources && data.sources.length > 0) {
      console.log('\n📚 引用来源:');
      data.sources.forEach((source, index) => {
        console.log(`  ${index + 1}. [${source.category}] ${source.content.substring(0, 50)}...`);
      });
    } else {
      console.log('\n📚 没有找到相关的知识库来源（可能是向量搜索问题）');
    }

  } catch (err) {
    console.error('❌ 聊天测试失败:', err.message);
    console.error('详细错误:', err);
  }
}

testChat();
