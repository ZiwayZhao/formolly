
export interface KnowledgeUnit {
  id: string;
  content: string;
  source_name: string;
  category: 'school_info' | 'major_info' | 'admission_data' | 'policy_analysis' | 'experience_guide' | 'employment_data';
  importance: 'low' | 'medium' | 'high' | 'critical';
  data_type: 'qa' | 'json_object';
  entities: any;
  labels?: string[];
  keywords?: string[];
  school_names?: string[];
  major_names?: string[];
  embedding_status: 'pending' | 'processing' | 'completed' | 'failed';
  embedding_error?: string;
  flame_points: number;
  submitted_by?: string;
  reviewed_by?: string;
  review_status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface AcademicSpark {
  id: string;
  spark_number: string;
  school_name: string;
  major_name: string;
  program_id?: string;
  status: 'pending' | 'approved' | 'rejected';
  submitted_by?: string;
  reviewed_by?: string;
  flame_points: number;
  created_at: string;
  updated_at: string;
  academic_spark_attributes?: AcademicSparkAttribute[];
}

export interface AcademicSparkAttribute {
  id: string;
  spark_id: string;
  attribute_type: string; // 改为 string 以兼容数据库
  attribute_value: string;
  year?: number;
  source_url?: string;
  confidence_level: string; // 改为 string 以兼容数据库
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface CareerSpark {
  id: string;
  spark_number: string;
  job_title: string;
  location?: string;
  industry?: string;
  job_position_id?: string;
  status: 'pending' | 'approved' | 'rejected';
  submitted_by?: string;
  reviewed_by?: string;
  flame_points: number;
  created_at: string;
  updated_at: string;
  career_spark_attributes?: CareerSparkAttribute[];
}

export interface CareerSparkAttribute {
  id: string;
  spark_id: string;
  attribute_type: string; // 改为 string 以兼容数据库
  attribute_value: string;
  year?: number;
  source_url?: string;
  confidence_level: string; // 改为 string 以兼容数据库
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface SchoolProgram {
  id: string;
  school_name: string;
  program_name: string;
  program_type?: string;
  school_id?: string;
  major_id?: string;
  created_at: string;
  updated_at: string;
}

export interface SparkConnection {
  id: string;
  academic_spark_id: string;
  career_spark_id: string;
  connection_strength: number;
  connection_type: 'direct' | 'related' | 'potential';
  created_at: string;
}

export interface FlameTransaction {
  id: string;
  user_id: string;
  transaction_type: 'initial_bonus' | 'link_contribution' | 'spark_contribution' | 'qa_contribution' | 'ai_query_cost' | 'admin_adjustment';
  amount: number;
  description?: string;
  related_spark_id?: string;
  related_knowledge_unit_id?: string;
  created_at: string;
}

export interface SourceDocument {
  id: string;
  filename: string;
  file_type: string;
  file_size: number;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  extracted_text?: string;
  created_at: string;
  updated_at: string;
}

// 兼容性类型别名
export type AcademicTrack = AcademicSpark;
export type CareerTrack = CareerSpark;
