// 测试聊天功能是否能使用新上传的知识
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://ijrbyfpesocafkkwmfht.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqcmJ5ZnBlc29jYWZra3dtZmh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMDcxNDQsImV4cCI6MjA3MTc4MzE0NH0.ZGjfGxJrPdA0xXliixUjFDK7vapEJKxIs56LorPRImM";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testChatWithNewData() {
  console.log('🧪 测试聊天功能是否能使用新上传的知识...\n');

  const questions = [
    "阿姆斯特丹有什么好玩的景点？",
    "意大利坐火车怎么买票？",
    "在法国餐厅吃饭要注意什么？"
  ];

  for (const question of questions) {
    try {
      console.log(`💬 提问: "${question}"`);
      
      const { data, error } = await supabase.functions.invoke('formolly-chat-simple', {
        body: {
          message: question,
          category: null,
          location: null
        }
      });

      if (error) {
        console.error('❌ 错误:', error);
        continue;
      }

      console.log('🤖 Ziway回答:');
      console.log('─'.repeat(80));
      console.log(data.response);
      console.log('─'.repeat(80));
      
      if (data.sources && data.sources.length > 0) {
        console.log(`📚 找到 ${data.sources.length} 个相关知识来源:`);
        data.sources.forEach((source, index) => {
          console.log(`  ${index + 1}. [${source.category}] ${source.location || '通用'} - ${source.source_name}`);
        });
      } else {
        console.log('📚 没有找到相关知识来源');
      }
      
      console.log('\n' + '='.repeat(80) + '\n');

    } catch (err) {
      console.error('❌ 测试失败:', err.message);
    }
  }
}

testChatWithNewData();
