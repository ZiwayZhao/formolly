import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // 批量处理知识项目（暂时不生成向量）
    for (const item of knowledgeItems) {
      try {
        // 1. 准备内容
        let contentForStorage = '';
        if (item.question && item.answer) {
          contentForStorage = `问题: ${item.question}\n回答: ${item.answer}`;
        } else {
          contentForStorage = item.content || item.question || '';
        }

        if (!contentForStorage.trim()) {
          throw new Error('Empty content');
        }

        // 2. 准备数据库记录（不包含embedding）
        const knowledgeRecord = {
          content: contentForStorage,
          entities: item.question && item.answer ? { 
            question: item.question, 
            answer: item.answer 
          } : (item.entities || {}),
          source_name: item.source_name || 'CSV Upload',
          data_type: item.question && item.answer ? 'qa' : 'text',
          category: item.category || 'travel_guide',
          location: item.location || null,
          tags: item.tags || [],
          // embedding: null, // 暂时不生成向量
        };

        // 3. 插入到数据库
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
      note: "Data uploaded without vector embeddings. Chat function may not work optimally."
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Formolly Upload Simple Error:', error.message);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
