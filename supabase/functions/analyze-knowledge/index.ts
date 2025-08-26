
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

function getSystemPrompt(): string {
  return `
You are a professional, rigorous expert in extracting knowledge for college application guidance. Your core mission is to **precisely segment** a given long text into multiple independent, valuable knowledge units, and extract structured information for each unit.

---

### **Core Instructions (Must be strictly followed)**

1.  **Mandatory Segmentation (Most Important Rule)**:
    *   When analyzing the text, you must identify all independent topics, steps, aspects, or events and segment them into **separate knowledge units**.
    *   For example, an article about university admissions should be segmented into different units for topics like "**School Profile**," "**Application Process**," "**Initial Screening Criteria**," "**Medical Examination Requirements**," "**Program Introduction**," "**Tuition and Accommodation," and "**Graduate Destinations**."
    *   **Absolutely forbid** merging information into one giant unit just because it's about the same entity (like the same university or program). Every independent piece of knowledge should be a separate unit.
    *   The ideal length for each unit's content is **150-500 words** to ensure the information is both complete and focused.

2.  **Structured Extraction**:
    *   For **every** knowledge unit you segment, you must extract its core information and structure it.
    *   **Must include a \`项目名称\` field**, which serves as a short, clear title for the knowledge unit. For example: "PLA Naval Aviation University - Flight Cadet Initial Screening," or "Xi'an Jiaotong-Liverpool University - Tuition Fees."
    *   Based on the unit's content, extract other relevant fields as much as possible, such as "项目性质" (Nature), "适用人群" (Target Audience), "关键日期" (Key Dates), "费用标准" (Fee Standard), "录取要求" (Admission Requirements), "核心课程" (Core Courses), etc. Field names should be clear and standardized.

3.  **Generate \`content\` Field**:
    *   Each unit **must** have a \`content\` field.
    *   The \`content\` field should be a **refined, coherent summary** of the unit's content, not a simple copy-paste of the original text. This part will serve as the core text for the knowledge base entry.

4.  **Preserve Context for Evaluation**:
    *   When a knowledge unit contains evaluative information (e.g., admission difficulty, program characteristics, suitability for certain students), ensure the \`content\` field includes **sufficient surrounding context from the original text**.
    *   Instead of aggressive summarization, **retain key phrases and specific details** that help a user understand *why* a certain evaluation is made. The goal is to capture the nuance of the evaluation.
    *   If applicable, you can create a dedicated **"综合评价" (Comprehensive Evaluation)** field to summarize these points, but the main \`content\` field should still be rich with context.

---

### **Output Format**

Please strictly follow the JSON format below. The \`units\` array **must contain multiple** units segmented from the original text (unless the text is very short and truly contains only one point of knowledge).

\`\`\`json
{
  "units": [
    {
      "项目名称": "海军航空大学2024年招飞初检",
      "content": "海军航空大学的招飞初检通常在每年10月至11月进行。考生会收到面试和初检通知，需在指定时间地点参加。初检主要包括眼科、内科、外科、耳鼻喉科等身体检查，对视力、身高、体重有严格要求。",
      "项目性质": "招生流程",
      "关键日期": "每年10月-11月",
      "涉及项目": ["眼科检查", "内科检查", "外科检查", "耳鼻喉科检查"],
      "labels": ["海军航空大学", "招飞", "初检", "招生"],
      "importance": "high"
    },
    {
      "项目名称": "海军航空大学招飞体检标准",
      "content": "海军航空大学的招飞体检标准非常严格，参照《军队院校招收学员体格检查标准》。其中，对视力的要求尤其高，例如使用C字视力表，双眼裸眼远视力不低于0.8。此外，无色盲、色弱，无纹身、刺字。",
      "项目性质": "录取要求",
      "参考标准": "《军队院校招收学员体格检查标准》",
      "关键要求": ["C字视力表不低于0.8", "无色盲色弱", "无纹身"],
      "labels": ["海军航空大学", "招飞", "体检标准", "录取要求"],
      "importance": "critical"
    }
  ],
  "summary": "A brief summary of the entire document's content.",
  "autoApproved": false
}
\`\`\`
`;
}

async function analyzeWithOpenAI(text: string, documentName: string): Promise<string> {
  if (!openaiApiKey) {
    throw new Error('OPENAI_API_KEY is not set in environment variables.');
  }
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: getSystemPrompt() },
        { role: 'user', content: `Document Name: ${documentName}\n\nDocument Content:\n${text}` }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error('Invalid response structure from OpenAI API');
  }
  return data.choices[0].message.content;
}

function parseAndValidateResponse(rawResponse: string): any {
  let parsed;
  try {
    parsed = JSON.parse(rawResponse);
  } catch (e) {
    console.error("JSON parsing failed for:", rawResponse);
    throw new Error("AI response was not valid JSON.");
  }

  if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.units)) {
    throw new Error('Parsed response is not a valid object or "units" is not an array.');
  }
  
  const validUnits = parsed.units.filter((unit: any) => 
    unit &&
    typeof unit === 'object' &&
    typeof unit['项目名称'] === 'string' && unit['项目名称'].length > 0 &&
    typeof unit['content'] === 'string' && unit['content'].length > 0
  );

  return {
    ...parsed,
    units: validUnits,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const startTime = Date.now();
    const { text, documentName } = await req.json();

    if (!text || text.trim().length < 100) {
      return new Response(JSON.stringify({ error: "Text content is too short for analysis." }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Analyzing document: ${documentName}, length: ${text.length}`);
    const analysisResult = await analyzeWithOpenAI(text, documentName);
    const result = parseAndValidateResponse(analysisResult);

    console.log(`Analysis complete. Found ${result.units.length} units in ${Date.now() - startTime}ms.`);
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Analysis function error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
