
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useDatabaseConnection() {
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const testDatabaseConnection = useCallback(async () => {
    try {
      console.log('=== 开始数据库连接测试 ===');
      setConnectionError(null);
      
      const { data: healthCheck, error: healthError } = await supabase
        .from('knowledge_units')
        .select('count')
        .limit(1);

      if (healthError) {
        console.error('基础连接测试失败:', healthError);
        
        let errorMessage = `数据库连接失败: ${healthError.message}`;
        
        if (healthError.message.includes('Load failed')) {
          errorMessage = '网络连接失败，请检查网络状态或稍后重试';
        } else if (healthError.message.includes('permission')) {
          errorMessage = '数据库权限不足，请检查访问策略配置';
        } else if (healthError.message.includes('timeout')) {
          errorMessage = '数据库连接超时，请稍后重试';
        }
        
        throw new Error(errorMessage);
      }

      console.log('基础连接测试通过');
      return true;
    } catch (error: any) {
      console.error('数据库连接测试失败:', error);
      setConnectionError(error.message);
      return false;
    }
  }, []);

  return {
    connectionError,
    setConnectionError,
    testDatabaseConnection
  };
}
