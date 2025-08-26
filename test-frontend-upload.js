// 测试前端CSV上传功能
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ijrbyfpesocafkkwmfht.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqcmJ5ZnBlc29jYWZra3dtZmh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMDcxNDQsImV4cCI6MjA3MTc4MzE0NH0.ZGjfGxJrPdA0xXliixUjFDK7vapEJKxIs56LorPRImM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFrontendUpload() {
  console.log('🧪 测试前端CSV上传功能...\n');
  
  // 模拟前端上传的数据格式
  const frontendTestData = [
    {
      question: '前端测试问题1',
      answer: '这是前端测试的回答1',
      category: 'test',
      location: '测试地点1',
      source_name: '前端测试'
    },
    {
      question: '前端测试问题2', 
      answer: '这是前端测试的回答2',
      category: 'travel_guide',
      location: '测试地点2',
      source_name: '前端测试'
    }
  ];
  
  try {
    console.log('📤 模拟前端调用formolly-upload-knowledge...');
    console.log('📊 测试数据:', JSON.stringify(frontendTestData, null, 2));
    
    const { data, error } = await supabase.functions.invoke('formolly-upload-knowledge', {
      body: { knowledgeItems: frontendTestData }
    });

    if (error) {
      console.error('❌ 函数调用错误:', error);
      return;
    }
    
    console.log('📊 上传结果:', JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log(`✅ 上传成功: ${data.successCount}/${data.processed} 条记录`);
      
      if (data.errorCount > 0) {
        console.log(`❌ 失败记录数: ${data.errorCount}`);
        console.log('❌ 错误详情:', data.errors);
      }
    } else {
      console.log('❌ 上传失败:', data.error);
    }
    
    // 测试聊天功能
    console.log('\n💬 测试聊天功能...');
    const { data: chatData, error: chatError } = await supabase.functions.invoke('formolly-chat-simple', {
      body: {
        message: '前端测试问题1',
        category: null,
        location: null
      }
    });
    
    if (chatError) {
      console.error('❌ 聊天功能错误:', chatError);
    } else {
      console.log('✅ 聊天功能正常');
      console.log(`💬 AI回答: ${chatData.response.substring(0, 200)}...`);
    }
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
  }
}

testFrontendUpload();
