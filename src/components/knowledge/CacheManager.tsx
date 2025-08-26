
interface KnowledgeUnit {
  content: string;
  labels: string[];
  approved: boolean;
  editing?: boolean;
}

interface CacheData {
  units: KnowledgeUnit[];
  isAnalyzed: boolean;
  documentName: string;
  timestamp: number;
  version: string;
}

export class CacheManager {
  private static readonly CACHE_VERSION = '1.1.0';
  private static readonly MAX_CACHE_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

  private static getCacheKey(documentId: string): string {
    return `knowledge_analysis_${documentId}`;
  }

  static save(documentId: string, units: KnowledgeUnit[], isAnalyzed: boolean, documentName: string): void {
    try {
      const cacheKey = this.getCacheKey(documentId);
      const cacheData: CacheData = {
        units,
        isAnalyzed,
        documentName,
        timestamp: Date.now(),
        version: this.CACHE_VERSION,
      };
      
      // 验证数据完整性
      if (!this.validateCacheData(cacheData)) {
        console.error('缓存数据验证失败，跳过保存');
        return;
      }
      
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      console.log('数据已保存到缓存', {
        units: units.length,
        timestamp: new Date(cacheData.timestamp).toLocaleString()
      });
    } catch (error) {
      console.error('保存缓存失败:', error);
      // 尝试清理损坏的缓存
      this.clear(documentId);
    }
  }

  static load(documentId: string, documentName: string): { units: KnowledgeUnit[]; isAnalyzed: boolean } | null {
    try {
      const cacheKey = this.getCacheKey(documentId);
      const cachedData = localStorage.getItem(cacheKey);
      
      if (cachedData) {
        const data: CacheData = JSON.parse(cachedData);
        
        // 验证缓存数据完整性
        if (!this.validateCacheData(data)) {
          console.warn('缓存数据损坏，清理缓存');
          this.clear(documentId);
          return null;
        }
        
        // 检查版本兼容性
        if (data.version !== this.CACHE_VERSION) {
          console.warn('缓存版本不匹配，清理缓存');
          this.clear(documentId);
          return null;
        }
        
        // 检查缓存过期
        if (Date.now() - data.timestamp > this.MAX_CACHE_AGE) {
          console.warn('缓存已过期，清理缓存');
          this.clear(documentId);
          return null;
        }
        
        // 检查文档名匹配
        if (data.documentName !== documentName) {
          console.warn('文档名不匹配，清理缓存');
          this.clear(documentId);
          return null;
        }
        
        console.log('恢复缓存数据:', {
          units: data.units.length,
          documentName: data.documentName,
          age: Math.round((Date.now() - data.timestamp) / 1000 / 60) + ' 分钟前'
        });
        
        return { 
          units: data.units, 
          isAnalyzed: data.isAnalyzed 
        };
      }
      return null;
    } catch (error) {
      console.error('恢复缓存数据失败:', error);
      this.clear(documentId);
      return null;
    }
  }

  static clear(documentId: string): void {
    const cacheKey = this.getCacheKey(documentId);
    localStorage.removeItem(cacheKey);
    console.log('缓存已清除:', cacheKey);
  }

  // 清理所有过期缓存
  static cleanupExpiredCache(): number {
    let cleanedCount = 0;
    const now = Date.now();
    
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('knowledge_analysis_')) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          
          // 检查是否过期或损坏
          if (!data.timestamp || 
              !data.version || 
              now - data.timestamp > this.MAX_CACHE_AGE ||
              !this.validateCacheData(data)) {
            localStorage.removeItem(key);
            cleanedCount++;
          }
        } catch (error) {
          localStorage.removeItem(key);
          cleanedCount++;
        }
      }
    });
    
    if (cleanedCount > 0) {
      console.log(`清理了 ${cleanedCount} 个过期或损坏的缓存项`);
    }
    
    return cleanedCount;
  }

  // 获取所有缓存状态
  static getCacheStatus(): {
    totalCaches: number;
    expiredCaches: number;
    corruptedCaches: number;
    totalSize: number;
  } {
    let totalCaches = 0;
    let expiredCaches = 0;
    let corruptedCaches = 0;
    let totalSize = 0;
    const now = Date.now();
    
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('knowledge_analysis_')) {
        totalCaches++;
        const item = localStorage.getItem(key);
        if (item) {
          totalSize += item.length;
          
          try {
            const data = JSON.parse(item);
            
            if (!this.validateCacheData(data)) {
              corruptedCaches++;
            } else if (now - data.timestamp > this.MAX_CACHE_AGE) {
              expiredCaches++;
            }
          } catch (error) {
            corruptedCaches++;
          }
        }
      }
    });
    
    return {
      totalCaches,
      expiredCaches,
      corruptedCaches,
      totalSize
    };
  }

  // 验证缓存数据完整性
  private static validateCacheData(data: any): data is CacheData {
    return (
      data &&
      typeof data === 'object' &&
      Array.isArray(data.units) &&
      typeof data.isAnalyzed === 'boolean' &&
      typeof data.documentName === 'string' &&
      typeof data.timestamp === 'number' &&
      typeof data.version === 'string' &&
      data.units.every((unit: any) => 
        unit &&
        typeof unit.content === 'string' &&
        Array.isArray(unit.labels) &&
        typeof unit.approved === 'boolean'
      )
    );
  }
}
