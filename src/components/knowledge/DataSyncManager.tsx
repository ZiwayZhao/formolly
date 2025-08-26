
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, AlertTriangle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SyncStatus {
  lastSync: Date | null;
  isOnline: boolean;
  pendingChanges: number;
  syncInProgress: boolean;
  errors: string[];
  dbConnectionStatus: 'unknown' | 'connected' | 'error';
}

interface DataSyncManagerProps {
  onSyncComplete?: () => void;
}

export default function DataSyncManager({ onSyncComplete }: DataSyncManagerProps) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    lastSync: null,
    isOnline: navigator.onLine,
    pendingChanges: 0,
    syncInProgress: false,
    errors: [],
    dbConnectionStatus: 'unknown'
  });
  const { toast } = useToast();

  // 静默数据库连接测试
  const testDatabaseConnection = async (): Promise<boolean> => {
    try {
      console.log('DataSyncManager: 测试数据库连接');
      
      const { data, error } = await supabase
        .from('knowledge_units')
        .select('count')
        .limit(1);

      if (error) {
        console.error('DataSyncManager: 数据库连接失败:', error);
        setSyncStatus(prev => ({ 
          ...prev, 
          dbConnectionStatus: 'error',
          errors: [...prev.errors.filter(e => !e.includes('数据库连接')), `数据库连接失败: ${error.message}`]
        }));
        return false;
      }

      console.log('DataSyncManager: 数据库连接成功');
      setSyncStatus(prev => ({ 
        ...prev, 
        dbConnectionStatus: 'connected',
        errors: prev.errors.filter(e => !e.includes('数据库连接'))
      }));
      return true;
    } catch (error: any) {
      console.error('DataSyncManager: 数据库连接异常:', error);
      setSyncStatus(prev => ({ 
        ...prev, 
        dbConnectionStatus: 'error',
        errors: [...prev.errors.filter(e => !e.includes('数据库连接')), `数据库连接异常: ${error.message}`]
      }));
      return false;
    }
  };

  // 监听网络状态
  useEffect(() => {
    const handleOnline = async () => {
      console.log('DataSyncManager: 网络连接恢复');
      setSyncStatus(prev => ({ ...prev, isOnline: true }));
      
      // 网络恢复后测试数据库连接
      const dbConnected = await testDatabaseConnection();
      if (dbConnected) {
        performAutoSync();
      }
    };

    const handleOffline = () => {
      console.log('DataSyncManager: 网络连接断开');
      setSyncStatus(prev => ({ 
        ...prev, 
        isOnline: false,
        dbConnectionStatus: 'error',
        errors: [...prev.errors.filter(e => !e.includes('网络')), '网络连接断开']
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 初始化时静默测试连接
    if (navigator.onLine) {
      testDatabaseConnection();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 定期同步检查
  useEffect(() => {
    const syncInterval = setInterval(() => {
      if (syncStatus.isOnline && 
          !syncStatus.syncInProgress && 
          syncStatus.dbConnectionStatus === 'connected') {
        checkDataConsistency();
      }
    }, 60000); // 每分钟检查一次

    return () => clearInterval(syncInterval);
  }, [syncStatus.isOnline, syncStatus.syncInProgress, syncStatus.dbConnectionStatus]);

  // 检查数据一致性
  const checkDataConsistency = async () => {
    if (!syncStatus.isOnline) {
      console.log('DataSyncManager: 网络离线，跳过数据检查');
      return;
    }

    try {
      console.log('DataSyncManager: 开始数据一致性检查');
      
      // 首先确保数据库连接正常
      const dbConnected = await testDatabaseConnection();
      if (!dbConnected) {
        console.log('DataSyncManager: 数据库连接失败，跳过数据检查');
        return;
      }

      // 检查本地缓存与数据库的一致性
      const cacheKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('knowledge_analysis_')
      );

      let pendingCount = 0;
      const errors: string[] = [];

      for (const key of cacheKeys) {
        try {
          const cachedData = localStorage.getItem(key);
          if (cachedData) {
            const data = JSON.parse(cachedData);
            if (data.units && data.isAnalyzed && Array.isArray(data.units)) {
              pendingCount += data.units.filter((unit: any) => unit.approved).length;
            }
          }
        } catch (error) {
          errors.push(`缓存数据解析失败: ${key}`);
          console.warn('DataSyncManager: 缓存解析失败:', key, error);
        }
      }

      setSyncStatus(prev => ({
        ...prev,
        pendingChanges: pendingCount,
        errors: errors,
        lastSync: new Date()
      }));

    } catch (error: any) {
      console.error('DataSyncManager: 数据一致性检查失败:', error);
      setSyncStatus(prev => ({
        ...prev,
        errors: [...prev.errors.filter(e => !e.includes('一致性检查')), `一致性检查失败: ${error.message}`]
      }));
    }
  };

  // 自动同步
  const performAutoSync = async () => {
    if (syncStatus.syncInProgress || !syncStatus.isOnline) {
      console.log('DataSyncManager: 同步已在进行中或网络离线');
      return;
    }

    setSyncStatus(prev => ({ ...prev, syncInProgress: true }));

    try {
      console.log('DataSyncManager: 开始自动同步');
      
      // 确保数据库连接
      const dbConnected = await testDatabaseConnection();
      if (!dbConnected) {
        throw new Error('数据库连接失败，无法同步');
      }

      await checkDataConsistency();
      
      // 清理过期的缓存数据（超过7天）
      const now = Date.now();
      const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
      let cleanedCount = 0;
      
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('knowledge_analysis_')) {
          try {
            const data = JSON.parse(localStorage.getItem(key) || '{}');
            if (data.timestamp && data.timestamp < weekAgo) {
              localStorage.removeItem(key);
              cleanedCount++;
              console.log(`DataSyncManager: 清理过期缓存: ${key}`);
            }
          } catch (error) {
            localStorage.removeItem(key);
            cleanedCount++;
            console.log(`DataSyncManager: 清理损坏缓存: ${key}`);
          }
        }
      });

      onSyncComplete?.();
      
      console.log(`DataSyncManager: 自动同步完成，清理了 ${cleanedCount} 个缓存项`);
      
      if (cleanedCount > 0) {
        toast({
          title: "同步完成",
          description: `数据同步完成，清理了 ${cleanedCount} 个过期缓存`,
        });
      }

    } catch (error: any) {
      console.error('DataSyncManager: 自动同步失败:', error);
      setSyncStatus(prev => ({
        ...prev,
        errors: [...prev.errors.filter(e => !e.includes('自动同步')), `自动同步失败: ${error.message}`]
      }));
      
      toast({
        title: "同步失败",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSyncStatus(prev => ({ ...prev, syncInProgress: false }));
    }
  };

  // 手动强制同步
  const forceSync = async () => {
    setSyncStatus(prev => ({ ...prev, syncInProgress: true, errors: [] }));

    try {
      console.log('DataSyncManager: 开始强制同步');
      
      // 首先测试网络和数据库连接
      if (!navigator.onLine) {
        throw new Error('网络连接不可用，请检查网络设置');
      }

      const dbConnected = await testDatabaseConnection();
      if (!dbConnected) {
        throw new Error('数据库连接失败，请稍后重试');
      }

      // 检查并修复本地缓存
      const cacheKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('knowledge_analysis_')
      );

      let repairedCount = 0;
      
      for (const key of cacheKeys) {
        try {
          const cachedData = localStorage.getItem(key);
          if (cachedData) {
            const data = JSON.parse(cachedData);
            
            // 验证数据结构
            if (!data.units || !Array.isArray(data.units)) {
              localStorage.removeItem(key);
              repairedCount++;
              continue;
            }

            // 更新时间戳
            data.timestamp = Date.now();
            localStorage.setItem(key, JSON.stringify(data));
          }
        } catch (error) {
          localStorage.removeItem(key);
          repairedCount++;
        }
      }

      await checkDataConsistency();

      toast({
        title: "强制同步完成",
        description: repairedCount > 0 
          ? `已修复 ${repairedCount} 个缓存项目` 
          : "所有数据已同步",
      });

      onSyncComplete?.();

    } catch (error: any) {
      console.error('DataSyncManager: 强制同步失败:', error);
      setSyncStatus(prev => ({
        ...prev,
        errors: [error.message]
      }));
      
      toast({
        title: "强制同步失败",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSyncStatus(prev => ({ ...prev, syncInProgress: false }));
    }
  };

  // 只在有错误或正在同步时显示组件
  if (syncStatus.errors.length === 0 && syncStatus.pendingChanges === 0 && !syncStatus.syncInProgress) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* 只在有错误时显示错误信息 */}
      {syncStatus.errors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-semibold mb-1">连接异常:</div>
            <ul className="text-sm space-y-1">
              {syncStatus.errors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSyncStatus(prev => ({ ...prev, errors: [] }))}
              >
                清除错误
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={testDatabaseConnection}
                disabled={syncStatus.syncInProgress}
              >
                重试连接
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* 同步状态 - 只在有待同步内容或正在同步时显示 */}
      {(syncStatus.pendingChanges > 0 || syncStatus.syncInProgress) && (
        <Alert>
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {syncStatus.syncInProgress && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    同步中
                  </Badge>
                )}
                {syncStatus.pendingChanges > 0 && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {syncStatus.pendingChanges} 个待同步
                  </Badge>
                )}
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={forceSync}
                disabled={syncStatus.syncInProgress || !syncStatus.isOnline}
                className="flex items-center gap-1"
              >
                {syncStatus.syncInProgress ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                {syncStatus.syncInProgress ? '同步中...' : '强制同步'}
              </Button>
            </div>

            {syncStatus.lastSync && (
              <div className="text-xs text-muted-foreground mt-2">
                上次同步: {syncStatus.lastSync.toLocaleString()}
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
