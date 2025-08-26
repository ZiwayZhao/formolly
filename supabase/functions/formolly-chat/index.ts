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
    const { message, category, location } = await req.json();
    if (!message) throw new Error('Message content is empty');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 1. 生成查询向量 (使用OpenAI)
    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${openaiApiKey}`, 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        model: 'text-embedding-ada-002', 
        input: message 
      }),
    });
    
    if (!embeddingResponse.ok) throw new Error('Failed to generate query embedding');
    const { data: [{ embedding: queryEmbedding }] } = await embeddingResponse.json();

    // 2. 向量搜索旅行知识库
    const { data: searchResults, error: searchError } = await supabaseClient.rpc('search_travel_knowledge', {
      query_embedding: queryEmbedding,
      match_threshold: 0.7,
      match_count: 8,
      filter_category: category === 'all' ? null : category,
      filter_location: location || null,
    });

    if (searchError) {
      console.error('Vector search error:', searchError);
    }

    // 3. 构建上下文
    const relevantKnowledge = searchResults || [];
    const context = relevantKnowledge
      .map(result => {
        const locationInfo = result.location ? `[地点: ${result.location}]` : '';
        const categoryInfo = `[分类: ${result.category}]`;
        
        // 如果是问答对，显示问答格式
        if (result.entities && result.entities.question && result.entities.answer) {
          return `${locationInfo} ${categoryInfo}\n问题: ${result.entities.question}\n回答: ${result.entities.answer}`;
        }
        
        // 否则显示内容
        return `${locationInfo} ${categoryInfo}\n${result.content}`;
      })
      .join('\n\n---\n\n');

    // 4. 专门为Ziway设计的系统提示词
    const systemPrompt = `你是Ziway，Molly的AI旅行助手和欧洲生活向导。你的特点：

🌍 身份设定：
- 你是Ziway，一个热爱欧洲、经验丰富的旅行者
- 你专门为好朋友Molly准备了丰富的欧洲生活和旅行经验
- 你的回答风格友好、实用、贴心，就像朋友间的建议

📚 知识来源：
- 基于提供的"知识库内容"回答问题
- 如果知识库中没有相关信息，诚实地告知并提供一般性建议
- 优先使用知识库中的具体信息，如地址、价格、时间等

🎯 回答原则：
- 实用性第一：提供具体、可操作的建议
- 个性化：考虑Molly的需求和偏好
- 安全提醒：涉及安全问题时要特别提醒
- 文化敏感：尊重当地文化差异
- 预算友好：提供不同预算选择

💬 回答格式：
- 使用友好的语气，可以适当使用表情符号
- 结构清晰，使用要点和段落
- 提供具体的建议和替代方案
- 必要时提供相关的注意事项`;

    const userPrompt = `
知识库内容：
---
${context || "暂无相关的旅行知识库信息"}
---

Molly的问题：${message}

请以Ziway的身份，基于知识库内容为Molly提供详细、实用的回答：
`;

    // 5. 调用OpenAI生成回答
    const chatResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${openaiApiKey}`, 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!chatResponse.ok) throw new Error('Failed to generate AI response');
    const chatData = await chatResponse.json();
    const aiResponse = chatData.choices[0].message.content;

    // 6. 可选：保存聊天历史
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await supabaseClient
      .from('formolly_chat_history')
      .insert({
        session_id: sessionId,
        message: message,
        response: aiResponse,
        sources: relevantKnowledge.slice(0, 3), // 保存前3个最相关的来源
      });

    return new Response(JSON.stringify({ 
      response: aiResponse, 
      sources: relevantKnowledge,
      session_id: sessionId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Formolly Chat Error:', error.message);
    return new Response(JSON.stringify({ 
      error: error.message,
      response: '抱歉，我现在无法回答你的问题。请稍后再试，或者尝试换一种方式提问。'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
