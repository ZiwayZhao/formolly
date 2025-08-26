// 详细测试向量搜索功能
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ijrbyfpesocafkkwmfht.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqcmJ5ZnBlc29jYWZra3dtZmh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMDcxNDQsImV4cCI6MjA3MTc4MzE0NH0.ZGjfGxJrPdA0xXliixUjFDK7vapEJKxIs56LorPRImM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDetailedVectorSearch() {
  console.log('🔍 详细测试向量搜索功能...\n');
  
  try {
    // 1. 检查所有记录的向量状态
    console.log('1️⃣ 检查所有记录的向量状态...');
    const { data: allRecords, error: selectError } = await supabase
      .from('formolly_travel_knowledge')
      .select('id, content, embedding, source_name, created_at')
      .order('created_at', { ascending: false });
    
    if (selectError) {
      console.error('❌ 查询失败:', selectError);
      return;
    }
    
    console.log(`📊 总记录数: ${allRecords.length}`);
    
    let withEmbedding = 0;
    let withoutEmbedding = 0;
    
    allRecords.forEach((record, index) => {
      const hasEmbedding = record.embedding && record.embedding.length > 0;
      if (hasEmbedding) {
        withEmbedding++;
      } else {
        withoutEmbedding++;
      }
      
      if (index < 10) { // 只显示前10条
        console.log(`  ${index + 1}. ${record.content.substring(0, 50)}...`);
        console.log(`     向量: ${hasEmbedding ? `✅ (${record.embedding.length}维)` : '❌ 无'}`);
        console.log(`     来源: ${record.source_name}`);
        console.log(`     时间: ${record.created_at}`);
        console.log('');
      }
    });
    
    console.log(`📊 统计: ${withEmbedding} 条有向量, ${withoutEmbedding} 条无向量\n`);
    
    // 2. 测试向量搜索RPC函数
    console.log('2️⃣ 测试向量搜索RPC函数...');
    
    // 先获取一个有向量的记录用于测试
    const recordWithEmbedding = allRecords.find(r => r.embedding && r.embedding.length > 0);
    
    if (!recordWithEmbedding) {
      console.log('❌ 没有找到有向量的记录，无法测试向量搜索');
      return;
    }
    
    console.log(`🎯 使用记录的向量进行搜索: ${recordWithEmbedding.content.substring(0, 50)}...`);
    
    const { data: searchResults, error: searchError } = await supabase.rpc('search_travel_knowledge', {
      query_embedding: recordWithEmbedding.embedding,
      match_threshold: 0.5,
      match_count: 5
    });
    
    if (searchError) {
      console.error('❌ 向量搜索RPC调用失败:', searchError);
    } else {
      console.log(`✅ 向量搜索成功，找到 ${searchResults.length} 个结果`);
      searchResults.forEach((result, index) => {
        console.log(`  ${index + 1}. 相似度: ${result.similarity.toFixed(3)}`);
        console.log(`     内容: ${result.content.substring(0, 80)}...`);
      });
    }
    
    // 3. 测试完整的聊天流程
    console.log('\n3️⃣ 测试完整的聊天流程...');
    const { data: chatResult, error: chatError } = await supabase.functions.invoke('formolly-chat', {
      body: {
        message: '测试向量化问题',  // 使用我们刚才上传的测试问题
        category: null,
        location: null
      }
    });
    
    if (chatError) {
      console.error('❌ 聊天功能失败:', chatError);
    } else {
      console.log('✅ 聊天功能成功');
      console.log(`📊 找到的来源数量: ${chatResult.sources ? chatResult.sources.length : 0}`);
      if (chatResult.sources && chatResult.sources.length > 0) {
        console.log('📚 找到的来源:');
        chatResult.sources.forEach((source, index) => {
          console.log(`  ${index + 1}. 相似度: ${source.similarity?.toFixed(3) || '未知'}`);
          console.log(`     内容: ${source.content.substring(0, 80)}...`);
        });
      }
      console.log(`💬 AI回答: ${chatResult.response.substring(0, 200)}...`);
    }
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
  }
}

testDetailedVectorSearch();
