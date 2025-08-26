import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { 
  generateIntelligentName, 
  processHtmlContent, 
  processTextContent,
  processImageWithVision 
} from './lib/openai.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let documentId: string | null = null;
  try {
    const body = await req.json();
    documentId = body.documentId;
    console.log('Processing document:', documentId);

    // 获取文档信息
    const { data: document, error: docError } = await supabase
      .from('source_documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      console.error('Document not found:', docError);
      throw new Error('Document not found');
    }

    console.log('Document found:', {
      filename: document.filename,
      file_type: document.file_type,
      storage_path: document.storage_path
    });

    // 更新状态为处理中
    await supabase
      .from('source_documents')
      .update({ processing_status: 'processing' })
      .eq('id', documentId);

    let extractedText = '';

    // 根据文件类型进行不同的处理
    if (document.file_type === 'text/html' || document.filename.endsWith('.html')) {
      console.log('Processing as HTML file');
      extractedText = await processHtmlContent(document.storage_path, supabase, openaiApiKey);
    } else if (document.file_type === 'text/plain' || document.filename.endsWith('.txt')) {
      console.log('Processing as plain text file');
      extractedText = await processTextContent(document.storage_path, supabase);
    } else if (document.file_type.startsWith('image/')) {
      console.log('Processing image file with vision API');
      extractedText = await processImageWithVision(document.storage_path, document.file_type, supabase, openaiApiKey);
    } else if (document.file_type === 'application/pdf') {
      console.error('A PDF file was uploaded without being pre-processed on the client.');
      throw new Error('PDF files must be converted to text on the client side before processing.');
    } else {
      console.log(`Unknown file type (${document.file_type}), trying to process as text.`);
      try {
        extractedText = await processTextContent(document.storage_path, supabase);
      } catch (e) {
         throw new Error(`Unsupported file type: ${document.file_type}. Could not process as text.`);
      }
    }

    console.log('Extracted text length:', extractedText.length);

    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error('No text was extracted from the document');
    }

    // 生成智能文档名称
    console.log('Generating intelligent document name...');
    const intelligentName = await generateIntelligentName(extractedText, document.filename, openaiApiKey);
    console.log('Generated name:', intelligentName);

    // 保存提取的文本和智能命名
    const { error: updateError } = await supabase
      .from('source_documents')
      .update({ 
        extracted_text: extractedText,
        filename: intelligentName,
        processing_status: 'completed',
        processed_at: new Date().toISOString()
      })
      .eq('id', documentId);

    if (updateError) {
      console.error('Error updating document:', updateError);
      throw updateError;
    }

    console.log('Document updated successfully with intelligent name');

    return new Response(
      JSON.stringify({ 
        success: true, 
        intelligentName: intelligentName,
        extractedText: extractedText.substring(0, 500) + '...',
        textLength: extractedText.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing document:', error);
    
    // 更新状态为失败
    if (documentId) {
      try {
        await supabase
          .from('source_documents')
          .update({ 
            processing_status: 'failed',
            extracted_text: `Error: ${error.message}`
          })
          .eq('id', documentId);
      } catch (updateError) {
        console.error('Error updating failed status:', updateError);
      }
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
