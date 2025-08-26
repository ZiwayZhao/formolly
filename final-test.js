// 最终完整测试
import { createClient } from '@supabase/supabase-js';
import Papa from 'papaparse';
import fs from 'fs';

const supabaseUrl = 'https://ijrbyfpesocafkkwmfht.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqcmJ5ZnBlc29jYWZra3dtZmh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMDcxNDQsImV4cCI6MjA3MTc4MzE0NH0.ZGjfGxJrPdA0xXliixUjFDK7vapEJKxIs56LorPRImM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function finalTest() {
  console.log('🎯 最终完整测试 - 模拟前端完整流程\n');
  
  try {
    // 1. 读取和解析CSV文件（完全模拟前端）
    console.log('1️⃣ 读取CSV文件...');
    const csvContent = fs.readFileSync('clean-test.csv', 'utf8');
    console.log('📄 CSV内容:');
    console.log(csvContent);
    
    // 2. 解析CSV（完全模拟前端Papa.parse）
    console.log('\n2️⃣ 解析CSV...');
    const parseResult = Papa.parse(csvContent, {
      header: true,
      encoding: 'UTF-8',
      skipEmptyLines: true
    });
    
    if (parseResult.errors.length > 0) {
      console.error('❌ CSV解析错误:', parseResult.errors);
      return;
    }
    
    const rawItems = parseResult.data;
    console.log(`✅ 解析成功，共 ${rawItems.length} 条记录`);
    
    // 3. 处理数据（完全模拟前端processKnowledgeItems）
    console.log('\n3️⃣ 处理数据...');
    const processedItems = rawItems.map(item => ({
      ...item,
      category: item.category || 'travel_guide',
      location: item.location || null,
      source_name: 'clean-test.csv',
      tags: item.tags || []
    })).filter(item => 
      (item.question && item.answer) || item.content
    );
    
    console.log(`✅ 处理完成，有效数据 ${processedItems.length} 条`);
    processedItems.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.question} (${item.category}, ${item.location})`);
    });
    
    // 4. 调用后端函数（完全模拟前端）
    console.log('\n4️⃣ 调用后端函数...');
    const { data, error } = await supabase.functions.invoke('formolly-upload-knowledge', {
      body: { knowledgeItems: processedItems }
    });

    if (error) {
      console.error('❌ 函数调用错误:', error);
      return;
    }
    
    console.log('📊 上传结果:', JSON.stringify(data, null, 2));
    
    // 5. 测试聊天功能
    console.log('\n5️⃣ 测试聊天功能...');
    const { data: chatData, error: chatError } = await supabase.functions.invoke('formolly-chat-simple', {
      body: {
        message: '巴黎最好的咖啡厅在哪里？',
        category: null,
        location: null
      }
    });
    
    if (chatError) {
      console.error('❌ 聊天功能错误:', chatError);
    } else {
      console.log('✅ 聊天功能正常');
      console.log(`💬 AI回答: ${chatData.response}`);
    }
    
    console.log('\n🎉 所有测试完成！');
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
    console.error('详细错误:', error);
  }
}

finalTest();
