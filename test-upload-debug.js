// 调试上传和向量化过程
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ijrbyfpesocafkkwmfht.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqcmJ5ZnBlc29jYWZra3dtZmh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMDcxNDQsImV4cCI6MjA3MTc4MzE0NH0.ZGjfGxJrPdA0xXliixUjFDK7vapEJKxIs56LorPRImM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugUpload() {
  console.log('🔍 调试上传和向量化过程...\n');
  
  // 创建一个简单的测试数据
  const testData = [{
    question: '测试向量化问题',
    answer: '这是一个用于测试向量化功能的回答',
    category: 'test',
    location: '测试',
    source_name: '向量化测试'
  }];
  
  try {
    console.log('📤 调用formolly-upload-knowledge函数...');
    console.log('📊 测试数据:', JSON.stringify(testData, null, 2));
    
    const { data, error } = await supabase.functions.invoke('formolly-upload-knowledge', {
      body: { knowledgeItems: testData }
    });

    if (error) {
      console.error('❌ 函数调用错误:', error);
      return;
    }
    
    console.log('📊 函数返回结果:', JSON.stringify(data, null, 2));
    
    // 检查数据库中是否有新记录
    console.log('\n🔍 检查数据库中的新记录...');
    const { data: dbData, error: dbError } = await supabase
      .from('formolly_travel_knowledge')
      .select('*')
      .eq('source_name', '向量化测试')
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (dbError) {
      console.error('❌ 数据库查询错误:', dbError);
      return;
    }
    
    if (dbData && dbData.length > 0) {
      const record = dbData[0];
      console.log('✅ 找到新记录');
      console.log(`📊 ID: ${record.id}`);
      console.log(`📊 内容: ${record.content}`);
      console.log(`📊 向量维度: ${record.embedding ? record.embedding.length : '无向量'}`);
      console.log(`📊 创建时间: ${record.created_at}`);
      
      if (!record.embedding) {
        console.log('❌ 向量化失败！记录中没有embedding向量');
      } else {
        console.log('✅ 向量化成功！');
        console.log(`📊 向量前5个值: [${record.embedding.slice(0, 5).join(', ')}...]`);
      }
    } else {
      console.log('❌ 没有找到新记录');
    }
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
  }
}

debugUpload();
