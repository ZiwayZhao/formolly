// 测试简化版知识上传功能
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://ijrbyfpesocafkkwmfht.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqcmJ5ZnBlc29jYWZra3dtZmh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMDcxNDQsImV4cCI6MjA3MTc4MzE0NH0.ZGjfGxJrPdA0xXliixUjFDK7vapEJKxIs56LorPRImM";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testSimpleUpload() {
  console.log('🧪 测试简化版知识上传功能...\n');

  // 创建测试数据
  const testData = [
    {
      question: "巴黎地铁怎么买票？",
      answer: "可以在地铁站的自动售票机购买，支持信用卡和现金。单程票价约2.15欧元。",
      category: "transportation",
      location: "巴黎",
      source_name: "测试数据"
    },
    {
      question: "德国超市购物要注意什么？",
      answer: "需要自备购物袋，购物车需要投币，结账后要自己装袋。",
      category: "shopping", 
      location: "德国",
      source_name: "测试数据"
    }
  ];

  try {
    console.log('📤 调用 formolly-upload-simple 函数...');
    
    const { data, error } = await supabase.functions.invoke('formolly-upload-simple', {
      body: { knowledgeItems: testData }
    });

    if (error) {
      console.error('❌ 函数调用错误:', error);
      return;
    }

    console.log('✅ 函数调用成功');
    console.log('📊 结果:', JSON.stringify(data, null, 2));

    // 验证数据是否成功插入数据库
    console.log('\n🔍 验证数据库中的数据...');
    const { data: dbData, error: dbError } = await supabase
      .from('formolly_travel_knowledge')
      .select('*')
      .eq('source_name', '测试数据');

    if (dbError) {
      console.error('❌ 数据库查询错误:', dbError);
    } else {
      console.log(`✅ 数据库中找到 ${dbData.length} 条记录`);
      dbData.forEach((record, index) => {
        console.log(`  ${index + 1}. ${record.content.substring(0, 50)}...`);
      });
    }

  } catch (err) {
    console.error('❌ 测试失败:', err.message);
    console.error('详细错误:', err);
  }
}

testSimpleUpload();
