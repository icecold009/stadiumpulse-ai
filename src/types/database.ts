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
      alerts: {
        Row: {
          ai_confidence: string
          ai_evidence: string
          ai_limitations: string
          ai_recommendation: string
          ai_urgency: string
          created_at: string
          decision_at: string | null
          decision_by: string | null
          handled_at: string | null
          handled_by: string | null
          id: string
          message: string
          operator_decision: string | null
          recommendation_source: string
          severity: string
          snapshot_at: string
          status: string
          venue_id: string
          zone_id: string | null
        }
        Insert: {
          ai_confidence?: string
          ai_evidence?: string
          ai_limitations?: string
          ai_recommendation: string
          ai_urgency?: string
          created_at?: string
          decision_at?: string | null
          decision_by?: string | null
          handled_at?: string | null
          handled_by?: string | null
          id?: string
          message: string
          operator_decision?: string | null
          recommendation_source?: string
          severity: string
          snapshot_at?: string
          status?: string
          venue_id: string
          zone_id?: string | null
        }
        Update: {
          ai_confidence?: string
          ai_evidence?: string
          ai_limitations?: string
          ai_recommendation?: string
          ai_urgency?: string
          created_at?: string
          decision_at?: string | null
          decision_by?: string | null
          handled_at?: string | null
          handled_by?: string | null
          id?: string
          message?: string
          operator_decision?: string | null
          recommendation_source?: string
          severity?: string
          snapshot_at?: string
          status?: string
          venue_id?: string
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alerts_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      copilot_queries: {
        Row: {
          answer: string
          created_at: string
          grounded_data_summary: string
          id: string
          question: string
          user_id: string
        }
        Insert: {
          answer: string
          created_at?: string
          grounded_data_summary: string
          id?: string
          question: string
          user_id: string
        }
        Update: {
          answer?: string
          created_at?: string
          grounded_data_summary?: string
          id?: string
          question?: string
          user_id?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          action: string
          request_count: number
          subject: string
          window_start: string
        }
        Insert: {
          action: string
          request_count?: number
          subject: string
          window_start: string
        }
        Update: {
          action?: string
          request_count?: number
          subject?: string
          window_start?: string
        }
        Relationships: []
      }
      gate_scans: {
        Row: {
          gate_id: string
          id: number
          recorded_at: string
          scan_count: number
        }
        Insert: {
          gate_id: string
          id?: number
          recorded_at?: string
          scan_count: number
        }
        Update: {
          gate_id?: string
          id?: number
          recorded_at?: string
          scan_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "gate_scans_gate_id_fkey"
            columns: ["gate_id"]
            isOneToOne: false
            referencedRelation: "gates"
            referencedColumns: ["id"]
          },
        ]
      }
      gates: {
        Row: {
          id: string
          label: string
          venue_id: string
        }
        Insert: {
          id?: string
          label: string
          venue_id: string
        }
        Update: {
          id?: string
          label?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gates_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      sustainability_metrics: {
        Row: {
          id: number
          metric_type: string
          recorded_at: string
          target: number
          value: number
          venue_id: string
        }
        Insert: {
          id?: number
          metric_type: string
          recorded_at?: string
          target: number
          value: number
          venue_id: string
        }
        Update: {
          id?: number
          metric_type?: string
          recorded_at?: string
          target?: number
          value?: number
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sustainability_metrics_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          role: string
          user_id: string
        }
        Insert: {
          role: string
          user_id: string
        }
        Update: {
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      user_venue_access: {
        Row: {
          user_id: string
          venue_id: string
        }
        Insert: {
          user_id: string
          venue_id: string
        }
        Update: {
          user_id?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_venue_access_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      venues: {
        Row: {
          capacity: number
          city: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          capacity: number
          city: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          capacity?: number
          city?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      volunteers: {
        Row: {
          id: string
          name: string
          status: string
          venue_id: string
          zone_id: string | null
        }
        Insert: {
          id?: string
          name: string
          status: string
          venue_id: string
          zone_id?: string | null
        }
        Update: {
          id?: string
          name?: string
          status?: string
          venue_id?: string
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "volunteers_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteers_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      zone_telemetry: {
        Row: {
          id: number
          occupancy: number
          recorded_at: string
          zone_id: string
        }
        Insert: {
          id?: number
          occupancy: number
          recorded_at?: string
          zone_id: string
        }
        Update: {
          id?: number
          occupancy?: number
          recorded_at?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "zone_telemetry_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      zones: {
        Row: {
          capacity: number
          id: string
          label: string
          venue_id: string
        }
        Insert: {
          capacity: number
          id?: string
          label: string
          venue_id: string
        }
        Update: {
          capacity?: number
          id?: string
          label?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "zones_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      consume_rate_limit: {
        Args: {
          p_action: string
          p_limit: number
          p_subject: string
          p_window_seconds: number
        }
        Returns: boolean
      }
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
