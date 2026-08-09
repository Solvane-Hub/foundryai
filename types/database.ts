export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.15';
  };
  public: {
    Tables: {
      audit_log: {
        Row: {
          actor_id: string | null;
          business_id: string | null;
          correlation_id: string | null;
          event: string;
          id: number;
          ip_address: unknown;
          metadata: Json;
          occurred_at: string;
          user_agent: string | null;
        };
        Insert: {
          actor_id?: string | null;
          business_id?: string | null;
          correlation_id?: string | null;
          event: string;
          id?: never;
          ip_address?: unknown;
          metadata?: Json;
          occurred_at?: string;
          user_agent?: string | null;
        };
        Update: {
          actor_id?: string | null;
          business_id?: string | null;
          correlation_id?: string | null;
          event?: string;
          id?: never;
          ip_address?: unknown;
          metadata?: Json;
          occurred_at?: string;
          user_agent?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'audit_log_business_id_fkey';
            columns: ['business_id'];
            isOneToOne: false;
            referencedRelation: 'businesses';
            referencedColumns: ['id'];
          },
        ];
      };
      business_profiles: {
        Row: {
          business_id: string;
          business_stage: string | null;
          completed_at: string | null;
          created_at: string;
          description: string | null;
          employee_count: number | null;
          founder_goals: string | null;
          funding_requirement_amount: number | null;
          funding_requirement_currency: string | null;
          id: string;
          last_completed_step: number;
          location: string | null;
          responses: Json;
          updated_at: string;
        };
        Insert: {
          business_id: string;
          business_stage?: string | null;
          completed_at?: string | null;
          created_at?: string;
          description?: string | null;
          employee_count?: number | null;
          founder_goals?: string | null;
          funding_requirement_amount?: number | null;
          funding_requirement_currency?: string | null;
          id?: string;
          last_completed_step?: number;
          location?: string | null;
          responses?: Json;
          updated_at?: string;
        };
        Update: {
          business_id?: string;
          business_stage?: string | null;
          completed_at?: string | null;
          created_at?: string;
          description?: string | null;
          employee_count?: number | null;
          founder_goals?: string | null;
          funding_requirement_amount?: number | null;
          funding_requirement_currency?: string | null;
          id?: string;
          last_completed_step?: number;
          location?: string | null;
          responses?: Json;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'business_profiles_business_id_fkey';
            columns: ['business_id'];
            isOneToOne: true;
            referencedRelation: 'businesses';
            referencedColumns: ['id'];
          },
        ];
      };
      businesses: {
        Row: {
          archived_at: string | null;
          country_code: string;
          created_at: string;
          id: string;
          industry: string | null;
          name: string;
          owner_id: string;
          status: Database['public']['Enums']['business_status'];
          updated_at: string;
        };
        Insert: {
          archived_at?: string | null;
          country_code: string;
          created_at?: string;
          id?: string;
          industry?: string | null;
          name: string;
          owner_id: string;
          status?: Database['public']['Enums']['business_status'];
          updated_at?: string;
        };
        Update: {
          archived_at?: string | null;
          country_code?: string;
          created_at?: string;
          id?: string;
          industry?: string | null;
          name?: string;
          owner_id?: string;
          status?: Database['public']['Enums']['business_status'];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'businesses_country_code_fkey';
            columns: ['country_code'];
            isOneToOne: false;
            referencedRelation: 'countries';
            referencedColumns: ['code'];
          },
        ];
      };
      countries: {
        Row: {
          code: string;
          created_at: string;
          currency_code: string;
          is_active: boolean;
          name: string;
        };
        Insert: {
          code: string;
          created_at?: string;
          currency_code: string;
          is_active?: boolean;
          name: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          currency_code?: string;
          is_active?: boolean;
          name?: string;
        };
        Relationships: [];
      };
      knowledge_chunk_relations: {
        Row: {
          applies_if: Json | null;
          created_at: string;
          from_chunk_id: string;
          id: string;
          relation_type: string;
          to_chunk_id: string | null;
        };
        Insert: {
          applies_if?: Json | null;
          created_at?: string;
          from_chunk_id: string;
          id?: string;
          relation_type: string;
          to_chunk_id?: string | null;
        };
        Update: {
          applies_if?: Json | null;
          created_at?: string;
          from_chunk_id?: string;
          id?: string;
          relation_type?: string;
          to_chunk_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'knowledge_chunk_relations_from_chunk_id_fkey';
            columns: ['from_chunk_id'];
            isOneToOne: false;
            referencedRelation: 'knowledge_chunks';
            referencedColumns: ['chunk_id'];
          },
          {
            foreignKeyName: 'knowledge_chunk_relations_to_chunk_id_fkey';
            columns: ['to_chunk_id'];
            isOneToOne: false;
            referencedRelation: 'knowledge_chunks';
            referencedColumns: ['chunk_id'];
          },
        ];
      };
      knowledge_chunks: {
        Row: {
          body: string;
          chunk_id: string;
          chunk_index: number;
          chunk_version: number;
          clause: string | null;
          content_hash: string;
          country_code: string;
          created_at: string;
          effective_date: string | null;
          industry: string | null;
          keywords: string[];
          knowledge_pack_id: string;
          knowledge_source_id: string;
          legal_source_category: Database['public']['Enums']['legal_source_category'];
          page: number | null;
          regulatory_domain: string | null;
          section_reference: string | null;
          source_authority: number;
          title: string | null;
        };
        Insert: {
          body: string;
          chunk_id: string;
          chunk_index: number;
          chunk_version?: number;
          clause?: string | null;
          content_hash: string;
          country_code: string;
          created_at?: string;
          effective_date?: string | null;
          industry?: string | null;
          keywords?: string[];
          knowledge_pack_id: string;
          knowledge_source_id: string;
          legal_source_category: Database['public']['Enums']['legal_source_category'];
          page?: number | null;
          regulatory_domain?: string | null;
          section_reference?: string | null;
          source_authority: number;
          title?: string | null;
        };
        Update: {
          body?: string;
          chunk_id?: string;
          chunk_index?: number;
          chunk_version?: number;
          clause?: string | null;
          content_hash?: string;
          country_code?: string;
          created_at?: string;
          effective_date?: string | null;
          industry?: string | null;
          keywords?: string[];
          knowledge_pack_id?: string;
          knowledge_source_id?: string;
          legal_source_category?: Database['public']['Enums']['legal_source_category'];
          page?: number | null;
          regulatory_domain?: string | null;
          section_reference?: string | null;
          source_authority?: number;
          title?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'knowledge_chunks_country_code_fkey';
            columns: ['country_code'];
            isOneToOne: false;
            referencedRelation: 'countries';
            referencedColumns: ['code'];
          },
          {
            foreignKeyName: 'knowledge_chunks_knowledge_pack_id_fkey';
            columns: ['knowledge_pack_id'];
            isOneToOne: false;
            referencedRelation: 'knowledge_packs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'knowledge_chunks_knowledge_source_id_fkey';
            columns: ['knowledge_source_id'];
            isOneToOne: false;
            referencedRelation: 'knowledge_sources';
            referencedColumns: ['id'];
          },
        ];
      };
      knowledge_embedding_manifests: {
        Row: {
          chunk_version: number;
          dimensions: number;
          generated_at: string;
          id: string;
          knowledge_pack_id: string;
          model: string;
          model_version: string;
          provider: string;
          retrieval_config_version: string;
          status: string;
        };
        Insert: {
          chunk_version: number;
          dimensions: number;
          generated_at?: string;
          id?: string;
          knowledge_pack_id: string;
          model: string;
          model_version: string;
          provider: string;
          retrieval_config_version: string;
          status?: string;
        };
        Update: {
          chunk_version?: number;
          dimensions?: number;
          generated_at?: string;
          id?: string;
          knowledge_pack_id?: string;
          model?: string;
          model_version?: string;
          provider?: string;
          retrieval_config_version?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'knowledge_embedding_manifests_knowledge_pack_id_fkey';
            columns: ['knowledge_pack_id'];
            isOneToOne: false;
            referencedRelation: 'knowledge_packs';
            referencedColumns: ['id'];
          },
        ];
      };
      knowledge_packs: {
        Row: {
          approval_note: string | null;
          country_code: string;
          created_at: string;
          id: string;
          notes: string | null;
          published_at: string | null;
          published_by: string | null;
          status: Database['public']['Enums']['knowledge_pack_status'];
          superseded_at: string | null;
          superseded_by_id: string | null;
          updated_at: string;
          version: string;
        };
        Insert: {
          approval_note?: string | null;
          country_code: string;
          created_at?: string;
          id?: string;
          notes?: string | null;
          published_at?: string | null;
          published_by?: string | null;
          status?: Database['public']['Enums']['knowledge_pack_status'];
          superseded_at?: string | null;
          superseded_by_id?: string | null;
          updated_at?: string;
          version: string;
        };
        Update: {
          approval_note?: string | null;
          country_code?: string;
          created_at?: string;
          id?: string;
          notes?: string | null;
          published_at?: string | null;
          published_by?: string | null;
          status?: Database['public']['Enums']['knowledge_pack_status'];
          superseded_at?: string | null;
          superseded_by_id?: string | null;
          updated_at?: string;
          version?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'knowledge_packs_country_code_fkey';
            columns: ['country_code'];
            isOneToOne: false;
            referencedRelation: 'countries';
            referencedColumns: ['code'];
          },
          {
            foreignKeyName: 'knowledge_packs_superseded_by_id_fkey';
            columns: ['superseded_by_id'];
            isOneToOne: false;
            referencedRelation: 'knowledge_packs';
            referencedColumns: ['id'];
          },
        ];
      };
      knowledge_source_validations: {
        Row: {
          classification_valid: boolean;
          failure_reasons: Json;
          id: string;
          knowledge_source_id: string;
          metadata_valid: boolean;
          outcome: Database['public']['Enums']['validation_outcome'];
          provenance_valid: boolean;
          reviewer_notes: string | null;
          source_valid: boolean;
          structure_valid: boolean;
          validated_at: string;
          validator: string;
        };
        Insert: {
          classification_valid: boolean;
          failure_reasons?: Json;
          id?: string;
          knowledge_source_id: string;
          metadata_valid: boolean;
          outcome: Database['public']['Enums']['validation_outcome'];
          provenance_valid: boolean;
          reviewer_notes?: string | null;
          source_valid: boolean;
          structure_valid: boolean;
          validated_at?: string;
          validator: string;
        };
        Update: {
          classification_valid?: boolean;
          failure_reasons?: Json;
          id?: string;
          knowledge_source_id?: string;
          metadata_valid?: boolean;
          outcome?: Database['public']['Enums']['validation_outcome'];
          provenance_valid?: boolean;
          reviewer_notes?: string | null;
          source_valid?: boolean;
          structure_valid?: boolean;
          validated_at?: string;
          validator?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'knowledge_source_validations_knowledge_source_id_fkey';
            columns: ['knowledge_source_id'];
            isOneToOne: false;
            referencedRelation: 'knowledge_sources';
            referencedColumns: ['id'];
          },
        ];
      };
      knowledge_sources: {
        Row: {
          accessed_at: string | null;
          agency: string;
          content_hash: string | null;
          content_media_type: string | null;
          country_code: string;
          created_at: string;
          effective_date: string | null;
          expiry_date: string | null;
          freshness_state: Database['public']['Enums']['knowledge_freshness_state'];
          id: string;
          knowledge_pack_id: string;
          last_reviewed_date: string | null;
          legal_source_category: Database['public']['Enums']['legal_source_category'];
          municipality: string | null;
          publication_date: string | null;
          region: string | null;
          review_due_at: string | null;
          source_authority: number;
          source_type: Database['public']['Enums']['knowledge_source_type'];
          source_url: string | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          accessed_at?: string | null;
          agency: string;
          content_hash?: string | null;
          content_media_type?: string | null;
          country_code: string;
          created_at?: string;
          effective_date?: string | null;
          expiry_date?: string | null;
          freshness_state?: Database['public']['Enums']['knowledge_freshness_state'];
          id?: string;
          knowledge_pack_id: string;
          last_reviewed_date?: string | null;
          legal_source_category: Database['public']['Enums']['legal_source_category'];
          municipality?: string | null;
          publication_date?: string | null;
          region?: string | null;
          review_due_at?: string | null;
          source_authority: number;
          source_type: Database['public']['Enums']['knowledge_source_type'];
          source_url?: string | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          accessed_at?: string | null;
          agency?: string;
          content_hash?: string | null;
          content_media_type?: string | null;
          country_code?: string;
          created_at?: string;
          effective_date?: string | null;
          expiry_date?: string | null;
          freshness_state?: Database['public']['Enums']['knowledge_freshness_state'];
          id?: string;
          knowledge_pack_id?: string;
          last_reviewed_date?: string | null;
          legal_source_category?: Database['public']['Enums']['legal_source_category'];
          municipality?: string | null;
          publication_date?: string | null;
          region?: string | null;
          review_due_at?: string | null;
          source_authority?: number;
          source_type?: Database['public']['Enums']['knowledge_source_type'];
          source_url?: string | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'knowledge_sources_country_code_fkey';
            columns: ['country_code'];
            isOneToOne: false;
            referencedRelation: 'countries';
            referencedColumns: ['code'];
          },
          {
            foreignKeyName: 'knowledge_sources_knowledge_pack_id_fkey';
            columns: ['knowledge_pack_id'];
            isOneToOne: false;
            referencedRelation: 'knowledge_packs';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          full_name: string | null;
          id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          full_name?: string | null;
          id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          full_name?: string | null;
          id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      publish_knowledge_pack: {
        Args: {
          p_approval_note?: string;
          p_approved_by: string;
          p_pack_id: string;
        };
        Returns: {
          approval_note: string | null;
          country_code: string;
          created_at: string;
          id: string;
          notes: string | null;
          published_at: string | null;
          published_by: string | null;
          status: Database['public']['Enums']['knowledge_pack_status'];
          superseded_at: string | null;
          superseded_by_id: string | null;
          updated_at: string;
          version: string;
        };
        SetofOptions: {
          from: '*';
          to: 'knowledge_packs';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
    };
    Enums: {
      business_status:
        | 'draft'
        | 'intake_started'
        | 'intake_complete'
        | 'launch_plan_generated'
        | 'active'
        | 'archived';
      knowledge_freshness_state:
        'current' | 'review_due' | 'changed_pending_assessment' | 'stale' | 'withdrawn';
      knowledge_pack_status:
        'draft' | 'validating' | 'staged' | 'published' | 'superseded' | 'rolled_back';
      knowledge_source_type:
        | 'act'
        | 'regulation'
        | 'statutory_instrument'
        | 'gazette_notice'
        | 'guidance_note'
        | 'agency_page'
        | 'form'
        | 'fee_schedule';
      legal_source_category:
        | 'constitution'
        | 'primary_legislation'
        | 'regulation'
        | 'ministerial_order'
        | 'official_guidance'
        | 'agency_publication';
      validation_outcome: 'validated' | 'partially_validated' | 'unverified' | 'rejected';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      business_status: [
        'draft',
        'intake_started',
        'intake_complete',
        'launch_plan_generated',
        'active',
        'archived',
      ],
      knowledge_freshness_state: [
        'current',
        'review_due',
        'changed_pending_assessment',
        'stale',
        'withdrawn',
      ],
      knowledge_pack_status: [
        'draft',
        'validating',
        'staged',
        'published',
        'superseded',
        'rolled_back',
      ],
      knowledge_source_type: [
        'act',
        'regulation',
        'statutory_instrument',
        'gazette_notice',
        'guidance_note',
        'agency_page',
        'form',
        'fee_schedule',
      ],
      legal_source_category: [
        'constitution',
        'primary_legislation',
        'regulation',
        'ministerial_order',
        'official_guidance',
        'agency_publication',
      ],
      validation_outcome: ['validated', 'partially_validated', 'unverified', 'rejected'],
    },
  },
} as const;
