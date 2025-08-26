
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { AcademicSpark } from "@/components/admin/types";

export function useAcademicSparks() {
  const [academicSparks, setAcademicSparks] = useState<AcademicSpark[]>([]);
  const { toast } = useToast();

  const loadAcademicSparks = useCallback(async () => {
    try {
      console.log('开始加载学术火种...');
      
      const { data, error } = await supabase
        .from('academic_sparks')
        .select(`
          *,
          academic_spark_attributes(*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('学术火种加载错误:', error);
        toast({
          title: "学术火种加载失败",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      console.log(`成功加载 ${data?.length || 0} 个学术火种`);
      setAcademicSparks((data as AcademicSpark[]) || []);
    } catch (error: any) {
      console.error('学术火种加载异常:', error);
      toast({
        title: "加载异常",
        description: "网络连接不稳定，请检查网络后重试",
        variant: "destructive"
      });
    }
  }, [toast]);

  return {
    academicSparks,
    setAcademicSparks,
    loadAcademicSparks
  };
}
