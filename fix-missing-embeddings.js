// 修复缺失的向量
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ijrbyfpesocafkkwmfht.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqcmJ5ZnBlc29jYWZra3dtZmh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMDcxNDQsImV4cCI6MjA3MTc4MzE0NH0.ZGjfGxJrPdA0xXliixUjFDK7vapEJKxIs56LorPRImM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixMissingEmbeddings() {
  console.log('🔧 修复缺失的向量...\n');
  
  try {
    // 1. 查找没有向量的记录
    console.log('1️⃣ 查找没有向量的记录...');
    const { data: recordsWithoutEmbedding, error: selectError } = await supabase
      .from('formolly_travel_knowledge')
      .select('id, content, source_name')
      .is('embedding', null);
    
    if (selectError) {
      console.error('❌ 查询失败:', selectError);
      return;
    }
    
    console.log(`📊 找到 ${recordsWithoutEmbedding.length} 条没有向量的记录`);
    
    if (recordsWithoutEmbedding.length === 0) {
      console.log('✅ 所有记录都已有向量');
      return;
    }
    
    // 2. 为每条记录生成向量
    console.log('\n2️⃣ 为记录生成向量...');
    
    for (let i = 0; i < recordsWithoutEmbedding.length; i++) {
      const record = recordsWithoutEmbedding[i];
      console.log(`处理记录 ${i + 1}/${recordsWithoutEmbedding.length}: ${record.content.substring(0, 50)}...`);
      
      try {
        // 调用OpenAI API生成向量
        const response = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'text-embedding-ada-002',
            input: record.content
          })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ OpenAI API错误 (${response.status}): ${errorText}`);
          continue;
        }
        
        const embeddingData = await response.json();
        const embedding = embeddingData.data[0].embedding;
        
        // 更新数据库记录
        const { error: updateError } = await supabase
          .from('formolly_travel_knowledge')
          .update({ embedding: embedding })
          .eq('id', record.id);
        
        if (updateError) {
          console.error(`❌ 更新记录失败:`, updateError);
        } else {
          console.log(`✅ 成功更新记录 ${record.id}`);
        }
        
        // 避免API限制，稍微延迟
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ 处理记录 ${record.id} 时发生错误:`, error.message);
      }
    }
    
    // 3. 验证结果
    console.log('\n3️⃣ 验证修复结果...');
    const { data: finalCheck, error: finalError } = await supabase
      .from('formolly_travel_knowledge')
      .select('id, embedding')
      .is('embedding', null);
    
    if (finalError) {
      console.error('❌ 最终验证失败:', finalError);
    } else {
      console.log(`📊 修复完成，还有 ${finalCheck.length} 条记录没有向量`);
      
      if (finalCheck.length === 0) {
        console.log('🎉 所有记录现在都有向量了！');
      }
    }
    
  } catch (error) {
    console.error('❌ 修复过程中发生错误:', error.message);
  }
}

fixMissingEmbeddings();
