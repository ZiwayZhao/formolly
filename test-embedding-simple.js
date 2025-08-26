// 直接测试embedding API
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://ijrbyfpesocafkkwmfht.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqcmJ5ZnBlc29jYWZra3dtZmh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMDcxNDQsImV4cCI6MjA3MTc4MzE0NH0.ZGjfGxJrPdA0xXliixUjFDK7vapEJKxIs56LorPRImM";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 创建一个简单的测试函数
const testFunction = `
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openrouterApiKey = Deno.env.get('OPENROUTER_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { text } = await req.json();
    
    const embeddingResponse = await fetch('https://openrouter.ai/api/v1/embeddings', {
      method: 'POST',
      headers: { 
        'Authorization': \`Bearer \${openrouterApiKey}\`, 
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://formolly.app',
        'X-Title': 'Formolly Travel Assistant'
      },
      body: JSON.stringify({ 
        model: 'openai/text-embedding-ada-002', 
        input: text 
      }),
    });
    
    if (!embeddingResponse.ok) {
      const errorText = await embeddingResponse.text();
      return new Response(JSON.stringify({
        success: false,
        error: \`API Error \${embeddingResponse.status}: \${errorText.substring(0, 500)}\`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const data = await embeddingResponse.json();
    
    return new Response(JSON.stringify({
      success: true,
      embedding_length: data.data[0].embedding.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
`;

console.log('这个测试函数代码可以创建为test-embedding函数来调试API问题');
console.log('或者我们可以直接测试现有的formolly-chat函数的embedding部分...');

async function testExistingEmbedding() {
  console.log('🧪 测试现有的向量化聊天函数...');
  
  try {
    const { data, error } = await supabase.functions.invoke('formolly-chat', {
      body: { 
        message: "测试向量化",
        category: null,
        location: null
      }
    });

    if (error) {
      console.error('❌ 函数调用错误:', error);
      return;
    }

    console.log('✅ 向量化聊天函数工作正常:', data.response ? '成功' : '失败');
    
  } catch (err) {
    console.error('❌ 测试失败:', err.message);
  }
}

testExistingEmbedding();
