// 测试CSV上传功能
import { createClient } from '@supabase/supabase-js';
import Papa from 'papaparse';
import fs from 'fs';

const SUPABASE_URL = "https://ijrbyfpesocafkkwmfht.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqcmJ5ZnBlc29jYWZra3dtZmh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMDcxNDQsImV4cCI6MjA3MTc4MzE0NH0.ZGjfGxJrPdA0xXliixUjFDK7vapEJKxIs56LorPRImM";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testCsvUpload() {
  console.log('🧪 测试CSV上传功能...\n');

  try {
    // 1. 读取CSV文件
    console.log('📖 读取test-data.csv文件...');
    const csvContent = fs.readFileSync('test-data.csv', 'utf8');
    
    // 2. 解析CSV
    console.log('🔍 解析CSV内容...');
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
    console.log(`✅ 成功解析 ${rawItems.length} 行数据`);

    // 3. 处理数据
    const processedItems = rawItems.map(item => ({
      ...item,
      category: item.category || 'travel_guide',
      location: item.location || null,
      source_name: 'test-data.csv',
      tags: []
    })).filter(item => 
      (item.question && item.answer) || item.content
    );

    console.log(`📊 处理后有效数据: ${processedItems.length} 条`);
    processedItems.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.question} (${item.category}, ${item.location})`);
    });

    // 4. 调用向量化上传函数
    console.log('\n📤 调用formolly-upload-knowledge函数...');
    
    const { data, error } = await supabase.functions.invoke('formolly-upload-knowledge', {
      body: { knowledgeItems: processedItems }
    });

    if (error) {
      console.error('❌ 函数调用错误:', error);
      return;
    }

    console.log('✅ 函数调用成功');
    console.log('📊 结果:', JSON.stringify(data, null, 2));

    // 5. 验证数据库
    console.log('\n🔍 验证数据库中的新数据...');
    const { data: dbData, error: dbError } = await supabase
      .from('formolly_travel_knowledge')
      .select('*')
      .eq('source_name', 'test-data.csv');

    if (dbError) {
      console.error('❌ 数据库查询错误:', dbError);
    } else {
      console.log(`✅ 数据库中找到 ${dbData.length} 条来自test-data.csv的记录`);
    }

  } catch (err) {
    console.error('❌ 测试失败:', err.message);
    console.error('详细错误:', err);
  }
}

testCsvUpload();
