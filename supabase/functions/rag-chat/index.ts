
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const openaiApiKey = Deno.env.get('OPENAI_API_KEY')

const attributeNameMap: { [key: string]: string } = {
  further_study_rate: '升学率',
  further_study_destination: '升学去向',
  employment_rate: '就业率',
  employment_destination: '就业去向',
  recommendations: '建议',
};

async function searchStructuredData(supabaseClient: any, schools: string[], majors: string[]): Promise<{ content: string }[]> {
  if (!schools || schools.length === 0 || !majors || majors.length === 0) {
    return [];
  }

  try {
    // For simplicity, search using the first detected school and all detected majors
    const { data: programs, error: progError } = await supabaseClient
      .from('school_programs')
      .select('id')
      .eq('school_name', schools[0])
      .in('program_name', majors);

    if (progError || !programs || programs.length === 0) {
      if(progError) console.warn('Error fetching school_programs:', progError.message);
      return [];
    }

    const programIds = programs.map((p: any) => p.id);

    const { data: tracks, error: trackError } = await supabaseClient
      .from('academic_tracks')
      .select('school_name, major_name, academic_track_attributes(*)')
      .in('program_id', programIds)
      .eq('status', 'approved');

    if (trackError || !tracks) {
      if (trackError) console.warn('Error fetching academic_tracks:', trackError.message);
      return [];
    }
    
    const snippets = tracks.flatMap((track: any) => {
        const approvedAttributes = track.academic_track_attributes.filter((attr: any) => attr.status === 'approved');
        if (approvedAttributes.length === 0) return [];
        
        let content = `关于“${track.school_name} - ${track.major_name}”的已核验信息：\n`;
        
        approvedAttributes.forEach((attr: any) => {
            const name = attributeNameMap[attr.attribute_name] || attr.attribute_name;
            content += `  - ${name}${attr.year ? ` (${attr.year})` : ''}: ${attr.attribute_value}\n`;
        });
        
        return { content: content.trim() };
    });

    return snippets;

  } catch (e) {
    console.error('Structured search crashed:', e.message);
    return [];
  }
}

// 1. 查询理解：使用AI提取查询中的实体和关键词
async function understandQuery(query: string): Promise<{ keywords: string[], schools: string[], majors: string[] }> {
  const prompt = `
    Extract key entities from the user's query for a hybrid search system.
    The user is asking about college applications.
    Extract school names (including abbreviations), major names, and other important keywords.
    
    User Query: "${query}"
    
    Return a JSON object with the following structure:
    {
      "keywords": ["...", "..."],
      "schools": ["...", "..."],
      "majors": ["...", "..."]
    }
  `;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${openaiApiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.1,
    }),
  });

  if (!response.ok) return { keywords: query.split(' '), schools: [], majors: [] };
  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { message, category, importance } = await req.json();
    if (!message) throw new Error('Message content is empty');

    const supabaseClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    // 2. 并行执行向量搜索、关键词搜索和结构化数据搜索
    // 2a. 生成查询向量
    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${openaiApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'text-embedding-ada-002', input: message }),
    });
    if (!embeddingResponse.ok) throw new Error('Failed to generate query embedding');
    const { data: [{ embedding: queryEmbedding }] } = await embeddingResponse.json();

    // 2b. 向量搜索
    const vectorSearchPromise = supabaseClient.rpc('search_knowledge_units', {
      query_embedding: queryEmbedding,
      match_threshold: 0.7,
      match_count: 10,
      filter_category: category === 'all' ? null : category,
      filter_importance: importance === 'all' ? null : importance,
    });

    // 2c. 关键词与实体提取
    const { keywords, schools, majors } = await understandQuery(message);
    const keywordSearchTerms = [...new Set([...keywords, ...schools, ...majors])].filter(Boolean);

    let keywordSearchPromise = null;
    if (keywordSearchTerms.length > 0) {
      const keywordFilter = keywordSearchTerms.map(term => `keywords.cs.{"${term}"}`).join(',');
      const schoolFilter = schools.length > 0 ? `,school_names.cs.{${schools.join(',')}}` : '';
      const majorFilter = majors.length > 0 ? `,major_names.cs.{${majors.join(',')}}` : '';
      
      keywordSearchPromise = supabaseClient
        .from('knowledge_units')
        .select('id, content, category, importance, labels, school_names, major_names')
        .or(`${keywordFilter}${schoolFilter}${majorFilter}`)
        .limit(10);
    }
    
    // 2d. (新增) 结构化数据搜索
    const structuredSearchPromise = searchStructuredData(supabaseClient, schools, majors);
    
    // 3. 结果融合与去重
    const [vectorResults, keywordResults, structuredResults] = await Promise.all([
        vectorSearchPromise, 
        keywordSearchPromise,
        structuredSearchPromise
    ]);
    if (vectorResults.error) throw new Error(`Vector search failed: ${vectorResults.error.message}`);
    if (keywordResults?.error) console.warn(`Keyword search failed: ${keywordResults.error.message}`);
    
    const combinedResults = new Map();
    (vectorResults.data || []).forEach((item: any) => combinedResults.set(item.id, { ...item, score: item.similarity }));
    (keywordResults?.data || []).forEach((item: any) => {
      if (!combinedResults.has(item.id)) {
        combinedResults.set(item.id, { ...item, score: 0.7 }); // Assign a base score for keyword matches
      } else {
        combinedResults.get(item.id).score += 0.1; // Boost score for items found in both searches
      }
    });

    const finalResults = Array.from(combinedResults.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);

    // 4. 构建上下文并生成回答
    const unstructuredContext = finalResults.map(r => `[分类: ${r.category}] [重要性: ${r.importance}]\n${r.content}`).join('\n\n---\n\n');
    
    const structuredContext = (structuredResults && (structuredResults as any[]).length > 0)
      ? (structuredResults as { content: string }[]).map(r => `[来源: 核心数据库]\n${r.content}`).join('\n\n---\n\n')
      : '';

    const context = (structuredContext ? `${structuredContext}\n\n---\n\n` : '') + (unstructuredContext || "未在知识库中找到相关信息。");
    
    const systemPrompt = `You are "聚火盆 AI", an expert assistant for college applications.
- Answer based ONLY on the provided "Knowledge Base Context".
- The context may contain verified facts from a core database and additional info from a general knowledge base. Prioritize the verified facts from the core database.
- If the context is empty or irrelevant, state that you don't have enough information. DO NOT invent answers.
- Be objective, accurate, and use full school names like "宁波诺丁汉大学" (not "宁诺").
- Format your answer clearly using paragraphs and bullet points.`;

    const responsePrompt = `
      Knowledge Base Context:
      ---
      ${context || "No relevant information found."}
      ---
      User's Question: ${message}

      Please provide your answer:
    `;

    const chatResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${openaiApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: responsePrompt }
        ],
        temperature: 0.5,
      }),
    });

    if (!chatResponse.ok) throw new Error('Failed to generate AI response');
    const chatData = await chatResponse.json();
    const aiResponse = chatData.choices[0].message.content;

    return new Response(JSON.stringify({ response: aiResponse, sources: finalResults }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('RAG Chat Error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
