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
      ai_recommendations: {
        Row: {
          account_number: string
          created_at: string
          id: number
          plan_details: Json | null
          recommendations: Json
          updated_at: string
        }
        Insert: {
          account_number: string
          created_at?: string
          id?: number
          plan_details?: Json | null
          recommendations: Json
          updated_at?: string
        }
        Update: {
          account_number?: string
          created_at?: string
          id?: number
          plan_details?: Json | null
          recommendations?: Json
          updated_at?: string
        }
        Relationships: []
      }
      bill_analyses: {
        Row: {
          account_number: string
          analysis_data: Json
          billing_period: string
          created_at: string | null
          id: number
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          account_number: string
          analysis_data: Json
          billing_period: string
          created_at?: string | null
          id?: number
          total_amount: number
          updated_at?: string | null
        }
        Update: {
          account_number?: string
          analysis_data?: Json
          billing_period?: string
          created_at?: string | null
          id?: number
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      device_contributions: {
        Row: {
          base_spiff: number | null
          created_at: string | null
          device_name: string
          dpp_price: number | null
          end_date: string | null
          id: number
          manufacturer: string
          plus_ultimate_new: number | null
          plus_ultimate_upgrade: number | null
          updated_at: string | null
          welcome_unlimited_new: number | null
          welcome_unlimited_upgrade: number | null
        }
        Insert: {
          base_spiff?: number | null
          created_at?: string | null
          device_name: string
          dpp_price?: number | null
          end_date?: string | null
          id?: number
          manufacturer: string
          plus_ultimate_new?: number | null
          plus_ultimate_upgrade?: number | null
          updated_at?: string | null
          welcome_unlimited_new?: number | null
          welcome_unlimited_upgrade?: number | null
        }
        Update: {
          base_spiff?: number | null
          created_at?: string | null
          device_name?: string
          dpp_price?: number | null
          end_date?: string | null
          id?: number
          manufacturer?: string
          plus_ultimate_new?: number | null
          plus_ultimate_upgrade?: number | null
          updated_at?: string | null
          welcome_unlimited_new?: number | null
          welcome_unlimited_upgrade?: number | null
        }
        Relationships: []
      }
      files: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          name: string
          project_id: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          name: string
          project_id?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          name?: string
          project_id?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      service_contributions: {
        Row: {
          category: string
          contribution: number | null
          created_at: string | null
          end_date: string | null
          id: number
          name: string
          spiff: number | null
          total_contribution: number | null
          updated_at: string | null
        }
        Insert: {
          category: string
          contribution?: number | null
          created_at?: string | null
          end_date?: string | null
          id?: number
          name: string
          spiff?: number | null
          total_contribution?: number | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          contribution?: number | null
          created_at?: string | null
          end_date?: string | null
          id?: number
          name?: string
          spiff?: number | null
          total_contribution?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      verizon_plans: {
        Row: {
          autopay_discount: number | null
          base_price: number
          created_at: string | null
          data_allowance: Json
          external_id: string
          features: Json
          id: number
          name: string
          paperless_discount: number | null
          plan_level: string | null
          price_1_line: number
          price_2_line: number
          price_3_line: number
          price_4_line: number
          price_5plus_line: number
          streaming_quality: string
          type: string
          updated_at: string | null
        }
        Insert: {
          autopay_discount?: number | null
          base_price: number
          created_at?: string | null
          data_allowance: Json
          external_id: string
          features: Json
          id?: number
          name: string
          paperless_discount?: number | null
          plan_level?: string | null
          price_1_line: number
          price_2_line: number
          price_3_line: number
          price_4_line: number
          price_5plus_line: number
          streaming_quality: string
          type: string
          updated_at?: string | null
        }
        Update: {
          autopay_discount?: number | null
          base_price?: number
          created_at?: string | null
          data_allowance?: Json
          external_id?: string
          features?: Json
          id?: number
          name?: string
          paperless_discount?: number | null
          plan_level?: string | null
          price_1_line?: number
          price_2_line?: number
          price_3_line?: number
          price_4_line?: number
          price_5plus_line?: number
          streaming_quality?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      verizon_promotions: {
        Row: {
          category: string
          created_at: string | null
          description: string
          end_date: string | null
          id: number
          requirements: string[]
          start_date: string | null
          title: string
          updated_at: string | null
          value: number | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description: string
          end_date?: string | null
          id?: number
          requirements: string[]
          start_date?: string | null
          title: string
          updated_at?: string | null
          value?: number | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string
          end_date?: string | null
          id?: number
          requirements?: string[]
          start_date?: string | null
          title?: string
          updated_at?: string | null
          value?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      plan_type: "consumer" | "business"
      streaming_quality: "480p" | "720p" | "1080p" | "4K"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
