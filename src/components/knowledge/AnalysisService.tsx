import { supabase } from '@/integrations/supabase/client';
import { QualityAssuranceService } from './QualityAssuranceService';

// This interface now represents the rich structure from the AI
interface ProcessingUnit {
  [key: string]: any;
}

interface AnalysisResult {
  units: ProcessingUnit[];
  autoApproved: boolean;
  debug?: any;
}

export class AnalysisService {
  static async testDatabaseConnection(): Promise<void> {
    const { error } = await supabase.from('knowledge_units').select('id').limit(1);
    if (error) {
      throw new Error(`数据库连接失败: ${error.message}`);
    }
  }

  static async analyzeContent(text: string, documentName: string): Promise<AnalysisResult> {
    console.log('调用 analyze-knowledge (v2) 函数');
    
    const { data, error } = await supabase.functions.invoke('analyze-knowledge', {
      body: { 
        text: text.trim(), 
        documentName: documentName.trim()
      }
    });

    if (error) {
      console.error('Supabase 函数调用错误:', error);
      throw new Error(`AI 分析服务错误: ${error.message}`);
    }
    if (data.error) {
      console.error('AI 分析返回错误:', data.error);
      throw new Error(`AI 分析失败: ${data.error}`);
    }
    if (!data || !Array.isArray(data.units)) {
      throw new Error('AI 分析服务未返回有效数据');
    }

    // 应用简化的质量保障流程
    const processedUnits = this.applySimplifiedQA(data.units);
    
    console.log('=== 分析与处理结果 ===');
    console.log(`AI提取单元数: ${data.units.length}`);
    console.log(`处理后单元数: ${processedUnits.length}`);

    return {
      units: processedUnits,
      autoApproved: data.autoApproved || false,
      debug: {
        unitsCount: processedUnits.length,
      }
    };
  }

  // Apply a simplified QA process suitable for the new structured data
  private static applySimplifiedQA(rawUnits: any[]): ProcessingUnit[] {
    console.log('=== 开始简化版质量保障流程 ===');
    
    // 1. Deduplicate based on '项目名称'
    const seen = new Set();
    const uniqueUnits = rawUnits.filter(unit => {
      const identifier = unit['项目名称'];
      if (!identifier || seen.has(identifier)) {
        return false;
      } else {
        seen.add(identifier);
        return true;
      }
    });
    console.log(`去重后单元数: ${uniqueUnits.length}`);

    return uniqueUnits;
  }
  
  static estimateAnalysisTime(textLength: number): number {
    // 保持预估时间逻辑不变
    return Math.max(15, Math.min(60, Math.ceil(textLength / 800) * 15));
  }
}
