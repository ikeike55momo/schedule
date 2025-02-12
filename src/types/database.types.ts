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
      schedules: {
        Row: {
          id: string
          title: string
          start_time: string
          end_time: string
          memo: string
          schedule_date: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          start_time: string
          end_time: string
          memo?: string
          schedule_date: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          start_time?: string
          end_time?: string
          memo?: string
          schedule_date?: string
          user_id?: string
          created_at?: string
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
