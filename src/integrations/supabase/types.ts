export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      daily_reports: {
        Row: {
          approved_qty: number | null
          created_at: string
          id: string
          note: string
          owner_id: string
          photos: Json
          project_id: string
          qty: number
          report_date: string
          reporter: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          task_id: string | null
          updated_at: string
        }
        Insert: {
          approved_qty?: number | null
          created_at?: string
          id?: string
          note?: string
          owner_id?: string
          photos?: Json
          project_id: string
          qty?: number
          report_date?: string
          reporter?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          task_id?: string | null
          updated_at?: string
        }
        Update: {
          approved_qty?: number | null
          created_at?: string
          id?: string
          note?: string
          owner_id?: string
          photos?: Json
          project_id?: string
          qty?: number
          report_date?: string
          reporter?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          task_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_reports_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_reports_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "schedule_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      project_expenses: {
        Row: {
          amount: number
          created_at: string
          description: string
          expense_date: string
          id: string
          invoice_ref: string
          note: string
          owner_id: string
          phase: string
          project_id: string
          supplier: string
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          description?: string
          expense_date?: string
          id?: string
          invoice_ref?: string
          note?: string
          owner_id?: string
          phase?: string
          project_id: string
          supplier?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          expense_date?: string
          id?: string
          invoice_ref?: string
          note?: string
          owner_id?: string
          phase?: string
          project_id?: string
          supplier?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_expenses_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          alerts: number
          client: string
          created_at: string
          id: string
          legacy_id: string | null
          location: string
          meshes: Json
          model_ext: string | null
          model_name: string | null
          model_path: string | null
          model_size: number | null
          name: string
          overrides: Json
          owner_id: string
          phase: string
          phases: Json
          price_overrides: Json
          quantities: Json | null
          spent_pct: number
          structure_type: string | null
          total_mt: number
          updated_at: string
        }
        Insert: {
          alerts?: number
          client?: string
          created_at?: string
          id?: string
          legacy_id?: string | null
          location?: string
          meshes?: Json
          model_ext?: string | null
          model_name?: string | null
          model_path?: string | null
          model_size?: number | null
          name: string
          overrides?: Json
          owner_id?: string
          phase?: string
          phases?: Json
          price_overrides?: Json
          quantities?: Json | null
          spent_pct?: number
          structure_type?: string | null
          total_mt?: number
          updated_at?: string
        }
        Update: {
          alerts?: number
          client?: string
          created_at?: string
          id?: string
          legacy_id?: string | null
          location?: string
          meshes?: Json
          model_ext?: string | null
          model_name?: string | null
          model_path?: string | null
          model_size?: number | null
          name?: string
          overrides?: Json
          owner_id?: string
          phase?: string
          phases?: Json
          price_overrides?: Json
          quantities?: Json | null
          spent_pct?: number
          structure_type?: string | null
          total_mt?: number
          updated_at?: string
        }
        Relationships: []
      }
      schedule_tasks: {
        Row: {
          created_at: string
          critical: boolean
          dur_weeks: number
          id: string
          kind: string
          name: string
          owner_id: string
          phase: string
          planned_pct: number
          project_id: string
          start_week: number
          status: string
          target_qty: number
          unit: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          critical?: boolean
          dur_weeks?: number
          id?: string
          kind?: string
          name: string
          owner_id?: string
          phase?: string
          planned_pct?: number
          project_id: string
          start_week?: number
          status?: string
          target_qty?: number
          unit?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          critical?: boolean
          dur_weeks?: number
          id?: string
          kind?: string
          name?: string
          owner_id?: string
          phase?: string
          planned_pct?: number
          project_id?: string
          start_week?: number
          status?: string
          target_qty?: number
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
