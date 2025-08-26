// 检查知识库中的数据
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://ijrbyfpesocafkkwmfht.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqcmJ5ZnBlc29jYWZra3dtZmh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMDcxNDQsImV4cCI6MjA3MTc4MzE0NH0.ZGjfGxJrPdA0xXliixUjFDK7vapEJKxIs56LorPRImM";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkKnowledge() {
  console.log('🔍 检查知识库数据...\n');

  try {
    const { data, error } = await supabase
      .from('formolly_travel_knowledge')
      .select('*')
      .limit(10);

    if (error) {
      console.error('❌ 查询错误:', error);
      return;
    }

    console.log(`📊 总共找到 ${data.length} 条记录:`);
    
    if (data.length === 0) {
      console.log('⚠️  知识库为空，这就是为什么CSV上传看起来失败了');
    } else {
      data.forEach((record, index) => {
        console.log(`\n${index + 1}. ID: ${record.id}`);
        console.log(`   内容: ${record.content.substring(0, 100)}...`);
        console.log(`   分类: ${record.category}`);
        console.log(`   地点: ${record.location || '无'}`);
        console.log(`   来源: ${record.source_name}`);
        console.log(`   创建时间: ${record.created_at}`);
      });
    }

    // 检查最近的上传
    const { data: recent } = await supabase
      .from('formolly_travel_knowledge')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3);

    if (recent && recent.length > 0) {
      console.log('\n📅 最近上传的数据:');
      recent.forEach((record, index) => {
        console.log(`${index + 1}. ${record.content.substring(0, 50)}... (${record.created_at})`);
      });
    }

  } catch (err) {
    console.error('❌ 检查失败:', err.message);
  }
}

checkKnowledge();
