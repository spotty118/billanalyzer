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
      commission_accessories: {
        Row: {
          accessory_id: number
          brand: string | null
          category: string
          commission_amount: number | null
          commission_percentage: number | null
          created_at: string | null
          msrp: number | null
          name: string
          updated_at: string | null
        }
        Insert: {
          accessory_id?: number
          brand?: string | null
          category: string
          commission_amount?: number | null
          commission_percentage?: number | null
          created_at?: string | null
          msrp?: number | null
          name: string
          updated_at?: string | null
        }
        Update: {
          accessory_id?: number
          brand?: string | null
          category?: string
          commission_amount?: number | null
          commission_percentage?: number | null
          created_at?: string | null
          msrp?: number | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      commission_brands: {
        Row: {
          brand_id: number
          created_at: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          brand_id?: number
          created_at?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          brand_id?: number
          created_at?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      commission_device_categories: {
        Row: {
          category_id: number
          created_at: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          category_id?: number
          created_at?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          category_id?: number
          created_at?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      commission_devices: {
        Row: {
          brand_id: number | null
          category_id: number | null
          color: string | null
          created_at: string | null
          device_id: number
          dpp_price: number | null
          end_date: string | null
          is_preowned: boolean | null
          model_name: string
          new_line_amount: number | null
          spiff_amount: number | null
          storage_size: string | null
          ultimate_new: number | null
          ultimate_upgrade: number | null
          updated_at: string | null
          upgrade_amount: number | null
          welcome_unlimited_new: number | null
          welcome_unlimited_upgrade: number | null
        }
        Insert: {
          brand_id?: number | null
          category_id?: number | null
          color?: string | null
          created_at?: string | null
          device_id?: number
          dpp_price?: number | null
          end_date?: string | null
          is_preowned?: boolean | null
          model_name: string
          new_line_amount?: number | null
          spiff_amount?: number | null
          storage_size?: string | null
          ultimate_new?: number | null
          ultimate_upgrade?: number | null
          updated_at?: string | null
          upgrade_amount?: number | null
          welcome_unlimited_new?: number | null
          welcome_unlimited_upgrade?: number | null
        }
        Update: {
          brand_id?: number | null
          category_id?: number | null
          color?: string | null
          created_at?: string | null
          device_id?: number
          dpp_price?: number | null
          end_date?: string | null
          is_preowned?: boolean | null
          model_name?: string
          new_line_amount?: number | null
          spiff_amount?: number | null
          storage_size?: string | null
          ultimate_new?: number | null
          ultimate_upgrade?: number | null
          updated_at?: string | null
          upgrade_amount?: number | null
          welcome_unlimited_new?: number | null
          welcome_unlimited_upgrade?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "commission_devices_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "commission_brands"
            referencedColumns: ["brand_id"]
          },
          {
            foreignKeyName: "commission_devices_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "commission_device_categories"
            referencedColumns: ["category_id"]
          },
        ]
      }
      commission_hot_deals: {
        Row: {
          additional_spiff: number | null
          created_at: string | null
          deal_id: number
          device_id: number | null
          discount_amount: number | null
          end_date: string | null
          promotion_name: string | null
          unlimited_plus_commission: number | null
          updated_at: string | null
          welcome_unlimited_commission: number | null
        }
        Insert: {
          additional_spiff?: number | null
          created_at?: string | null
          deal_id?: number
          device_id?: number | null
          discount_amount?: number | null
          end_date?: string | null
          promotion_name?: string | null
          unlimited_plus_commission?: number | null
          updated_at?: string | null
          welcome_unlimited_commission?: number | null
        }
        Update: {
          additional_spiff?: number | null
          created_at?: string | null
          deal_id?: number
          device_id?: number | null
          discount_amount?: number | null
          end_date?: string | null
          promotion_name?: string | null
          unlimited_plus_commission?: number | null
          updated_at?: string | null
          welcome_unlimited_commission?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "commission_hot_deals_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "commission_devices"
            referencedColumns: ["device_id"]
          },
        ]
      }
      commission_plans: {
        Row: {
          base_commission: number | null
          created_at: string | null
          end_date: string | null
          is_business: boolean | null
          name: string
          new_line_commission: number | null
          plan_id: number
          spiff_amount: number | null
          type: string | null
          updated_at: string | null
          upgrade_commission: number | null
        }
        Insert: {
          base_commission?: number | null
          created_at?: string | null
          end_date?: string | null
          is_business?: boolean | null
          name: string
          new_line_commission?: number | null
          plan_id?: number
          spiff_amount?: number | null
          type?: string | null
          updated_at?: string | null
          upgrade_commission?: number | null
        }
        Update: {
          base_commission?: number | null
          created_at?: string | null
          end_date?: string | null
          is_business?: boolean | null
          name?: string
          new_line_commission?: number | null
          plan_id?: number
          spiff_amount?: number | null
          type?: string | null
          updated_at?: string | null
          upgrade_commission?: number | null
        }
        Relationships: []
      }
      commission_services: {
        Row: {
          base_commission: number | null
          category: string | null
          created_at: string | null
          end_date: string | null
          name: string
          service_id: number
          spiff_amount: number | null
          updated_at: string | null
        }
        Insert: {
          base_commission?: number | null
          category?: string | null
          created_at?: string | null
          end_date?: string | null
          name: string
          service_id?: number
          spiff_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          base_commission?: number | null
          category?: string | null
          created_at?: string | null
          end_date?: string | null
          name?: string
          service_id?: number
          spiff_amount?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      devices: {
        Row: {
          base_commission: number
          brand: string
          category: string
          created_at: string
          dpp_price: number | null
          external_id: string
          id: string
          name: string
          spiff_amount: number
          unlimited_plus_new: number
          unlimited_plus_upgrade: number
          updated_at: string
          welcome_new: number
          welcome_upgrade: number
        }
        Insert: {
          base_commission: number
          brand: string
          category: string
          created_at?: string
          dpp_price?: number | null
          external_id: string
          id?: string
          name: string
          spiff_amount: number
          unlimited_plus_new: number
          unlimited_plus_upgrade: number
          updated_at?: string
          welcome_new: number
          welcome_upgrade: number
        }
        Update: {
          base_commission?: number
          brand?: string
          category?: string
          created_at?: string
          dpp_price?: number | null
          external_id?: string
          id?: string
          name?: string
          spiff_amount?: number
          unlimited_plus_new?: number
          unlimited_plus_upgrade?: number
          updated_at?: string
          welcome_new?: number
          welcome_upgrade?: number
        }
        Relationships: []
      }
      verizon_plans: {
        Row: {
          autopay_discount: number | null
          base_price: number
          created_at: string
          data_allowance: Json
          external_id: string
          features: string[]
          id: string
          name: string
          paperless_discount: number | null
          perks: Json[] | null
          plan_level: string | null
          price_1_line: number | null
          price_2_line: number | null
          price_3_line: number | null
          price_4_line: number | null
          price_5plus_line: number | null
          streaming_quality: string
          type: string
          updated_at: string
        }
        Insert: {
          autopay_discount?: number | null
          base_price: number
          created_at?: string
          data_allowance: Json
          external_id: string
          features: string[]
          id?: string
          name: string
          paperless_discount?: number | null
          perks?: Json[] | null
          plan_level?: string | null
          price_1_line?: number | null
          price_2_line?: number | null
          price_3_line?: number | null
          price_4_line?: number | null
          price_5plus_line?: number | null
          streaming_quality: string
          type: string
          updated_at?: string
        }
        Update: {
          autopay_discount?: number | null
          base_price?: number
          created_at?: string
          data_allowance?: Json
          external_id?: string
          features?: string[]
          id?: string
          name?: string
          paperless_discount?: number | null
          perks?: Json[] | null
          plan_level?: string | null
          price_1_line?: number | null
          price_2_line?: number | null
          price_3_line?: number | null
          price_4_line?: number | null
          price_5plus_line?: number | null
          streaming_quality?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      verizon_promotions: {
        Row: {
          created_at: string
          description: string
          eligible_plans: string[] | null
          expires: string
          external_id: string
          id: string
          stackable: boolean | null
          terms: string[] | null
          title: string
          type: string
          updated_at: string
          value: string
          version: string | null
        }
        Insert: {
          created_at?: string
          description: string
          eligible_plans?: string[] | null
          expires: string
          external_id: string
          id?: string
          stackable?: boolean | null
          terms?: string[] | null
          title: string
          type: string
          updated_at?: string
          value: string
          version?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          eligible_plans?: string[] | null
          expires?: string
          external_id?: string
          id?: string
          stackable?: boolean | null
          terms?: string[] | null
          title?: string
          type?: string
          updated_at?: string
          value?: string
          version?: string | null
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
