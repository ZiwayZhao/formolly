export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      academic_spark_attributes: {
        Row: {
          attribute_type: string
          attribute_value: string
          confidence_level: string | null
          created_at: string | null
          id: string
          source_url: string | null
          spark_id: string | null
          status: Database["public"]["Enums"]["contribution_status"] | null
          updated_at: string | null
          year: number | null
        }
        Insert: {
          attribute_type: string
          attribute_value: string
          confidence_level?: string | null
          created_at?: string | null
          id?: string
          source_url?: string | null
          spark_id?: string | null
          status?: Database["public"]["Enums"]["contribution_status"] | null
          updated_at?: string | null
          year?: number | null
        }
        Update: {
          attribute_type?: string
          attribute_value?: string
          confidence_level?: string | null
          created_at?: string | null
          id?: string
          source_url?: string | null
          spark_id?: string | null
          status?: Database["public"]["Enums"]["contribution_status"] | null
          updated_at?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "academic_spark_attributes_spark_id_fkey"
            columns: ["spark_id"]
            isOneToOne: false
            referencedRelation: "academic_sparks"
            referencedColumns: ["id"]
          },
        ]
      }
      academic_sparks: {
        Row: {
          created_at: string | null
          flame_points: number | null
          id: string
          major_name: string
          program_id: string | null
          reviewed_by: string | null
          school_name: string
          spark_number: string
          status: Database["public"]["Enums"]["contribution_status"] | null
          submitted_by: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          flame_points?: number | null
          id?: string
          major_name: string
          program_id?: string | null
          reviewed_by?: string | null
          school_name: string
          spark_number: string
          status?: Database["public"]["Enums"]["contribution_status"] | null
          submitted_by?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          flame_points?: number | null
          id?: string
          major_name?: string
          program_id?: string | null
          reviewed_by?: string | null
          school_name?: string
          spark_number?: string
          status?: Database["public"]["Enums"]["contribution_status"] | null
          submitted_by?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "academic_sparks_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "school_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      academic_track_attributes: {
        Row: {
          attribute_name: string
          attribute_value: string
          created_at: string
          id: string
          status: Database["public"]["Enums"]["contribution_status"]
          submitted_by: string | null
          track_id: string
          updated_at: string
          year: number | null
        }
        Insert: {
          attribute_name: string
          attribute_value: string
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["contribution_status"]
          submitted_by?: string | null
          track_id: string
          updated_at?: string
          year?: number | null
        }
        Update: {
          attribute_name?: string
          attribute_value?: string
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["contribution_status"]
          submitted_by?: string | null
          track_id?: string
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "academic_track_attributes_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "academic_tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      academic_tracks: {
        Row: {
          created_at: string
          id: string
          major_name: string
          program_id: string | null
          program_type: string | null
          school_name: string
          status: Database["public"]["Enums"]["contribution_status"]
          submitted_by: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          major_name: string
          program_id?: string | null
          program_type?: string | null
          school_name: string
          status?: Database["public"]["Enums"]["contribution_status"]
          submitted_by?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          major_name?: string
          program_id?: string | null
          program_type?: string | null
          school_name?: string
          status?: Database["public"]["Enums"]["contribution_status"]
          submitted_by?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      career_spark_attributes: {
        Row: {
          attribute_type: string
          attribute_value: string
          confidence_level: string | null
          created_at: string | null
          id: string
          source_url: string | null
          spark_id: string | null
          status: Database["public"]["Enums"]["contribution_status"] | null
          updated_at: string | null
          year: number | null
        }
        Insert: {
          attribute_type: string
          attribute_value: string
          confidence_level?: string | null
          created_at?: string | null
          id?: string
          source_url?: string | null
          spark_id?: string | null
          status?: Database["public"]["Enums"]["contribution_status"] | null
          updated_at?: string | null
          year?: number | null
        }
        Update: {
          attribute_type?: string
          attribute_value?: string
          confidence_level?: string | null
          created_at?: string | null
          id?: string
          source_url?: string | null
          spark_id?: string | null
          status?: Database["public"]["Enums"]["contribution_status"] | null
          updated_at?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "career_spark_attributes_spark_id_fkey"
            columns: ["spark_id"]
            isOneToOne: false
            referencedRelation: "career_sparks"
            referencedColumns: ["id"]
          },
        ]
      }
      career_sparks: {
        Row: {
          created_at: string | null
          flame_points: number | null
          id: string
          industry: string | null
          job_position_id: string | null
          job_title: string
          location: string | null
          reviewed_by: string | null
          spark_number: string
          status: Database["public"]["Enums"]["contribution_status"] | null
          submitted_by: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          flame_points?: number | null
          id?: string
          industry?: string | null
          job_position_id?: string | null
          job_title: string
          location?: string | null
          reviewed_by?: string | null
          spark_number: string
          status?: Database["public"]["Enums"]["contribution_status"] | null
          submitted_by?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          flame_points?: number | null
          id?: string
          industry?: string | null
          job_position_id?: string | null
          job_title?: string
          location?: string | null
          reviewed_by?: string | null
          spark_number?: string
          status?: Database["public"]["Enums"]["contribution_status"] | null
          submitted_by?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "career_sparks_job_position_id_fkey"
            columns: ["job_position_id"]
            isOneToOne: false
            referencedRelation: "job_positions"
            referencedColumns: ["id"]
          },
        ]
      }
      career_track_attributes: {
        Row: {
          attribute_name: string
          attribute_value: string
          created_at: string
          id: string
          status: Database["public"]["Enums"]["contribution_status"]
          submitted_by: string | null
          track_id: string
          updated_at: string
          year: number | null
        }
        Insert: {
          attribute_name: string
          attribute_value: string
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["contribution_status"]
          submitted_by?: string | null
          track_id: string
          updated_at?: string
          year?: number | null
        }
        Update: {
          attribute_name?: string
          attribute_value?: string
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["contribution_status"]
          submitted_by?: string | null
          track_id?: string
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "career_track_attributes_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "career_tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      career_tracks: {
        Row: {
          created_at: string
          id: string
          industry: string | null
          job_title: string
          location: string | null
          status: Database["public"]["Enums"]["contribution_status"]
          submitted_by: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          industry?: string | null
          job_title: string
          location?: string | null
          status?: Database["public"]["Enums"]["contribution_status"]
          submitted_by?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          industry?: string | null
          job_title?: string
          location?: string | null
          status?: Database["public"]["Enums"]["contribution_status"]
          submitted_by?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      enhanced_rag_query_logs: {
        Row: {
          created_at: string | null
          id: string
          processing_time_ms: number | null
          query: string
          query_analysis: Json | null
          response: string
          retrieval_method: string | null
          retrieved_units: Json | null
          top_similarity: number | null
          user_feedback: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          processing_time_ms?: number | null
          query: string
          query_analysis?: Json | null
          response: string
          retrieval_method?: string | null
          retrieved_units?: Json | null
          top_similarity?: number | null
          user_feedback?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          processing_time_ms?: number | null
          query?: string
          query_analysis?: Json | null
          response?: string
          retrieval_method?: string | null
          retrieved_units?: Json | null
          top_similarity?: number | null
          user_feedback?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      flame_transactions: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          id: string
          related_knowledge_unit_id: string | null
          related_spark_id: string | null
          transaction_type: Database["public"]["Enums"]["flame_transaction_type"]
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          id?: string
          related_knowledge_unit_id?: string | null
          related_spark_id?: string | null
          transaction_type: Database["public"]["Enums"]["flame_transaction_type"]
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          id?: string
          related_knowledge_unit_id?: string | null
          related_spark_id?: string | null
          transaction_type?: Database["public"]["Enums"]["flame_transaction_type"]
          user_id?: string
        }
        Relationships: []
      }
      invitation_codes: {
        Row: {
          code: string
          created_at: string | null
          created_by: string | null
          created_by_admin: boolean | null
          current_uses: number | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          type: string
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          created_by?: string | null
          created_by_admin?: boolean | null
          current_uses?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          type: string
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          created_by?: string | null
          created_by_admin?: boolean | null
          current_uses?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      invitation_records: {
        Row: {
          created_at: string | null
          flame_reward_given: boolean | null
          id: string
          invitation_code_id: string | null
          invitee_id: string | null
          inviter_id: string | null
        }
        Insert: {
          created_at?: string | null
          flame_reward_given?: boolean | null
          id?: string
          invitation_code_id?: string | null
          invitee_id?: string | null
          inviter_id?: string | null
        }
        Update: {
          created_at?: string | null
          flame_reward_given?: boolean | null
          id?: string
          invitation_code_id?: string | null
          invitee_id?: string | null
          inviter_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invitation_records_invitation_code_id_fkey"
            columns: ["invitation_code_id"]
            isOneToOne: false
            referencedRelation: "invitation_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      job_positions: {
        Row: {
          created_at: string | null
          id: string
          industry: string | null
          location: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          industry?: string | null
          location?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          industry?: string | null
          location?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      knowledge_units: {
        Row: {
          category: Database["public"]["Enums"]["knowledge_category"] | null
          confidence: Database["public"]["Enums"]["confidence_level"] | null
          content: string
          created_at: string
          data_type: string | null
          effectiveness_score: number | null
          embedding: string | null
          embedding_error: string | null
          embedding_status: Database["public"]["Enums"]["embedding_status_type"]
          entities: Json | null
          flame_points: number | null
          id: string
          importance: Database["public"]["Enums"]["knowledge_importance"] | null
          keywords: string[] | null
          labels: string[] | null
          last_retrieved_at: string | null
          major_names: string[] | null
          quality_score: number | null
          region: string | null
          related_questions: string[] | null
          retrieval_count: number | null
          review_status:
            | Database["public"]["Enums"]["contribution_status"]
            | null
          reviewed_by: string | null
          school_names: string[] | null
          source_name: string
          submitted_by: string | null
          target_audience: string | null
          timeliness: Database["public"]["Enums"]["timeliness_type"] | null
          updated_at: string
          year: number | null
        }
        Insert: {
          category?: Database["public"]["Enums"]["knowledge_category"] | null
          confidence?: Database["public"]["Enums"]["confidence_level"] | null
          content: string
          created_at?: string
          data_type?: string | null
          effectiveness_score?: number | null
          embedding?: string | null
          embedding_error?: string | null
          embedding_status?: Database["public"]["Enums"]["embedding_status_type"]
          entities?: Json | null
          flame_points?: number | null
          id?: string
          importance?:
            | Database["public"]["Enums"]["knowledge_importance"]
            | null
          keywords?: string[] | null
          labels?: string[] | null
          last_retrieved_at?: string | null
          major_names?: string[] | null
          quality_score?: number | null
          region?: string | null
          related_questions?: string[] | null
          retrieval_count?: number | null
          review_status?:
            | Database["public"]["Enums"]["contribution_status"]
            | null
          reviewed_by?: string | null
          school_names?: string[] | null
          source_name: string
          submitted_by?: string | null
          target_audience?: string | null
          timeliness?: Database["public"]["Enums"]["timeliness_type"] | null
          updated_at?: string
          year?: number | null
        }
        Update: {
          category?: Database["public"]["Enums"]["knowledge_category"] | null
          confidence?: Database["public"]["Enums"]["confidence_level"] | null
          content?: string
          created_at?: string
          data_type?: string | null
          effectiveness_score?: number | null
          embedding?: string | null
          embedding_error?: string | null
          embedding_status?: Database["public"]["Enums"]["embedding_status_type"]
          entities?: Json | null
          flame_points?: number | null
          id?: string
          importance?:
            | Database["public"]["Enums"]["knowledge_importance"]
            | null
          keywords?: string[] | null
          labels?: string[] | null
          last_retrieved_at?: string | null
          major_names?: string[] | null
          quality_score?: number | null
          region?: string | null
          related_questions?: string[] | null
          retrieval_count?: number | null
          review_status?:
            | Database["public"]["Enums"]["contribution_status"]
            | null
          reviewed_by?: string | null
          school_names?: string[] | null
          source_name?: string
          submitted_by?: string | null
          target_audience?: string | null
          timeliness?: Database["public"]["Enums"]["timeliness_type"] | null
          updated_at?: string
          year?: number | null
        }
        Relationships: []
      }
      majors: {
        Row: {
          category: string | null
          created_at: string | null
          degree_level: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          degree_level?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          degree_level?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          flame_balance: number
          id: string
          invitation_code: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          flame_balance?: number
          id: string
          invitation_code?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          flame_balance?: number
          id?: string
          invitation_code?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      rag_query_logs: {
        Row: {
          created_at: string | null
          id: string
          processing_time_ms: number | null
          query: string
          response: string | null
          response_quality_score: number | null
          retrieved_units_count: number | null
          user_feedback: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          processing_time_ms?: number | null
          query: string
          response?: string | null
          response_quality_score?: number | null
          retrieved_units_count?: number | null
          user_feedback?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          processing_time_ms?: number | null
          query?: string
          response?: string | null
          response_quality_score?: number | null
          retrieved_units_count?: number | null
          user_feedback?: number | null
        }
        Relationships: []
      }
      school_programs: {
        Row: {
          created_at: string | null
          id: string
          major_id: string | null
          program_name: string
          program_type: string | null
          school_id: string | null
          school_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          major_id?: string | null
          program_name: string
          program_type?: string | null
          school_id?: string | null
          school_name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          major_id?: string | null
          program_name?: string
          program_type?: string | null
          school_id?: string | null
          school_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "school_programs_major_id_fkey"
            columns: ["major_id"]
            isOneToOne: false
            referencedRelation: "majors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_programs_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          created_at: string | null
          id: string
          location: string | null
          name: string
          type: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          location?: string | null
          name: string
          type?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          location?: string | null
          name?: string
          type?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      spark_connections: {
        Row: {
          academic_spark_id: string | null
          career_spark_id: string | null
          connection_strength: number | null
          connection_type: string | null
          created_at: string | null
          id: string
        }
        Insert: {
          academic_spark_id?: string | null
          career_spark_id?: string | null
          connection_strength?: number | null
          connection_type?: string | null
          created_at?: string | null
          id?: string
        }
        Update: {
          academic_spark_id?: string | null
          career_spark_id?: string | null
          connection_strength?: number | null
          connection_type?: string | null
          created_at?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "spark_connections_academic_spark_id_fkey"
            columns: ["academic_spark_id"]
            isOneToOne: false
            referencedRelation: "academic_sparks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spark_connections_career_spark_id_fkey"
            columns: ["career_spark_id"]
            isOneToOne: false
            referencedRelation: "career_sparks"
            referencedColumns: ["id"]
          },
        ]
      }
      track_connections: {
        Row: {
          academic_track_id: string
          career_track_id: string
          created_at: string
          id: string
        }
        Insert: {
          academic_track_id: string
          career_track_id: string
          created_at?: string
          id?: string
        }
        Update: {
          academic_track_id?: string
          career_track_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "track_connections_academic_track_id_fkey"
            columns: ["academic_track_id"]
            isOneToOne: false
            referencedRelation: "academic_tracks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "track_connections_career_track_id_fkey"
            columns: ["career_track_id"]
            isOneToOne: false
            referencedRelation: "career_tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_tasks: {
        Row: {
          completed_at: string | null
          created_at: string | null
          expires_at: string | null
          flame_reward: number
          id: string
          status: string | null
          task_description: string | null
          task_title: string
          task_type: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          expires_at?: string | null
          flame_reward: number
          id?: string
          status?: string | null
          task_description?: string | null
          task_title: string
          task_type: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          expires_at?: string | null
          flame_reward?: number
          id?: string
          status?: string | null
          task_description?: string | null
          task_title?: string
          task_type?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      knowledge_units_performance: {
        Row: {
          avg_effectiveness: number | null
          avg_quality: number | null
          avg_retrieval_count: number | null
          category: Database["public"]["Enums"]["knowledge_category"] | null
          confidence: Database["public"]["Enums"]["confidence_level"] | null
          importance: Database["public"]["Enums"]["knowledge_importance"] | null
          last_used: string | null
          total_units: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      enhanced_search_knowledge_units: {
        Args: {
          query_embedding: string
          match_threshold?: number
          match_count?: number
          filter_category?: string
          filter_importance?: string
          filter_confidence?: Database["public"]["Enums"]["confidence_level"]
          filter_timeliness?: Database["public"]["Enums"]["timeliness_type"]
          min_quality_score?: number
        }
        Returns: {
          id: string
          content: string
          category: string
          importance: string
          confidence: Database["public"]["Enums"]["confidence_level"]
          timeliness: Database["public"]["Enums"]["timeliness_type"]
          labels: string[]
          school_names: string[]
          major_names: string[]
          keywords: string[]
          entities: Json
          quality_score: number
          target_audience: string
          related_questions: string[]
          similarity: number
          effectiveness_score: number
        }[]
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      is_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: unknown
      }
      maintain_knowledge_units: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      search_by_entities: {
        Args: {
          school_names_filter?: string[]
          major_names_filter?: string[]
          keywords_filter?: string[]
          match_count?: number
        }
        Returns: {
          id: string
          content: string
          category: string
          importance: string
          school_names: string[]
          major_names: string[]
          keywords: string[]
          quality_score: number
          match_score: number
        }[]
      }
      search_knowledge_units: {
        Args: {
          query_embedding: string
          match_threshold?: number
          match_count?: number
          filter_category?: Database["public"]["Enums"]["knowledge_category"]
          filter_importance?: Database["public"]["Enums"]["knowledge_importance"]
        }
        Returns: {
          id: string
          content: string
          category: Database["public"]["Enums"]["knowledge_category"]
          importance: Database["public"]["Enums"]["knowledge_importance"]
          labels: string[]
          school_names: string[]
          major_names: string[]
          similarity: number
        }[]
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      update_knowledge_unit_usage: {
        Args: { unit_id: string; effectiveness?: number }
        Returns: undefined
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      confidence_level: "verified" | "reliable" | "general" | "uncertain"
      contribution_status: "pending" | "approved" | "rejected"
      embedding_status_type: "pending" | "processing" | "completed" | "failed"
      flame_transaction_type:
        | "initial_bonus"
        | "link_contribution"
        | "spark_contribution"
        | "qa_contribution"
        | "ai_query_cost"
        | "admin_adjustment"
      knowledge_category:
        | "school_info"
        | "major_info"
        | "admission_data"
        | "policy_analysis"
        | "experience_guide"
        | "employment_data"
      knowledge_importance: "low" | "medium" | "high" | "critical"
      timeliness_type: "current" | "recent" | "historical" | "timeless"
      user_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      confidence_level: ["verified", "reliable", "general", "uncertain"],
      contribution_status: ["pending", "approved", "rejected"],
      embedding_status_type: ["pending", "processing", "completed", "failed"],
      flame_transaction_type: [
        "initial_bonus",
        "link_contribution",
        "spark_contribution",
        "qa_contribution",
        "ai_query_cost",
        "admin_adjustment",
      ],
      knowledge_category: [
        "school_info",
        "major_info",
        "admission_data",
        "policy_analysis",
        "experience_guide",
        "employment_data",
      ],
      knowledge_importance: ["low", "medium", "high", "critical"],
      timeliness_type: ["current", "recent", "historical", "timeless"],
      user_role: ["admin", "user"],
    },
  },
} as const
