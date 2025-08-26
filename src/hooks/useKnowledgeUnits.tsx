
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { KnowledgeUnit } from "@/components/admin/types";

export function useKnowledgeUnits() {
  const [units, setUnits] = useState<KnowledgeUnit[]>([]);
  const { toast } = useToast();

  const loadKnowledgeUnits = useCallback(async () => {
    try {
      console.log('开始加载知识单元...');
      
      const { data, error } = await supabase
        .from('knowledge_units')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('知识单元加载错误:', error);
        
        let errorMessage = `知识单元加载失败: ${error.message}`;
        if (error.message.includes('Load failed')) {
          errorMessage = '网络连接异常，无法加载知识单元数据';
        }
        
        toast({
          title: "加载失败",
          description: errorMessage,
          variant: "destructive"
        });
        return;
      }

      console.log(`成功加载 ${data?.length || 0} 个知识单元`);
      setUnits((data as KnowledgeUnit[]) || []);
      
    } catch (error: any) {
      console.error('知识单元加载异常:', error);
      toast({
        title: "加载异常",
        description: "网络连接不稳定，请检查网络后重试",
        variant: "destructive"
      });
    }
  }, [toast]);

  return {
    units,
    setUnits,
    loadKnowledgeUnits
  };
}
