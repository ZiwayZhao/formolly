import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { arrayBufferToBase64 } from './utils.ts';
// 使用专门为服务器环境设计的 pdf.js legacy build，解决兼容性问题
import * as pdfjsLib from "https://esm.sh/pdfjs-dist@3.11.174/legacy/build/pdf.mjs";

export async function generateIntelligentName(content: string, originalFileName: string, openaiApiKey: string): Promise<string> {
  try {
    console.log('Calling OpenAI for intelligent naming...');
    
    // 截取内容前2000字符用于分析
    const contentForNaming = content.substring(0, 2000);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `你是一个专业的文档命名助手。请根据文档内容生成一个简洁、准确、有意义的中文文件名。要求：
1. 文件名应该反映文档的主要内容和主题
2. 长度控制在10-30个字符之间
3. 使用中文，避免特殊符号
4. 如果是教育相关内容，要体现学科、级别等信息
5. 如果是指南类内容，要体现具体领域
6. 直接返回文件名，不要添加任何解释`
          },
          {
            role: 'user',
            content: `请为以下文档内容生成一个智能文件名：

原文件名：${originalFileName}

文档内容：
${contentForNaming}`
          }
        ],
        max_tokens: 100,
        temperature: 0.3
      }),
    });

    if (!response.ok) {
      console.error('OpenAI naming API error:', response.status);
      return originalFileName;
    }

    const result = await response.json();
    
    if (!result.choices || !result.choices[0] || !result.choices[0].message) {
      console.error('Invalid response from OpenAI naming API');
      return originalFileName;
    }

    let intelligentName = result.choices[0].message.content.trim();
    
    // 清理生成的名称，移除可能的引号和特殊字符
    intelligentName = intelligentName.replace(/["""'']/g, '').trim();
    
    // 确保名称不为空且合理
    if (!intelligentName || intelligentName.length < 3) {
      console.log('Generated name too short, using original');
      return originalFileName;
    }

    // 如果原文件名有扩展名，保留扩展名
    const lastDotIndex = originalFileName.lastIndexOf('.');
    if (lastDotIndex > 0) {
      const extension = originalFileName.substring(lastDotIndex);
      if (!intelligentName.endsWith(extension)) {
        intelligentName += extension;
      }
    }

    console.log('Successfully generated intelligent name:', intelligentName);
    return intelligentName;

  } catch (error) {
    console.error('Error generating intelligent name:', error);
    return originalFileName;
  }
}

export async function processHtmlContent(storagePath: string, supabase: SupabaseClient, openaiApiKey: string): Promise<string> {
  console.log('Processing HTML content from:', storagePath);
  
  try {
    // 从存储中获取HTML文件
    const { data, error } = await supabase.storage
      .from('documents')
      .download(storagePath);

    if (error) {
      console.error('Storage download error:', error);
      throw new Error(`Failed to download file: ${error.message}`);
    }

    if (!data) {
      throw new Error('File not found in storage');
    }

    const htmlContent = await data.text();
    console.log('HTML content length:', htmlContent.length);

    if (!htmlContent || htmlContent.trim().length === 0) {
      throw new Error('HTML file is empty');
    }
    
    // 使用OpenAI提取纯文本内容
    console.log('Calling OpenAI API for text extraction');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: '你是一个专业的文本提取助手。请从HTML内容中提取出纯文本，去除所有HTML标签、样式和脚本，保留文章的主要内容和结构。请直接返回提取的文本内容，不要添加任何说明或格式化。'
          },
          {
            role: 'user',
            content: `请提取以下HTML内容中的纯文本：\n\n${htmlContent}`
          }
        ],
        max_tokens: 4000,
        temperature: 0.1
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
    }

    const result = await response.json();

    if (!result.choices || !result.choices[0] || !result.choices[0].message) {
      throw new Error('Invalid response from OpenAI API');
    }

    const extractedText = result.choices[0].message.content;

    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error('OpenAI returned empty text');
    }

    return extractedText;
  } catch (error) {
    console.error('Error in processHtmlContent:', error);
    throw error;
  }
}

export async function processTextContent(storagePath: string, supabase: SupabaseClient): Promise<string> {
  console.log('Processing plain text content from:', storagePath);
  
  try {
    // 从存储中获取文本文件
    const { data, error } = await supabase.storage
      .from('documents')
      .download(storagePath);

    if (error) {
      console.error('Storage download error:', error);
      throw new Error(`Failed to download file: ${error.message}`);
    }

    if (!data) {
      throw new Error('File not found in storage');
    }

    const textContent = await data.text();
    console.log('Text content length:', textContent.length);

    if (!textContent || textContent.trim().length === 0) {
      throw new Error('Text file is empty or contains no text.');
    }

    return textContent;
  } catch (error) {
    console.error('Error in processTextContent:', error);
    throw error;
  }
}

export async function processImageWithVision(storagePath: string, fileType: string, supabase: SupabaseClient, openaiApiKey: string): Promise<string> {
  console.log('Processing image with vision API:', storagePath, fileType);
  
  try {
    // 确保只处理图片文件
    if (!fileType.startsWith('image/')) {
      throw new Error('This function only supports image files');
    }

    // 从存储中获取文件
    const { data, error } = await supabase.storage
      .from('documents')
      .download(storagePath);

    if (error) {
      console.error('Storage download error:', error);
      throw new Error(`Failed to download file: ${error.message}`);
    }

    if (!data) {
      throw new Error('File not found in storage');
    }

    const arrayBuffer = await data.arrayBuffer();
    
    // 检查文件大小，避免处理过大的文件
    if (arrayBuffer.byteLength > 20 * 1024 * 1024) { // 20MB 限制
      throw new Error('Image file too large for processing');
    }
    
    console.log('Image file size:', arrayBuffer.byteLength, 'bytes');
    
    // 使用安全的 base64 编码方法
    const base64 = arrayBufferToBase64(arrayBuffer);
    
    console.log('Processing image with mime type:', fileType);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: '你是一个专业的OCR（光学字符识别）引擎。你的任务是从提供的图像文件中提取所有文本。不要对图像进行总结、描述或评论。你的唯一输出应该是图像中的原始文本。'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: '请从这个图像文件中提取所有文本。'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${fileType};base64,${base64}`
                }
              }
            ]
          }
        ],
        max_tokens: 4000
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI Vision API error:', response.status, errorText);
      throw new Error(`OpenAI Vision API error: ${response.status} ${errorText}`);
    }

    const result = await response.json();

    if (!result.choices || !result.choices[0] || !result.choices[0].message) {
      throw new Error('Invalid response from OpenAI Vision API');
    }

    const extractedText = result.choices[0].message.content;
    
    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error('OpenAI Vision returned empty text');
    }

    return extractedText;
  } catch (error) {
    console.error('Error in processImageWithVision:', error);
    throw error;
  }
}
