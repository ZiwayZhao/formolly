
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmbeddingRequest {
  knowledgeUnitId?: string;
  content?: string;
  batchProcess?: boolean;
}

serve(async (req) => {
  console.log('generate-embeddings function invoked.');

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  let reqBody;
  try {
    reqBody = await req.json();
  } catch (e) {
    console.error('Error parsing request body:', e);
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    console.log('Request body:', reqBody);
    const { knowledgeUnitId, batchProcess }: EmbeddingRequest = reqBody

    if (batchProcess) {
      console.log('Starting batch process...');
      const { data: unprocessedUnits, error } = await supabaseClient
        .from('knowledge_units')
        .select('id, content')
        .is('embedding', null)
        .limit(50) 

      if (error) {
        throw new Error('获取待处理知识单元失败: ' + error.message);
      }
      
      console.log(`Found ${unprocessedUnits?.length || 0} units to process in batch.`);

      let processedCount = 0;

      for (const unit of unprocessedUnits || []) {
        try {
          await supabaseClient.from('knowledge_units').update({ embedding_status: 'processing', embedding_error: null }).eq('id', unit.id);
          
          const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: 'text-embedding-ada-002',
              input: unit.content,
            }),
          });

          if (!embeddingResponse.ok) {
            const errorBody = await embeddingResponse.text();
            throw new Error(`OpenAI API request failed: ${errorBody}`);
          }
          
          const embeddingData = await embeddingResponse.json();
          const embedding = embeddingData.data[0].embedding;

          await supabaseClient
            .from('knowledge_units')
            .update({ embedding, embedding_status: 'completed' })
            .eq('id', unit.id);

          processedCount++;
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (unitError) {
          console.error(`处理知识单元 ${unit.id} 失败:`, unitError);
          await supabaseClient.from('knowledge_units').update({ embedding_status: 'failed', embedding_error: unitError.message }).eq('id', unit.id);
        }
      }

      return new Response(
        JSON.stringify({
          message: `成功处理 ${processedCount} 个知识单元`,
          processedCount,
          totalFound: unprocessedUnits?.length || 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 单个知识单元处理
    console.log(`Processing single knowledge unit: ${knowledgeUnitId}`);
    if (!knowledgeUnitId) {
      throw new Error("此函数需要一个 knowledgeUnitId 来更新状态。");
    }

    console.log(`Updating status to 'processing' for unit ${knowledgeUnitId}`);
    await supabaseClient.from('knowledge_units').update({ embedding_status: 'processing', embedding_error: null }).eq('id', knowledgeUnitId);

    console.log(`Fetching content for unit ${knowledgeUnitId}`);
    const { data: unit, error: fetchError } = await supabaseClient
      .from('knowledge_units')
      .select('content')
      .eq('id', knowledgeUnitId)
      .single();

    if (fetchError) throw fetchError;
    const textToProcess = unit?.content;

    if (!textToProcess) {
      throw new Error('没有找到要处理的内容');
    }
    console.log(`Content to process for unit ${knowledgeUnitId}: "${textToProcess.substring(0, 50)}..."`);

    console.log('Calling OpenAI API for embedding...');
    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'text-embedding-ada-002',
        input: textToProcess,
      }),
    });

    if (!embeddingResponse.ok) {
      const errorBody = await embeddingResponse.text();
      console.error(`OpenAI API request failed for unit ${knowledgeUnitId}: ${errorBody}`);
      throw new Error(`生成向量失败: ${errorBody}`);
    }

    const embeddingData = await embeddingResponse.json();
    const embedding = embeddingData.data[0].embedding;

    console.log(`Successfully received embedding, updating unit ${knowledgeUnitId}`);
    await supabaseClient
      .from('knowledge_units')
      .update({ embedding, embedding_status: 'completed' })
      .eq('id', knowledgeUnitId);

    console.log(`Processing complete for unit ${knowledgeUnitId}`);

    return new Response(
      JSON.stringify({
        message: '向量生成成功'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('生成向量错误:', error);
    const knowledgeUnitId = reqBody?.knowledgeUnitId;
    if (knowledgeUnitId) {
       await supabaseClient
        .from('knowledge_units')
        .update({ embedding_status: 'failed', embedding_error: error.message })
        .eq('id', knowledgeUnitId);
    }
    return new Response(
      JSON.stringify({ 
        error: error.message || '向量生成失败' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
