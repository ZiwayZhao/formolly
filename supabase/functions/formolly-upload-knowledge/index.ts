import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { knowledgeItems } = await req.json();
    if (!knowledgeItems || !Array.isArray(knowledgeItems)) {
      throw new Error('Invalid knowledge items data');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // 批量处理知识项目
    for (const item of knowledgeItems) {
      try {
        // 1. 准备内容用于生成向量
        let contentForEmbedding = '';
        if (item.question && item.answer) {
          contentForEmbedding = `问题: ${item.question}\n回答: ${item.answer}`;
        } else {
          contentForEmbedding = item.content || item.question || '';
        }

        if (!contentForEmbedding.trim()) {
          throw new Error('Empty content for embedding');
        }

        // 2. 生成向量嵌入 (使用OpenAI)
        if (!openaiApiKey) {
          throw new Error('OPENAI_API_KEY is not configured');
        }

        const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${openaiApiKey}`, 
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            model: 'text-embedding-ada-002', 
            input: contentForEmbedding 
          }),
        });

        if (!embeddingResponse.ok) {
          const errorText = await embeddingResponse.text();
          throw new Error(`OpenAI API error (${embeddingResponse.status}): ${errorText.substring(0, 200)}`);
        }

        const embeddingData = await embeddingResponse.json();
        const embedding = embeddingData.data[0].embedding;

        // 3. 准备数据库记录
        const knowledgeRecord = {
          content: contentForEmbedding,
          entities: item.question && item.answer ? { 
            question: item.question, 
            answer: item.answer 
          } : (item.entities || {}),
          source_name: item.source_name || 'CSV Upload',
          data_type: item.question && item.answer ? 'qa' : 'text',
          category: item.category || 'travel_guide',
          location: item.location || null,
          tags: item.tags || [],
          embedding: embedding,
        };

        // 4. 插入到数据库
        const { error: insertError } = await supabaseClient
          .from('formolly_travel_knowledge')
          .insert(knowledgeRecord);

        if (insertError) {
          throw new Error(`Database insert failed: ${insertError.message}`);
        }

        successCount++;

      } catch (error) {
        errorCount++;
        errors.push(`Item ${successCount + errorCount}: ${error.message}`);
        console.error(`Error processing knowledge item:`, error);
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      processed: knowledgeItems.length,
      successCount,
      errorCount,
      errors: errors.slice(0, 10), // 只返回前10个错误
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Formolly Upload Knowledge Error:', error.message);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
