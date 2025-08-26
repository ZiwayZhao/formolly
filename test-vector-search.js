// 测试向量搜索功能
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ijrbyfpesocafkkwmfht.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqcmJ5ZnBlc29jYWZra3dtZmh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMDcxNDQsImV4cCI6MjA3MTc4MzE0NH0.ZGjfGxJrPdA0xXliixUjFDK7vapEJKxIs56LorPRImM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testVectorSearch() {
  console.log('🧪 测试向量搜索功能...\n');
  
  try {
    // 1. 检查数据库中的向量化数据
    console.log('1️⃣ 检查数据库中的数据...');
    const { data: allData, error: selectError } = await supabase
      .from('formolly_travel_knowledge')
      .select('id, content, embedding, source_name')
      .limit(5);
    
    if (selectError) {
      console.error('❌ 查询数据库失败:', selectError);
      return;
    }
    
    console.log(`📊 找到 ${allData.length} 条记录`);
    allData.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.content.substring(0, 50)}...`);
      console.log(`     向量维度: ${item.embedding ? item.embedding.length : '无向量'}`);
      console.log(`     来源: ${item.source_name}`);
    });

    // 2. 测试formolly-chat函数（使用向量搜索）
    console.log('\n2️⃣ 测试向量搜索聊天功能...');
    const { data: chatData, error: chatError } = await supabase.functions.invoke('formolly-chat', {
      body: {
        message: '巴黎地铁怎么买票？',
        category: null,
        location: null
      }
    });

    if (chatError) {
      console.error('❌ 聊天函数调用失败:', chatError);
    } else {
      console.log('✅ 聊天函数调用成功');
      console.log(`📊 回答长度: ${chatData.response.length} 字符`);
      console.log(`📊 找到的相关来源: ${chatData.sources ? chatData.sources.length : 0} 个`);
      if (chatData.sources && chatData.sources.length > 0) {
        console.log('📚 相关来源:');
        chatData.sources.forEach((source, index) => {
          console.log(`  ${index + 1}. 相似度: ${source.similarity?.toFixed(3) || '未知'}`);
          console.log(`     内容: ${source.content.substring(0, 80)}...`);
        });
      }
      console.log(`💬 AI回答: ${chatData.response.substring(0, 200)}...`);
    }

    // 3. 测试formolly-chat-simple函数（不使用向量搜索）
    console.log('\n3️⃣ 测试简单聊天功能（无向量搜索）...');
    const { data: simpleData, error: simpleError } = await supabase.functions.invoke('formolly-chat-simple', {
      body: {
        message: '巴黎地铁怎么买票？',
        category: null,
        location: null
      }
    });

    if (simpleError) {
      console.error('❌ 简单聊天函数调用失败:', simpleError);
    } else {
      console.log('✅ 简单聊天函数调用成功');
      console.log(`📊 回答长度: ${simpleData.response.length} 字符`);
      console.log(`💬 AI回答: ${simpleData.response.substring(0, 200)}...`);
    }

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
  }
}

testVectorSearch();
