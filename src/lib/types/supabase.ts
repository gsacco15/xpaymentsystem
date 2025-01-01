export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      payments: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          amount: number
          currency: string
          status: string
          customer_email: string | null
          customer_name: string | null
          description: string | null
          metadata: Json | null
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string
          amount: number
          currency: string
          status: string
          customer_email?: string | null
          customer_name?: string | null
          description?: string | null
          metadata?: Json | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          amount?: number
          currency?: string
          status?: string
          customer_email?: string | null
          customer_name?: string | null
          description?: string | null
          metadata?: Json | null
        }
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
  }
} 