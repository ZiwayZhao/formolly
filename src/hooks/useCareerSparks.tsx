
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { CareerSpark } from "@/components/admin/types";

export function useCareerSparks() {
  const [careerSparks, setCareerSparks] = useState<CareerSpark[]>([]);
  const { toast } = useToast();

  const loadCareerSparks = useCallback(async () => {
    try {
      console.log('开始加载职业火种...');
      
      const { data, error } = await supabase
        .from('career_sparks')
        .select(`
          *,
          career_spark_attributes(*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('职业火种加载错误:', error);
        toast({
          title: "职业火种加载失败",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      console.log(`成功加载 ${data?.length || 0} 个职业火种`);
      setCareerSparks((data as CareerSpark[]) || []);
    } catch (error: any) {
      console.error('职业火种加载异常:', error);
      toast({
        title: "加载异常",
        description: "网络连接不稳定，请检查网络后重试",
        variant: "destructive"
      });
    }
  }, [toast]);

  return {
    careerSparks,
    setCareerSparks,
    loadCareerSparks
  };
}
