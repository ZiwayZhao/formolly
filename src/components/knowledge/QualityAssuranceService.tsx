
interface KnowledgeUnit {
  content: string;
  labels: string[];
  [key: string]: any; // Allow other properties
}

export class QualityAssuranceService {

  // 标签标准化和分类
  static standardizeLabels(rawLabels: string[]): string[] {
    const labelMapping: { [key: string]: string } = {
      // 学校标准化
      '宁诺': '宁波诺丁汉大学',
      '西浦': '西交利物浦大学', 
      '广以': '广东以色列理工学院',
      
      // 专业分类标准化
      '理工': '理工科',
      '商科': '商业管理',
      '文科': '人文社科',
      
      // 阶段标准化
      '本科': '本科申请',
      '研究生': '研究生申请',
      '博士': '博士申请'
    };
    
    const standardized = rawLabels.map(label => labelMapping[label] || label);
    return [...new Set(standardized)]; // 去重
  }

  // 内容去重
  static deduplicateContent<T extends KnowledgeUnit>(units: T[]): T[] {
    const seen = new Set<string>();
    return units.filter(unit => {
      const fingerprint = this.generateContentFingerprint(unit.content);
      if (seen.has(fingerprint)) {
        return false;
      }
      seen.add(fingerprint);
      return true;
    });
  }

  // 生成内容指纹用于去重
  private static generateContentFingerprint(content: string): string {
    // 移除标点符号和空格，转换为小写
    const normalized = content.replace(/[^\w\u4e00-\u9fff]/g, '').toLowerCase();
    
    // 计算简单哈希
    let hash = 0;
    for (let i = 0; i < normalized.length; i++) {
      const char = normalized.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    
    return hash.toString();
  }
}
