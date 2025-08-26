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

    // 简单的关键词搜索，不使用向量
    let searchResults = [];
    try {
      const { data, error } = await supabaseClient
        .from('formolly_travel_knowledge')
        .select('*')
        .textSearch('content', message, {
          type: 'websearch',
          config: 'simple'
        })
        .limit(5);

      if (!error && data) {
        searchResults = data;
      }
    } catch (searchError) {
      console.log('Text search failed, trying simple filter:', searchError);
      
      // 如果全文搜索失败，尝试简单的内容匹配
      const keywords = message.toLowerCase().split(' ').filter(word => word.length > 2);
      if (keywords.length > 0) {
        const { data } = await supabaseClient
          .from('formolly_travel_knowledge')
          .select('*')
          .ilike('content', `%${keywords[0]}%`)
          .limit(5);
        
        if (data) searchResults = data;
      }
    }

    // 如果没有找到相关内容，获取一些通用的旅行知识
    if (searchResults.length === 0) {
      const { data } = await supabaseClient
        .from('formolly_travel_knowledge')
        .select('*')
        .limit(3);
      
      if (data) searchResults = data;
    }

    // 构建上下文
    const context = searchResults.length > 0 
      ? searchResults.map(r => {
          const locationInfo = r.location ? `[地点: ${r.location}]` : '';
          const categoryInfo = `[分类: ${r.category}]`;
          return `${locationInfo} ${categoryInfo}\n${r.content}`;
        }).join('\n\n---\n\n')
      : '暂无相关的旅行知识库信息。';

    // Ziway的系统提示词
    const systemPrompt = `你是Ziway，Molly的AI旅行助手和欧洲生活向导。你的特点：

🌍 身份设定：
- 你是Ziway，一个热爱欧洲、经验丰富的旅行者
- 你专门为好朋友Molly准备了丰富的欧洲生活和旅行经验
- 你的回答风格友好、实用、贴心，就像朋友间的建议

📚 知识来源：
- 基于提供的"知识库内容"回答问题
- 如果知识库中没有相关信息，可以提供一般性的欧洲旅行建议
- 优先使用知识库中的具体信息

🎯 回答原则：
- 实用性第一：提供具体、可操作的建议
- 个性化：考虑Molly的需求和偏好
- 安全提醒：涉及安全问题时要特别提醒
- 文化敏感：尊重当地文化差异
- 预算友好：提供不同预算选择

💬 回答格式：
- 使用友好的语气，可以适当使用表情符号
- 结构清晰，使用要点和段落
- 提供具体的建议和替代方案`;

    const userPrompt = `
知识库内容：
---
${context}
---

Molly的问题：${message}

请以Ziway的身份，为Molly提供详细、实用的回答：
`;

    // 调用OpenAI生成回答
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

    if (!chatResponse.ok) {
      const errorText = await chatResponse.text();
      throw new Error(`OpenAI API error: ${chatResponse.status} - ${errorText}`);
    }
    
    const chatData = await chatResponse.json();
    const aiResponse = chatData.choices[0].message.content;

    // 保存聊天历史
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await supabaseClient
      .from('formolly_chat_history')
      .insert({
        session_id: sessionId,
        message: message,
        response: aiResponse,
        sources: searchResults.slice(0, 3),
      });

    return new Response(JSON.stringify({ 
      response: aiResponse, 
      sources: searchResults,
      session_id: sessionId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Formolly Chat Simple Error:', error.message);
    return new Response(JSON.stringify({ 
      error: error.message,
      response: '抱歉，我现在遇到了一些技术问题，无法回答你的问题。请稍后再试，或者尝试换一种方式提问。😅'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
