/**
 * GENERATED FILE — DO NOT EDIT BY HAND.
 *
 * Regenerate with:  npm run db:types
 * Source of truth:  supabase/migrations/*.sql
 *
 * Engineering Standards §5 — shared interfaces are centralized and generated
 * from the live schema so types and database cannot disagree.
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  __InternalSupabase: { PostgrestVersion: '14.15' };
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
      profiles: {
        Row: { created_at: string; full_name: string | null; id: string; updated_at: string };
        Insert: { created_at?: string; full_name?: string | null; id: string; updated_at?: string };
        Update: {
          created_at?: string;
          full_name?: string | null;
          id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: {
      business_status:
        | 'draft'
        | 'intake_started'
        | 'intake_complete'
        | 'launch_plan_generated'
        | 'active'
        | 'archived';
    };
    CompositeTypes: { [_ in never]: never };
  };
};

type DefaultSchema = Database['public'];

export type Tables<T extends keyof DefaultSchema['Tables']> = DefaultSchema['Tables'][T]['Row'];
export type TablesInsert<T extends keyof DefaultSchema['Tables']> =
  DefaultSchema['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof DefaultSchema['Tables']> =
  DefaultSchema['Tables'][T]['Update'];
export type Enums<T extends keyof DefaultSchema['Enums']> = DefaultSchema['Enums'][T];

export const BUSINESS_STATUSES = [
  'draft',
  'intake_started',
  'intake_complete',
  'launch_plan_generated',
  'active',
  'archived',
] as const satisfies readonly Enums<'business_status'>[];
