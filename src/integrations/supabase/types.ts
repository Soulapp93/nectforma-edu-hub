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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      accounting_accounts: {
        Row: {
          account_number: string
          account_type: string
          created_at: string
          establishment_id: string
          id: string
          is_active: boolean
          label: string
          parent_account_id: string | null
          updated_at: string
        }
        Insert: {
          account_number: string
          account_type?: string
          created_at?: string
          establishment_id: string
          id?: string
          is_active?: boolean
          label: string
          parent_account_id?: string | null
          updated_at?: string
        }
        Update: {
          account_number?: string
          account_type?: string
          created_at?: string
          establishment_id?: string
          id?: string
          is_active?: boolean
          label?: string
          parent_account_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounting_accounts_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounting_accounts_parent_account_id_fkey"
            columns: ["parent_account_id"]
            isOneToOne: false
            referencedRelation: "accounting_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      accounting_entries: {
        Row: {
          account_id: string
          created_at: string
          created_by: string | null
          credit: number
          debit: number
          entry_date: string
          establishment_id: string
          id: string
          invoice_id: string | null
          is_validated: boolean
          journal: string
          label: string
          payment_id: string | null
          piece_number: string | null
          updated_at: string
        }
        Insert: {
          account_id: string
          created_at?: string
          created_by?: string | null
          credit?: number
          debit?: number
          entry_date: string
          establishment_id: string
          id?: string
          invoice_id?: string | null
          is_validated?: boolean
          journal?: string
          label: string
          payment_id?: string | null
          piece_number?: string | null
          updated_at?: string
        }
        Update: {
          account_id?: string
          created_at?: string
          created_by?: string | null
          credit?: number
          debit?: number
          entry_date?: string
          establishment_id?: string
          id?: string
          invoice_id?: string | null
          is_validated?: boolean
          journal?: string
          label?: string
          payment_id?: string | null
          piece_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounting_entries_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounting_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounting_entries_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounting_entries_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounting_entries_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_autopilot_runs: {
        Row: {
          ai_model: string | null
          article_id: string | null
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          metadata: Json | null
          run_type: string
          social_posts_generated: number | null
          started_at: string
          status: string
          trend_sources: Json | null
          trend_topic: string | null
        }
        Insert: {
          ai_model?: string | null
          article_id?: string | null
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          run_type?: string
          social_posts_generated?: number | null
          started_at?: string
          status?: string
          trend_sources?: Json | null
          trend_topic?: string | null
        }
        Update: {
          ai_model?: string | null
          article_id?: string | null
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          run_type?: string
          social_posts_generated?: number | null
          started_at?: string
          status?: string
          trend_sources?: Json | null
          trend_topic?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_autopilot_runs_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      assignment_corrections: {
        Row: {
          corrector_id: string
          created_at: string | null
          feedback: string | null
          grade: number | null
          id: string
          published_at: string | null
          submission_id: string
          updated_at: string | null
        }
        Insert: {
          corrector_id: string
          created_at?: string | null
          feedback?: string | null
          grade?: number | null
          id?: string
          published_at?: string | null
          submission_id: string
          updated_at?: string | null
        }
        Update: {
          corrector_id?: string
          created_at?: string | null
          feedback?: string | null
          grade?: number | null
          id?: string
          published_at?: string | null
          submission_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assignment_corrections_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "assignment_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      assignment_files: {
        Row: {
          assignment_id: string
          created_at: string | null
          file_name: string
          file_size: number | null
          file_url: string
          id: string
        }
        Insert: {
          assignment_id: string
          created_at?: string | null
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
        }
        Update: {
          assignment_id?: string
          created_at?: string | null
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
        }
        Relationships: []
      }
      assignment_submissions: {
        Row: {
          assignment_id: string
          content: string | null
          created_at: string | null
          id: string
          status: string | null
          student_id: string
          submitted_at: string | null
          updated_at: string | null
        }
        Insert: {
          assignment_id: string
          content?: string | null
          created_at?: string | null
          id?: string
          status?: string | null
          student_id: string
          submitted_at?: string | null
          updated_at?: string | null
        }
        Update: {
          assignment_id?: string
          content?: string | null
          created_at?: string | null
          id?: string
          status?: string | null
          student_id?: string
          submitted_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      attendance_link_deliveries: {
        Row: {
          attempts: number
          attendance_sheet_id: string
          created_at: string
          id: string
          last_attempt_at: string | null
          last_error: string | null
          message_id: string | null
          status: Database["public"]["Enums"]["attendance_link_delivery_status"]
          student_id: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          attendance_sheet_id: string
          created_at?: string
          id?: string
          last_attempt_at?: string | null
          last_error?: string | null
          message_id?: string | null
          status?: Database["public"]["Enums"]["attendance_link_delivery_status"]
          student_id: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          attendance_sheet_id?: string
          created_at?: string
          id?: string
          last_attempt_at?: string | null
          last_error?: string | null
          message_id?: string | null
          status?: Database["public"]["Enums"]["attendance_link_delivery_status"]
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_link_deliveries_attendance_sheet_id_fkey"
            columns: ["attendance_sheet_id"]
            isOneToOne: false
            referencedRelation: "attendance_sheets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_link_deliveries_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_sheets: {
        Row: {
          closed_at: string | null
          created_at: string
          date: string
          end_time: string
          formation_id: string
          generated_at: string
          id: string
          instructor_absent: boolean
          instructor_id: string | null
          is_open_for_signing: boolean | null
          opened_at: string | null
          promotion_id: string | null
          qr_code: string | null
          room: string | null
          schedule_slot_id: string
          session_type: string | null
          signature_link_expires_at: string | null
          signature_link_sent_at: string | null
          signature_link_token: string | null
          start_time: string
          status: string
          title: string
          updated_at: string
          validated_at: string | null
          validated_by: string | null
        }
        Insert: {
          closed_at?: string | null
          created_at?: string
          date: string
          end_time: string
          formation_id: string
          generated_at?: string
          id?: string
          instructor_absent?: boolean
          instructor_id?: string | null
          is_open_for_signing?: boolean | null
          opened_at?: string | null
          promotion_id?: string | null
          qr_code?: string | null
          room?: string | null
          schedule_slot_id: string
          session_type?: string | null
          signature_link_expires_at?: string | null
          signature_link_sent_at?: string | null
          signature_link_token?: string | null
          start_time: string
          status?: string
          title: string
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Update: {
          closed_at?: string | null
          created_at?: string
          date?: string
          end_time?: string
          formation_id?: string
          generated_at?: string
          id?: string
          instructor_absent?: boolean
          instructor_id?: string | null
          is_open_for_signing?: boolean | null
          opened_at?: string | null
          promotion_id?: string | null
          qr_code?: string | null
          room?: string | null
          schedule_slot_id?: string
          session_type?: string | null
          signature_link_expires_at?: string | null
          signature_link_sent_at?: string | null
          signature_link_token?: string | null
          start_time?: string
          status?: string
          title?: string
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_sheets_formation_id_fkey"
            columns: ["formation_id"]
            isOneToOne: false
            referencedRelation: "formations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_sheets_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_sheets_promotion_id_fkey"
            columns: ["promotion_id"]
            isOneToOne: false
            referencedRelation: "promotions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_sheets_schedule_slot_id_fkey"
            columns: ["schedule_slot_id"]
            isOneToOne: true
            referencedRelation: "schedule_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_sheets_validated_by_fkey"
            columns: ["validated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_signatures: {
        Row: {
          absence_reason: string | null
          absence_reason_type: string | null
          attendance_sheet_id: string
          created_at: string
          delay_minutes: number | null
          id: string
          present: boolean
          signature_data: string | null
          signed_at: string
          updated_at: string
          user_id: string
          user_type: string
        }
        Insert: {
          absence_reason?: string | null
          absence_reason_type?: string | null
          attendance_sheet_id: string
          created_at?: string
          delay_minutes?: number | null
          id?: string
          present?: boolean
          signature_data?: string | null
          signed_at?: string
          updated_at?: string
          user_id: string
          user_type: string
        }
        Update: {
          absence_reason?: string | null
          absence_reason_type?: string | null
          attendance_sheet_id?: string
          created_at?: string
          delay_minutes?: number | null
          id?: string
          present?: boolean
          signature_data?: string | null
          signed_at?: string
          updated_at?: string
          user_id?: string
          user_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_signatures_attendance_sheet_id_fkey"
            columns: ["attendance_sheet_id"]
            isOneToOne: false
            referencedRelation: "attendance_sheets"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_student_links: {
        Row: {
          attendance_sheet_id: string
          created_at: string | null
          expires_at: string | null
          id: string
          is_used: boolean | null
          student_id: string
          token: string
          used_at: string | null
        }
        Insert: {
          attendance_sheet_id: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_used?: boolean | null
          student_id: string
          token?: string
          used_at?: string | null
        }
        Update: {
          attendance_sheet_id?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_used?: boolean | null
          student_id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_student_links_attendance_sheet_id_fkey"
            columns: ["attendance_sheet_id"]
            isOneToOne: false
            referencedRelation: "attendance_sheets"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_clients: {
        Row: {
          address: string | null
          city: string | null
          country: string | null
          created_at: string
          email: string | null
          establishment_id: string
          id: string
          name: string
          notes: string | null
          phone: string | null
          postal_code: string | null
          siret: string | null
          updated_at: string
          vat_number: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          establishment_id: string
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          siret?: string | null
          updated_at?: string
          vat_number?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          establishment_id?: string
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          siret?: string | null
          updated_at?: string
          vat_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_clients_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_analytics: {
        Row: {
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
          ip_hash: string | null
          post_id: string
          referrer: string | null
          scroll_depth: number | null
          time_on_page: number | null
          user_agent: string | null
          visitor_id: string | null
        }
        Insert: {
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          ip_hash?: string | null
          post_id: string
          referrer?: string | null
          scroll_depth?: number | null
          time_on_page?: number | null
          user_agent?: string | null
          visitor_id?: string | null
        }
        Update: {
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          ip_hash?: string | null
          post_id?: string
          referrer?: string | null
          scroll_depth?: number | null
          time_on_page?: number | null
          user_agent?: string | null
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_analytics_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_categories: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          order_index: number | null
          slug: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          order_index?: number | null
          slug: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          order_index?: number | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      blog_post_tags: {
        Row: {
          created_at: string
          id: string
          post_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          tag_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_tags_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_post_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "blog_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author_id: string
          canonical_url: string | null
          category_id: string | null
          content: string
          cover_image_url: string | null
          created_at: string
          excerpt: string | null
          id: string
          published_at: string | null
          read_time_minutes: number | null
          scheduled_for: string | null
          seo_description: string | null
          seo_keywords: string[] | null
          seo_title: string | null
          slug: string
          status: Database["public"]["Enums"]["blog_post_status"]
          title: string
          updated_at: string
          views_count: number
        }
        Insert: {
          author_id: string
          canonical_url?: string | null
          category_id?: string | null
          content: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          published_at?: string | null
          read_time_minutes?: number | null
          scheduled_for?: string | null
          seo_description?: string | null
          seo_keywords?: string[] | null
          seo_title?: string | null
          slug: string
          status?: Database["public"]["Enums"]["blog_post_status"]
          title: string
          updated_at?: string
          views_count?: number
        }
        Update: {
          author_id?: string
          canonical_url?: string | null
          category_id?: string | null
          content?: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          published_at?: string | null
          read_time_minutes?: number | null
          scheduled_for?: string | null
          seo_description?: string | null
          seo_keywords?: string[] | null
          seo_title?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["blog_post_status"]
          title?: string
          updated_at?: string
          views_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_tags: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      chat_group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          role: string | null
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          role?: string | null
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "chat_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_groups: {
        Row: {
          avatar_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          establishment_id: string
          group_type: string | null
          id: string
          is_private: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          establishment_id: string
          group_type?: string | null
          id?: string
          is_private?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          establishment_id?: string
          group_type?: string | null
          id?: string
          is_private?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_groups_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_groups_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_message_attachments: {
        Row: {
          created_at: string | null
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          message_id: string
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          message_id: string
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          message_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string | null
          created_at: string
          group_id: string
          id: string
          is_edited: boolean | null
          message_type: string | null
          sender_id: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          group_id: string
          id?: string
          is_edited?: boolean | null
          message_type?: string | null
          sender_id: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          group_id?: string
          id?: string
          is_edited?: boolean | null
          message_type?: string | null
          sender_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "chat_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      competency_blocks: {
        Row: {
          code: string | null
          coefficient: number
          created_at: string
          description: string | null
          formation_id: string
          id: string
          is_validated_independently: boolean
          order_index: number
          title: string
          updated_at: string
        }
        Insert: {
          code?: string | null
          coefficient?: number
          created_at?: string
          description?: string | null
          formation_id: string
          id?: string
          is_validated_independently?: boolean
          order_index?: number
          title: string
          updated_at?: string
        }
        Update: {
          code?: string | null
          coefficient?: number
          created_at?: string
          description?: string | null
          formation_id?: string
          id?: string
          is_validated_independently?: boolean
          order_index?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "competency_blocks_formation_id_fkey"
            columns: ["formation_id"]
            isOneToOne: false
            referencedRelation: "formations"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          contract_type: Database["public"]["Enums"]["contract_type"]
          created_at: string
          created_by: string | null
          document_url: string | null
          employee_id: string
          end_date: string | null
          establishment_id: string
          gross_salary: number | null
          id: string
          is_active: boolean
          notes: string | null
          start_date: string
          title: string
          trial_period_end: string | null
          updated_at: string
          weekly_hours: number | null
        }
        Insert: {
          contract_type?: Database["public"]["Enums"]["contract_type"]
          created_at?: string
          created_by?: string | null
          document_url?: string | null
          employee_id: string
          end_date?: string | null
          establishment_id: string
          gross_salary?: number | null
          id?: string
          is_active?: boolean
          notes?: string | null
          start_date: string
          title: string
          trial_period_end?: string | null
          updated_at?: string
          weekly_hours?: number | null
        }
        Update: {
          contract_type?: Database["public"]["Enums"]["contract_type"]
          created_at?: string
          created_by?: string | null
          document_url?: string | null
          employee_id?: string
          end_date?: string | null
          establishment_id?: string
          gross_salary?: number | null
          id?: string
          is_active?: boolean
          notes?: string | null
          start_date?: string
          title?: string
          trial_period_end?: string | null
          updated_at?: string
          weekly_hours?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          date_of_birth: string | null
          department: string | null
          email: string | null
          end_date: string | null
          establishment_id: string
          first_name: string
          gross_salary: number | null
          hire_date: string | null
          id: string
          is_active: boolean
          last_name: string
          net_salary: number | null
          notes: string | null
          phone: string | null
          position: string | null
          postal_code: string | null
          profile_photo_url: string | null
          social_security_number: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          date_of_birth?: string | null
          department?: string | null
          email?: string | null
          end_date?: string | null
          establishment_id: string
          first_name: string
          gross_salary?: number | null
          hire_date?: string | null
          id?: string
          is_active?: boolean
          last_name: string
          net_salary?: number | null
          notes?: string | null
          phone?: string | null
          position?: string | null
          postal_code?: string | null
          profile_photo_url?: string | null
          social_security_number?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          date_of_birth?: string | null
          department?: string | null
          email?: string | null
          end_date?: string | null
          establishment_id?: string
          first_name?: string
          gross_salary?: number | null
          hire_date?: string | null
          id?: string
          is_active?: boolean
          last_name?: string
          net_salary?: number | null
          notes?: string | null
          phone?: string | null
          position?: string | null
          postal_code?: string | null
          profile_photo_url?: string | null
          social_security_number?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      establishments: {
        Row: {
          address: string | null
          created_at: string
          director: string | null
          email: string
          id: string
          logo_url: string | null
          name: string
          number_of_instructors: string | null
          number_of_students: string | null
          phone: string | null
          siret: string | null
          theme_background: string | null
          theme_primary: string | null
          theme_secondary: string | null
          theme_sidebar: string | null
          type: string
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          director?: string | null
          email: string
          id?: string
          logo_url?: string | null
          name: string
          number_of_instructors?: string | null
          number_of_students?: string | null
          phone?: string | null
          siret?: string | null
          theme_background?: string | null
          theme_primary?: string | null
          theme_secondary?: string | null
          theme_sidebar?: string | null
          type: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          director?: string | null
          email?: string
          id?: string
          logo_url?: string | null
          name?: string
          number_of_instructors?: string | null
          number_of_students?: string | null
          phone?: string | null
          siret?: string | null
          theme_background?: string | null
          theme_primary?: string | null
          theme_secondary?: string | null
          theme_sidebar?: string | null
          type?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      evaluation_periods: {
        Row: {
          created_at: string
          end_date: string
          formation_id: string
          id: string
          is_locked: boolean
          locked_at: string | null
          locked_by: string | null
          name: string
          order_index: number
          period_type: string
          promotion_id: string | null
          start_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date: string
          formation_id: string
          id?: string
          is_locked?: boolean
          locked_at?: string | null
          locked_by?: string | null
          name: string
          order_index?: number
          period_type?: string
          promotion_id?: string | null
          start_date: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string
          formation_id?: string
          id?: string
          is_locked?: boolean
          locked_at?: string | null
          locked_by?: string | null
          name?: string
          order_index?: number
          period_type?: string
          promotion_id?: string | null
          start_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "evaluation_periods_formation_id_fkey"
            columns: ["formation_id"]
            isOneToOne: false
            referencedRelation: "formations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluation_periods_promotion_id_fkey"
            columns: ["promotion_id"]
            isOneToOne: false
            referencedRelation: "promotions"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluations: {
        Row: {
          coefficient: number
          created_at: string
          description: string | null
          evaluation_date: string | null
          evaluation_type: string
          id: string
          instructor_id: string
          is_published: boolean
          module_id: string
          period_id: string | null
          scale: number
          scale_type: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          coefficient?: number
          created_at?: string
          description?: string | null
          evaluation_date?: string | null
          evaluation_type?: string
          id?: string
          instructor_id: string
          is_published?: boolean
          module_id: string
          period_id?: string | null
          scale?: number
          scale_type?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          coefficient?: number
          created_at?: string
          description?: string | null
          evaluation_date?: string | null
          evaluation_type?: string
          id?: string
          instructor_id?: string
          is_published?: boolean
          module_id?: string
          period_id?: string | null
          scale?: number
          scale_type?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "evaluations_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "formation_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluations_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "evaluation_periods"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_reports: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          category: string
          created_at: string
          employee_id: string
          establishment_id: string
          expense_date: string
          formation_id: string | null
          id: string
          label: string
          notes: string | null
          receipt_url: string | null
          reimbursed_at: string | null
          status: string
          updated_at: string
          vat_amount: number | null
        }
        Insert: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          category?: string
          created_at?: string
          employee_id: string
          establishment_id: string
          expense_date: string
          formation_id?: string | null
          id?: string
          label: string
          notes?: string | null
          receipt_url?: string | null
          reimbursed_at?: string | null
          status?: string
          updated_at?: string
          vat_amount?: number | null
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          category?: string
          created_at?: string
          employee_id?: string
          establishment_id?: string
          expense_date?: string
          formation_id?: string | null
          id?: string
          label?: string
          notes?: string | null
          receipt_url?: string | null
          reimbursed_at?: string | null
          status?: string
          updated_at?: string
          vat_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "expense_reports_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_reports_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_reports_formation_id_fkey"
            columns: ["formation_id"]
            isOneToOne: false
            referencedRelation: "formations"
            referencedColumns: ["id"]
          },
        ]
      }
      formation_modules: {
        Row: {
          coefficient: number
          created_at: string
          credits: number | null
          description: string | null
          duration_hours: number
          evaluation_mode: string
          formation_id: string
          id: string
          order_index: number
          teaching_unit_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          coefficient?: number
          created_at?: string
          credits?: number | null
          description?: string | null
          duration_hours?: number
          evaluation_mode?: string
          formation_id: string
          id?: string
          order_index?: number
          teaching_unit_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          coefficient?: number
          created_at?: string
          credits?: number | null
          description?: string | null
          duration_hours?: number
          evaluation_mode?: string
          formation_id?: string
          id?: string
          order_index?: number
          teaching_unit_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "formation_modules_formation_id_fkey"
            columns: ["formation_id"]
            isOneToOne: false
            referencedRelation: "formations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "formation_modules_teaching_unit_id_fkey"
            columns: ["teaching_unit_id"]
            isOneToOne: false
            referencedRelation: "teaching_units"
            referencedColumns: ["id"]
          },
        ]
      }
      formations: {
        Row: {
          academic_year: string | null
          color: string | null
          created_at: string
          description: string | null
          duration: number
          end_date: string
          establishment_id: string
          id: string
          level: string
          max_students: number
          price: number | null
          semesters_count: number | null
          start_date: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          academic_year?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          duration: number
          end_date: string
          establishment_id: string
          id?: string
          level: string
          max_students?: number
          price?: number | null
          semesters_count?: number | null
          start_date: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          academic_year?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          duration?: number
          end_date?: string
          establishment_id?: string
          id?: string
          level?: string
          max_students?: number
          price?: number | null
          semesters_count?: number | null
          start_date?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "formations_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      funding_sources: {
        Row: {
          agreement_date: string | null
          amount_granted: number
          amount_received: number
          convention_number: string | null
          created_at: string
          documents_url: string[] | null
          end_date: string | null
          establishment_id: string
          formation_id: string | null
          funding_type: string
          id: string
          notes: string | null
          organism_contact: string | null
          organism_email: string | null
          organism_name: string
          start_date: string | null
          status: string
          student_id: string | null
          updated_at: string
        }
        Insert: {
          agreement_date?: string | null
          amount_granted?: number
          amount_received?: number
          convention_number?: string | null
          created_at?: string
          documents_url?: string[] | null
          end_date?: string | null
          establishment_id: string
          formation_id?: string | null
          funding_type?: string
          id?: string
          notes?: string | null
          organism_contact?: string | null
          organism_email?: string | null
          organism_name: string
          start_date?: string | null
          status?: string
          student_id?: string | null
          updated_at?: string
        }
        Update: {
          agreement_date?: string | null
          amount_granted?: number
          amount_received?: number
          convention_number?: string | null
          created_at?: string
          documents_url?: string[] | null
          end_date?: string | null
          establishment_id?: string
          formation_id?: string | null
          funding_type?: string
          id?: string
          notes?: string | null
          organism_contact?: string | null
          organism_email?: string | null
          organism_name?: string
          start_date?: string | null
          status?: string
          student_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "funding_sources_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funding_sources_formation_id_fkey"
            columns: ["formation_id"]
            isOneToOne: false
            referencedRelation: "formations"
            referencedColumns: ["id"]
          },
        ]
      }
      grade_history: {
        Row: {
          change_reason: string | null
          changed_by: string
          created_at: string
          grade_id: string
          id: string
          new_status: string | null
          new_value: number | null
          old_status: string | null
          old_value: number | null
        }
        Insert: {
          change_reason?: string | null
          changed_by: string
          created_at?: string
          grade_id: string
          id?: string
          new_status?: string | null
          new_value?: number | null
          old_status?: string | null
          old_value?: number | null
        }
        Update: {
          change_reason?: string | null
          changed_by?: string
          created_at?: string
          grade_id?: string
          id?: string
          new_status?: string | null
          new_value?: number | null
          old_status?: string | null
          old_value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "grade_history_grade_id_fkey"
            columns: ["grade_id"]
            isOneToOne: false
            referencedRelation: "grades"
            referencedColumns: ["id"]
          },
        ]
      }
      grades: {
        Row: {
          created_at: string
          created_by: string | null
          evaluation_id: string
          id: string
          internal_comment: string | null
          is_absent: boolean
          is_cheating: boolean
          is_dispensed: boolean
          is_excused: boolean
          status: string
          student_id: string
          updated_at: string
          updated_by: string | null
          value: number | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          evaluation_id: string
          id?: string
          internal_comment?: string | null
          is_absent?: boolean
          is_cheating?: boolean
          is_dispensed?: boolean
          is_excused?: boolean
          status?: string
          student_id: string
          updated_at?: string
          updated_by?: string | null
          value?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          evaluation_id?: string
          id?: string
          internal_comment?: string | null
          is_absent?: boolean
          is_cheating?: boolean
          is_dispensed?: boolean
          is_excused?: boolean
          status?: string
          student_id?: string
          updated_at?: string
          updated_by?: string | null
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "grades_evaluation_id_fkey"
            columns: ["evaluation_id"]
            isOneToOne: false
            referencedRelation: "evaluations"
            referencedColumns: ["id"]
          },
        ]
      }
      grading_rules: {
        Row: {
          allow_compensation: boolean
          allow_inter_block_compensation: boolean
          compensation_mode: string
          compensation_threshold: number | null
          created_at: string
          credits_per_semester: number | null
          credits_system: string | null
          eliminatory_threshold: number | null
          formation_id: string
          has_eliminatory_threshold: boolean
          id: string
          mention_ab_threshold: number | null
          mention_bien_threshold: number | null
          mention_passable_threshold: number | null
          mention_tb_threshold: number | null
          scale_id: string | null
          transcript_template_id: string | null
          updated_at: string
          validation_threshold: number
        }
        Insert: {
          allow_compensation?: boolean
          allow_inter_block_compensation?: boolean
          compensation_mode?: string
          compensation_threshold?: number | null
          created_at?: string
          credits_per_semester?: number | null
          credits_system?: string | null
          eliminatory_threshold?: number | null
          formation_id: string
          has_eliminatory_threshold?: boolean
          id?: string
          mention_ab_threshold?: number | null
          mention_bien_threshold?: number | null
          mention_passable_threshold?: number | null
          mention_tb_threshold?: number | null
          scale_id?: string | null
          transcript_template_id?: string | null
          updated_at?: string
          validation_threshold?: number
        }
        Update: {
          allow_compensation?: boolean
          allow_inter_block_compensation?: boolean
          compensation_mode?: string
          compensation_threshold?: number | null
          created_at?: string
          credits_per_semester?: number | null
          credits_system?: string | null
          eliminatory_threshold?: number | null
          formation_id?: string
          has_eliminatory_threshold?: boolean
          id?: string
          mention_ab_threshold?: number | null
          mention_bien_threshold?: number | null
          mention_passable_threshold?: number | null
          mention_tb_threshold?: number | null
          scale_id?: string | null
          transcript_template_id?: string | null
          updated_at?: string
          validation_threshold?: number
        }
        Relationships: [
          {
            foreignKeyName: "grading_rules_formation_id_fkey"
            columns: ["formation_id"]
            isOneToOne: true
            referencedRelation: "formations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grading_rules_scale_id_fkey"
            columns: ["scale_id"]
            isOneToOne: false
            referencedRelation: "grading_scales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grading_rules_transcript_template_id_fkey"
            columns: ["transcript_template_id"]
            isOneToOne: false
            referencedRelation: "transcript_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      grading_scales: {
        Row: {
          created_at: string
          establishment_id: string
          id: string
          is_active: boolean | null
          is_default: boolean | null
          max_value: number | null
          name: string
          passing_value: number | null
          scale_levels: Json | null
          scale_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          establishment_id: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          max_value?: number | null
          name: string
          passing_value?: number | null
          scale_levels?: Json | null
          scale_type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          establishment_id?: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          max_value?: number | null
          name?: string
          passing_value?: number | null
          scale_levels?: Json | null
          scale_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "grading_scales_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_hours: {
        Row: {
          actual_hours: number
          created_at: string
          employee_id: string
          establishment_id: string
          formation_id: string | null
          hourly_rate: number | null
          id: string
          notes: string | null
          period_month: number
          period_year: number
          planned_hours: number
          total_cost: number | null
          updated_at: string
        }
        Insert: {
          actual_hours?: number
          created_at?: string
          employee_id: string
          establishment_id: string
          formation_id?: string | null
          hourly_rate?: number | null
          id?: string
          notes?: string | null
          period_month: number
          period_year: number
          planned_hours?: number
          total_cost?: number | null
          updated_at?: string
        }
        Update: {
          actual_hours?: number
          created_at?: string
          employee_id?: string
          establishment_id?: string
          formation_id?: string | null
          hourly_rate?: number | null
          id?: string
          notes?: string | null
          period_month?: number
          period_year?: number
          planned_hours?: number
          total_cost?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "instructor_hours_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_hours_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_hours_formation_id_fkey"
            columns: ["formation_id"]
            isOneToOne: false
            referencedRelation: "formations"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          created_by: string | null
          email: string
          establishment_id: string
          expires_at: string
          first_name: string | null
          id: string
          last_name: string | null
          role: Database["public"]["Enums"]["user_role"]
          status: Database["public"]["Enums"]["invitation_status"]
          token: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          created_by?: string | null
          email: string
          establishment_id: string
          expires_at: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          role: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["invitation_status"]
          token: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          created_by?: string | null
          email?: string
          establishment_id?: string
          expires_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["invitation_status"]
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          created_at: string
          description: string
          id: string
          invoice_id: string
          order_index: number
          quantity: number
          total: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          invoice_id: string
          order_index?: number
          quantity?: number
          total?: number
          unit_price?: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          order_index?: number
          quantity?: number
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_paid: number
          client_id: string | null
          created_at: string
          created_by: string | null
          discount_percent: number | null
          due_date: string | null
          establishment_id: string
          id: string
          invoice_number: string
          issue_date: string
          notes: string | null
          quote_id: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          subject: string
          subtotal: number
          tax_amount: number
          tax_rate: number | null
          total: number
          updated_at: string
        }
        Insert: {
          amount_paid?: number
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          discount_percent?: number | null
          due_date?: string | null
          establishment_id: string
          id?: string
          invoice_number: string
          issue_date?: string
          notes?: string | null
          quote_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subject: string
          subtotal?: number
          tax_amount?: number
          tax_rate?: number | null
          total?: number
          updated_at?: string
        }
        Update: {
          amount_paid?: number
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          discount_percent?: number | null
          due_date?: string | null
          establishment_id?: string
          id?: string
          invoice_number?: string
          issue_date?: string
          notes?: string | null
          quote_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subject?: string
          subtotal?: number
          tax_amount?: number
          tax_rate?: number | null
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "billing_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          days_count: number
          employee_id: string
          end_date: string
          establishment_id: string
          id: string
          leave_type: Database["public"]["Enums"]["leave_type"]
          reason: string | null
          start_date: string
          status: Database["public"]["Enums"]["leave_status"]
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          days_count?: number
          employee_id: string
          end_date: string
          establishment_id: string
          id?: string
          leave_type?: Database["public"]["Enums"]["leave_type"]
          reason?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["leave_status"]
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          days_count?: number
          employee_id?: string
          end_date?: string
          establishment_id?: string
          id?: string
          leave_type?: Database["public"]["Enums"]["leave_type"]
          reason?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["leave_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      message_attachments: {
        Row: {
          content_type: string | null
          created_at: string
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          message_id: string
        }
        Insert: {
          content_type?: string | null
          created_at?: string
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          message_id: string
        }
        Update: {
          content_type?: string | null
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          message_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      message_recipients: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          is_archived: boolean
          is_deleted: boolean
          is_favorite: boolean
          is_read: boolean
          message_id: string
          read_at: string | null
          recipient_id: string | null
          recipient_type: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_archived?: boolean
          is_deleted?: boolean
          is_favorite?: boolean
          is_read?: boolean
          message_id: string
          read_at?: string | null
          recipient_id?: string | null
          recipient_type?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_archived?: boolean
          is_deleted?: boolean
          is_favorite?: boolean
          is_read?: boolean
          message_id?: string
          read_at?: string | null
          recipient_id?: string | null
          recipient_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_recipients_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachment_count: number
          content: string
          created_at: string
          deleted_at: string | null
          id: string
          is_deleted: boolean | null
          is_draft: boolean
          scheduled_for: string | null
          scheduled_recipients: Json | null
          sender_id: string
          subject: string
          updated_at: string
        }
        Insert: {
          attachment_count?: number
          content: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_deleted?: boolean | null
          is_draft?: boolean
          scheduled_for?: string | null
          scheduled_recipients?: Json | null
          sender_id: string
          subject: string
          updated_at?: string
        }
        Update: {
          attachment_count?: number
          content?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_deleted?: boolean | null
          is_draft?: boolean
          scheduled_for?: string | null
          scheduled_recipients?: Json | null
          sender_id?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      module_assignments: {
        Row: {
          assignment_type: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          is_published: boolean | null
          max_points: number | null
          module_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          assignment_type?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_published?: boolean | null
          max_points?: number | null
          module_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          assignment_type?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_published?: boolean | null
          max_points?: number | null
          module_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      module_contents: {
        Row: {
          content: string | null
          content_type: string
          created_at: string
          description: string | null
          file_name: string | null
          file_url: string | null
          id: string
          module_id: string
          order_index: number
          title: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          content_type: string
          created_at?: string
          description?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          module_id: string
          order_index?: number
          title: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          content_type?: string
          created_at?: string
          description?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          module_id?: string
          order_index?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "module_contents_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "formation_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      module_documents: {
        Row: {
          created_at: string
          description: string | null
          document_type: string
          file_name: string | null
          file_size: number | null
          file_type: string | null
          file_url: string | null
          id: string
          module_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          document_type: string
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          module_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          document_type?: string
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          module_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "module_documents_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "formation_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      module_instructors: {
        Row: {
          created_at: string
          id: string
          instructor_id: string
          module_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          instructor_id: string
          module_id: string
        }
        Update: {
          created_at?: string
          id?: string
          instructor_id?: string
          module_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "module_instructors_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "module_instructors_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "formation_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          first_name: string | null
          id: string
          is_active: boolean
          subscribed_at: string
          unsubscribed_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          first_name?: string | null
          id?: string
          is_active?: boolean
          subscribed_at?: string
          unsubscribed_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          is_active?: boolean
          subscribed_at?: string
          unsubscribed_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          metadata: Json | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          metadata?: Json | null
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          metadata?: Json | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          establishment_id: string
          id: string
          invoice_id: string
          notes: string | null
          payment_date: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          reference: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          establishment_id: string
          id?: string
          invoice_id: string
          notes?: string | null
          payment_date?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          reference?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          establishment_id?: string
          id?: string
          invoice_id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      payslips: {
        Row: {
          bonuses: number | null
          created_at: string
          deductions: number | null
          document_url: string | null
          employee_charges: number | null
          employee_id: string
          employer_charges: number | null
          establishment_id: string
          gross_salary: number
          id: string
          is_validated: boolean
          net_salary: number
          notes: string | null
          period_month: number
          period_year: number
          total_cost: number
          updated_at: string
          validated_at: string | null
          validated_by: string | null
        }
        Insert: {
          bonuses?: number | null
          created_at?: string
          deductions?: number | null
          document_url?: string | null
          employee_charges?: number | null
          employee_id: string
          employer_charges?: number | null
          establishment_id: string
          gross_salary: number
          id?: string
          is_validated?: boolean
          net_salary: number
          notes?: string | null
          period_month: number
          period_year: number
          total_cost?: number
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Update: {
          bonuses?: number | null
          created_at?: string
          deductions?: number | null
          document_url?: string | null
          employee_charges?: number | null
          employee_id?: string
          employer_charges?: number | null
          establishment_id?: string
          gross_salary?: number
          id?: string
          is_validated?: boolean
          net_salary?: number
          notes?: string | null
          period_month?: number
          period_year?: number
          total_cost?: number
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payslips_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payslips_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_user_roles: {
        Row: {
          created_at: string
          granted_at: string
          granted_by: string | null
          id: string
          role: Database["public"]["Enums"]["platform_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_at?: string
          granted_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["platform_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          granted_at?: string
          granted_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["platform_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      promotions: {
        Row: {
          academic_year: string
          capacity: number | null
          created_at: string | null
          end_date: string
          establishment_id: string
          formation_id: string
          id: string
          name: string
          start_date: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          academic_year: string
          capacity?: number | null
          created_at?: string | null
          end_date: string
          establishment_id: string
          formation_id: string
          id?: string
          name: string
          start_date: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          academic_year?: string
          capacity?: number | null
          created_at?: string | null
          end_date?: string
          establishment_id?: string
          formation_id?: string
          id?: string
          name?: string
          start_date?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promotions_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotions_formation_id_fkey"
            columns: ["formation_id"]
            isOneToOne: false
            referencedRelation: "formations"
            referencedColumns: ["id"]
          },
        ]
      }
      questionnaire_answers: {
        Row: {
          answer_file_url: string | null
          answer_text: string | null
          answer_values: Json | null
          created_at: string
          id: string
          points_earned: number | null
          question_id: string
          response_id: string
        }
        Insert: {
          answer_file_url?: string | null
          answer_text?: string | null
          answer_values?: Json | null
          created_at?: string
          id?: string
          points_earned?: number | null
          question_id: string
          response_id: string
        }
        Update: {
          answer_file_url?: string | null
          answer_text?: string | null
          answer_values?: Json | null
          created_at?: string
          id?: string
          points_earned?: number | null
          question_id?: string
          response_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "questionnaire_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questionnaire_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questionnaire_answers_response_id_fkey"
            columns: ["response_id"]
            isOneToOne: false
            referencedRelation: "questionnaire_responses"
            referencedColumns: ["id"]
          },
        ]
      }
      questionnaire_matrix_rows: {
        Row: {
          id: string
          label: string
          order_index: number
          question_id: string
        }
        Insert: {
          id?: string
          label: string
          order_index?: number
          question_id: string
        }
        Update: {
          id?: string
          label?: string
          order_index?: number
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "questionnaire_matrix_rows_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questionnaire_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      questionnaire_options: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          is_correct: boolean | null
          label: string
          order_index: number
          points: number | null
          question_id: string
          value: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          is_correct?: boolean | null
          label: string
          order_index?: number
          points?: number | null
          question_id: string
          value?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          is_correct?: boolean | null
          label?: string
          order_index?: number
          points?: number | null
          question_id?: string
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "questionnaire_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questionnaire_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      questionnaire_questions: {
        Row: {
          condition_operator: string | null
          condition_question_id: string | null
          condition_value: string | null
          created_at: string
          description: string | null
          id: string
          is_required: boolean
          order_index: number
          points: number | null
          question_type: string
          questionnaire_id: string
          section_id: string | null
          settings: Json | null
          title: string
          updated_at: string
        }
        Insert: {
          condition_operator?: string | null
          condition_question_id?: string | null
          condition_value?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_required?: boolean
          order_index?: number
          points?: number | null
          question_type?: string
          questionnaire_id: string
          section_id?: string | null
          settings?: Json | null
          title?: string
          updated_at?: string
        }
        Update: {
          condition_operator?: string | null
          condition_question_id?: string | null
          condition_value?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_required?: boolean
          order_index?: number
          points?: number | null
          question_type?: string
          questionnaire_id?: string
          section_id?: string | null
          settings?: Json | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "questionnaire_questions_condition_question_id_fkey"
            columns: ["condition_question_id"]
            isOneToOne: false
            referencedRelation: "questionnaire_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questionnaire_questions_questionnaire_id_fkey"
            columns: ["questionnaire_id"]
            isOneToOne: false
            referencedRelation: "questionnaires"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questionnaire_questions_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "questionnaire_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      questionnaire_responses: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          ip_hash: string | null
          max_score: number | null
          questionnaire_id: string
          respondent_email: string | null
          respondent_id: string | null
          respondent_name: string | null
          score: number | null
          started_at: string
          user_agent: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          ip_hash?: string | null
          max_score?: number | null
          questionnaire_id: string
          respondent_email?: string | null
          respondent_id?: string | null
          respondent_name?: string | null
          score?: number | null
          started_at?: string
          user_agent?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          ip_hash?: string | null
          max_score?: number | null
          questionnaire_id?: string
          respondent_email?: string | null
          respondent_id?: string | null
          respondent_name?: string | null
          score?: number | null
          started_at?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "questionnaire_responses_questionnaire_id_fkey"
            columns: ["questionnaire_id"]
            isOneToOne: false
            referencedRelation: "questionnaires"
            referencedColumns: ["id"]
          },
        ]
      }
      questionnaire_sections: {
        Row: {
          created_at: string
          description: string | null
          id: string
          order_index: number
          questionnaire_id: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          order_index?: number
          questionnaire_id: string
          title?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          order_index?: number
          questionnaire_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "questionnaire_sections_questionnaire_id_fkey"
            columns: ["questionnaire_id"]
            isOneToOne: false
            referencedRelation: "questionnaires"
            referencedColumns: ["id"]
          },
        ]
      }
      questionnaires: {
        Row: {
          allow_multiple_responses: boolean
          confirmation_message: string | null
          cover_image_url: string | null
          created_at: string
          description: string | null
          establishment_id: string | null
          id: string
          is_accepting_responses: boolean
          is_published: boolean
          owner_id: string
          public_token: string | null
          requires_auth: boolean
          scoring_enabled: boolean
          show_progress_bar: boolean
          shuffle_questions: boolean
          theme_color: string | null
          title: string
          total_points: number | null
          updated_at: string
        }
        Insert: {
          allow_multiple_responses?: boolean
          confirmation_message?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          establishment_id?: string | null
          id?: string
          is_accepting_responses?: boolean
          is_published?: boolean
          owner_id: string
          public_token?: string | null
          requires_auth?: boolean
          scoring_enabled?: boolean
          show_progress_bar?: boolean
          shuffle_questions?: boolean
          theme_color?: string | null
          title?: string
          total_points?: number | null
          updated_at?: string
        }
        Update: {
          allow_multiple_responses?: boolean
          confirmation_message?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          establishment_id?: string | null
          id?: string
          is_accepting_responses?: boolean
          is_published?: boolean
          owner_id?: string
          public_token?: string | null
          requires_auth?: boolean
          scoring_enabled?: boolean
          show_progress_bar?: boolean
          shuffle_questions?: boolean
          theme_color?: string | null
          title?: string
          total_points?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "questionnaires_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_answers: {
        Row: {
          answer_data: Json
          answered_at: string
          id: string
          is_correct: boolean | null
          participant_id: string
          points_earned: number | null
          question_id: string
          session_id: string
          streak_at_time: number | null
          time_taken_ms: number | null
        }
        Insert: {
          answer_data?: Json
          answered_at?: string
          id?: string
          is_correct?: boolean | null
          participant_id: string
          points_earned?: number | null
          question_id: string
          session_id: string
          streak_at_time?: number | null
          time_taken_ms?: number | null
        }
        Update: {
          answer_data?: Json
          answered_at?: string
          id?: string
          is_correct?: boolean | null
          participant_id?: string
          points_earned?: number | null
          question_id?: string
          session_id?: string
          streak_at_time?: number | null
          time_taken_ms?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_answers_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "quiz_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_answers_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "quiz_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_leaderboard_history: {
        Row: {
          created_at: string
          id: string
          participant_id: string
          question_index: number
          rank: number
          score: number
          session_id: string
          streak: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          participant_id: string
          question_index: number
          rank: number
          score: number
          session_id: string
          streak?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          participant_id?: string
          question_index?: number
          rank?: number
          score?: number
          session_id?: string
          streak?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_leaderboard_history_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "quiz_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_leaderboard_history_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "quiz_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_participants: {
        Row: {
          anonymous_id: string | null
          avatar_emoji: string | null
          avatar_url: string | null
          badges: Json | null
          best_streak: number | null
          correct_answers: number | null
          current_streak: number | null
          id: string
          joined_at: string
          nickname: string | null
          rank: number | null
          session_id: string
          team_id: string | null
          total_answered: number | null
          total_score: number | null
          user_id: string | null
        }
        Insert: {
          anonymous_id?: string | null
          avatar_emoji?: string | null
          avatar_url?: string | null
          badges?: Json | null
          best_streak?: number | null
          correct_answers?: number | null
          current_streak?: number | null
          id?: string
          joined_at?: string
          nickname?: string | null
          rank?: number | null
          session_id: string
          team_id?: string | null
          total_answered?: number | null
          total_score?: number | null
          user_id?: string | null
        }
        Update: {
          anonymous_id?: string | null
          avatar_emoji?: string | null
          avatar_url?: string | null
          badges?: Json | null
          best_streak?: number | null
          correct_answers?: number | null
          current_streak?: number | null
          id?: string
          joined_at?: string
          nickname?: string | null
          rank?: number | null
          session_id?: string
          team_id?: string | null
          total_answered?: number | null
          total_score?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_participants_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "quiz_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_participants_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "quiz_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_power_ups: {
        Row: {
          created_at: string
          id: string
          participant_id: string
          power_up_type: string
          question_index: number | null
          session_id: string
          target_participant_id: string | null
          used_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          participant_id: string
          power_up_type: string
          question_index?: number | null
          session_id: string
          target_participant_id?: string | null
          used_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          participant_id?: string
          power_up_type?: string
          question_index?: number | null
          session_id?: string
          target_participant_id?: string | null
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_power_ups_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "quiz_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_power_ups_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "quiz_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_power_ups_target_participant_id_fkey"
            columns: ["target_participant_id"]
            isOneToOne: false
            referencedRelation: "quiz_participants"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          accepted_answers: Json | null
          correct_order: Json | null
          created_at: string
          description: string | null
          explanation: string | null
          id: string
          image_url: string | null
          matching_pairs: Json | null
          options: Json | null
          order_index: number
          points: number | null
          question_type: string
          quiz_id: string
          slider_correct: number | null
          slider_max: number | null
          slider_min: number | null
          slider_tolerance: number | null
          time_limit: number | null
          title: string
          updated_at: string
        }
        Insert: {
          accepted_answers?: Json | null
          correct_order?: Json | null
          created_at?: string
          description?: string | null
          explanation?: string | null
          id?: string
          image_url?: string | null
          matching_pairs?: Json | null
          options?: Json | null
          order_index?: number
          points?: number | null
          question_type?: string
          quiz_id: string
          slider_correct?: number | null
          slider_max?: number | null
          slider_min?: number | null
          slider_tolerance?: number | null
          time_limit?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          accepted_answers?: Json | null
          correct_order?: Json | null
          created_at?: string
          description?: string | null
          explanation?: string | null
          id?: string
          image_url?: string | null
          matching_pairs?: Json | null
          options?: Json | null
          order_index?: number
          points?: number | null
          question_type?: string
          quiz_id?: string
          slider_correct?: number | null
          slider_max?: number | null
          slider_min?: number | null
          slider_tolerance?: number | null
          time_limit?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_sessions: {
        Row: {
          allow_late_join: boolean | null
          created_at: string
          current_question_index: number | null
          current_question_started_at: string | null
          finished_at: string | null
          host_id: string
          id: string
          mode: string
          pin_code: string
          quiz_id: string
          started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          allow_late_join?: boolean | null
          created_at?: string
          current_question_index?: number | null
          current_question_started_at?: string | null
          finished_at?: string | null
          host_id: string
          id?: string
          mode?: string
          pin_code?: string
          quiz_id: string
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          allow_late_join?: boolean | null
          created_at?: string
          current_question_index?: number | null
          current_question_started_at?: string | null
          finished_at?: string | null
          host_id?: string
          id?: string
          mode?: string
          pin_code?: string
          quiz_id?: string
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_sessions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_teams: {
        Row: {
          avatar_emoji: string | null
          color: string | null
          created_at: string
          id: string
          name: string
          session_id: string
          total_score: number | null
        }
        Insert: {
          avatar_emoji?: string | null
          color?: string | null
          created_at?: string
          id?: string
          name: string
          session_id: string
          total_score?: number | null
        }
        Update: {
          avatar_emoji?: string | null
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          session_id?: string
          total_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_teams_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "quiz_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          allow_teams: boolean | null
          bonus_speed_points: boolean | null
          cover_image_url: string | null
          created_at: string
          description: string | null
          establishment_id: string | null
          id: string
          is_published: boolean | null
          max_team_size: number | null
          mode: string
          owner_id: string
          points_per_question: number | null
          power_ups_enabled: boolean | null
          show_correct_answer: boolean | null
          show_leaderboard_after_each: boolean | null
          shuffle_options: boolean | null
          shuffle_questions: boolean | null
          streak_bonus_enabled: boolean | null
          theme_color: string | null
          time_per_question: number | null
          title: string
          total_questions: number | null
          updated_at: string
        }
        Insert: {
          allow_teams?: boolean | null
          bonus_speed_points?: boolean | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          establishment_id?: string | null
          id?: string
          is_published?: boolean | null
          max_team_size?: number | null
          mode?: string
          owner_id: string
          points_per_question?: number | null
          power_ups_enabled?: boolean | null
          show_correct_answer?: boolean | null
          show_leaderboard_after_each?: boolean | null
          shuffle_options?: boolean | null
          shuffle_questions?: boolean | null
          streak_bonus_enabled?: boolean | null
          theme_color?: string | null
          time_per_question?: number | null
          title?: string
          total_questions?: number | null
          updated_at?: string
        }
        Update: {
          allow_teams?: boolean | null
          bonus_speed_points?: boolean | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          establishment_id?: string | null
          id?: string
          is_published?: boolean | null
          max_team_size?: number | null
          mode?: string
          owner_id?: string
          points_per_question?: number | null
          power_ups_enabled?: boolean | null
          show_correct_answer?: boolean | null
          show_leaderboard_after_each?: boolean | null
          shuffle_options?: boolean | null
          shuffle_questions?: boolean | null
          streak_bonus_enabled?: boolean | null
          theme_color?: string | null
          time_per_question?: number | null
          title?: string
          total_questions?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_items: {
        Row: {
          created_at: string
          description: string
          id: string
          order_index: number
          quantity: number
          quote_id: string
          total: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          order_index?: number
          quantity?: number
          quote_id: string
          total?: number
          unit_price?: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          order_index?: number
          quantity?: number
          quote_id?: string
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "quote_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          client_id: string | null
          converted_invoice_id: string | null
          created_at: string
          created_by: string | null
          discount_percent: number | null
          establishment_id: string
          id: string
          issue_date: string
          notes: string | null
          quote_number: string
          status: Database["public"]["Enums"]["quote_status"]
          subject: string
          subtotal: number
          tax_amount: number
          tax_rate: number | null
          total: number
          updated_at: string
          validity_date: string | null
        }
        Insert: {
          client_id?: string | null
          converted_invoice_id?: string | null
          created_at?: string
          created_by?: string | null
          discount_percent?: number | null
          establishment_id: string
          id?: string
          issue_date?: string
          notes?: string | null
          quote_number: string
          status?: Database["public"]["Enums"]["quote_status"]
          subject: string
          subtotal?: number
          tax_amount?: number
          tax_rate?: number | null
          total?: number
          updated_at?: string
          validity_date?: string | null
        }
        Update: {
          client_id?: string | null
          converted_invoice_id?: string | null
          created_at?: string
          created_by?: string | null
          discount_percent?: number | null
          establishment_id?: string
          id?: string
          issue_date?: string
          notes?: string | null
          quote_number?: string
          status?: Database["public"]["Enums"]["quote_status"]
          subject?: string
          subtotal?: number
          tax_amount?: number
          tax_rate?: number | null
          total?: number
          updated_at?: string
          validity_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "billing_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_slots: {
        Row: {
          color: string | null
          created_at: string
          date: string
          end_time: string
          id: string
          instructor_id: string | null
          module_id: string | null
          notes: string | null
          room: string | null
          schedule_id: string
          session_type: string | null
          start_time: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          date: string
          end_time: string
          id?: string
          instructor_id?: string | null
          module_id?: string | null
          notes?: string | null
          room?: string | null
          schedule_id: string
          session_type?: string | null
          start_time: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          date?: string
          end_time?: string
          id?: string
          instructor_id?: string | null
          module_id?: string | null
          notes?: string | null
          room?: string | null
          schedule_id?: string
          session_type?: string | null
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_slots_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_slots_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "formation_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_slots_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      schedules: {
        Row: {
          created_at: string
          description: string | null
          formation_id: string
          id: string
          promotion_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          formation_id: string
          id?: string
          promotion_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          formation_id?: string
          id?: string
          promotion_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedules_formation_id_fkey"
            columns: ["formation_id"]
            isOneToOne: false
            referencedRelation: "formations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedules_promotion_id_fkey"
            columns: ["promotion_id"]
            isOneToOne: false
            referencedRelation: "promotions"
            referencedColumns: ["id"]
          },
        ]
      }
      social_analytics: {
        Row: {
          clicks: number | null
          comments: number | null
          created_at: string
          engagement_rate: number | null
          fetched_at: string
          id: string
          impressions: number | null
          likes: number | null
          platform: Database["public"]["Enums"]["social_platform"]
          raw_data: Json | null
          reach: number | null
          shares: number | null
          social_post_id: string
          views: number | null
          watch_time_seconds: number | null
        }
        Insert: {
          clicks?: number | null
          comments?: number | null
          created_at?: string
          engagement_rate?: number | null
          fetched_at?: string
          id?: string
          impressions?: number | null
          likes?: number | null
          platform: Database["public"]["Enums"]["social_platform"]
          raw_data?: Json | null
          reach?: number | null
          shares?: number | null
          social_post_id: string
          views?: number | null
          watch_time_seconds?: number | null
        }
        Update: {
          clicks?: number | null
          comments?: number | null
          created_at?: string
          engagement_rate?: number | null
          fetched_at?: string
          id?: string
          impressions?: number | null
          likes?: number | null
          platform?: Database["public"]["Enums"]["social_platform"]
          raw_data?: Json | null
          reach?: number | null
          shares?: number | null
          social_post_id?: string
          views?: number | null
          watch_time_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "social_analytics_social_post_id_fkey"
            columns: ["social_post_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      social_media_connections: {
        Row: {
          access_token: string | null
          account_id: string | null
          account_name: string | null
          channel_id: string | null
          connection_status: string
          created_at: string
          id: string
          last_connected_at: string | null
          last_error: string | null
          metadata: Json | null
          page_id: string | null
          permissions_scope: string[] | null
          platform: Database["public"]["Enums"]["social_platform"]
          refresh_token: string | null
          token_expires_at: string | null
          updated_at: string
        }
        Insert: {
          access_token?: string | null
          account_id?: string | null
          account_name?: string | null
          channel_id?: string | null
          connection_status?: string
          created_at?: string
          id?: string
          last_connected_at?: string | null
          last_error?: string | null
          metadata?: Json | null
          page_id?: string | null
          permissions_scope?: string[] | null
          platform: Database["public"]["Enums"]["social_platform"]
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string
        }
        Update: {
          access_token?: string | null
          account_id?: string | null
          account_name?: string | null
          channel_id?: string | null
          connection_status?: string
          created_at?: string
          id?: string
          last_connected_at?: string | null
          last_error?: string | null
          metadata?: Json | null
          page_id?: string | null
          permissions_scope?: string[] | null
          platform?: Database["public"]["Enums"]["social_platform"]
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      social_posts: {
        Row: {
          ai_generated: boolean | null
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          auto_published: boolean | null
          blog_post_id: string | null
          caption: string
          content_type: string | null
          created_at: string
          created_by: string | null
          error_message: string | null
          external_post_id: string | null
          external_post_url: string | null
          hashtags: string[] | null
          id: string
          media_urls: string[] | null
          metadata: Json | null
          platform: Database["public"]["Enums"]["social_platform"]
          published_at: string | null
          retry_count: number | null
          scheduled_for: string | null
          slide_count: number | null
          status: Database["public"]["Enums"]["social_post_status"]
          structured_content: Json | null
          thread_tweets: Json | null
          updated_at: string
          video_script: string | null
        }
        Insert: {
          ai_generated?: boolean | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          auto_published?: boolean | null
          blog_post_id?: string | null
          caption: string
          content_type?: string | null
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          external_post_id?: string | null
          external_post_url?: string | null
          hashtags?: string[] | null
          id?: string
          media_urls?: string[] | null
          metadata?: Json | null
          platform: Database["public"]["Enums"]["social_platform"]
          published_at?: string | null
          retry_count?: number | null
          scheduled_for?: string | null
          slide_count?: number | null
          status?: Database["public"]["Enums"]["social_post_status"]
          structured_content?: Json | null
          thread_tweets?: Json | null
          updated_at?: string
          video_script?: string | null
        }
        Update: {
          ai_generated?: boolean | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          auto_published?: boolean | null
          blog_post_id?: string | null
          caption?: string
          content_type?: string | null
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          external_post_id?: string | null
          external_post_url?: string | null
          hashtags?: string[] | null
          id?: string
          media_urls?: string[] | null
          metadata?: Json | null
          platform?: Database["public"]["Enums"]["social_platform"]
          published_at?: string | null
          retry_count?: number | null
          scheduled_for?: string | null
          slide_count?: number | null
          status?: Database["public"]["Enums"]["social_post_status"]
          structured_content?: Json | null
          thread_tweets?: Json | null
          updated_at?: string
          video_script?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "social_posts_blog_post_id_fkey"
            columns: ["blog_post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      social_publication_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          error_message: string | null
          id: string
          platform: Database["public"]["Enums"]["social_platform"]
          social_post_id: string | null
          status: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          error_message?: string | null
          id?: string
          platform: Database["public"]["Enums"]["social_platform"]
          social_post_id?: string | null
          status: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          error_message?: string | null
          id?: string
          platform?: Database["public"]["Enums"]["social_platform"]
          social_post_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_publication_logs_social_post_id_fkey"
            columns: ["social_post_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      social_publishing_settings: {
        Row: {
          auto_publish_enabled: boolean | null
          auto_publish_platforms:
            | Database["public"]["Enums"]["social_platform"][]
            | null
          autopilot_enabled: boolean | null
          autopilot_frequency: string | null
          autopilot_last_run: string | null
          autopilot_tone: string | null
          autopilot_topics: string[] | null
          best_posting_times: Json | null
          brand_tone: string | null
          content_rules: Json | null
          created_at: string
          default_hashtags: Json | null
          emergency_stop: boolean | null
          forbidden_words: string[] | null
          id: string
          require_approval: boolean | null
          updated_at: string
        }
        Insert: {
          auto_publish_enabled?: boolean | null
          auto_publish_platforms?:
            | Database["public"]["Enums"]["social_platform"][]
            | null
          autopilot_enabled?: boolean | null
          autopilot_frequency?: string | null
          autopilot_last_run?: string | null
          autopilot_tone?: string | null
          autopilot_topics?: string[] | null
          best_posting_times?: Json | null
          brand_tone?: string | null
          content_rules?: Json | null
          created_at?: string
          default_hashtags?: Json | null
          emergency_stop?: boolean | null
          forbidden_words?: string[] | null
          id?: string
          require_approval?: boolean | null
          updated_at?: string
        }
        Update: {
          auto_publish_enabled?: boolean | null
          auto_publish_platforms?:
            | Database["public"]["Enums"]["social_platform"][]
            | null
          autopilot_enabled?: boolean | null
          autopilot_frequency?: string | null
          autopilot_last_run?: string | null
          autopilot_tone?: string | null
          autopilot_topics?: string[] | null
          best_posting_times?: Json | null
          brand_tone?: string | null
          content_rules?: Json | null
          created_at?: string
          default_hashtags?: Json | null
          emergency_stop?: boolean | null
          forbidden_words?: string[] | null
          id?: string
          require_approval?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      student_fees: {
        Row: {
          amount: number
          amount_paid: number
          created_at: string
          due_date: string | null
          establishment_id: string
          fee_type: string
          formation_id: string
          id: string
          label: string
          notes: string | null
          payment_schedule: Json | null
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          amount?: number
          amount_paid?: number
          created_at?: string
          due_date?: string | null
          establishment_id: string
          fee_type?: string
          formation_id: string
          id?: string
          label: string
          notes?: string | null
          payment_schedule?: Json | null
          status?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          amount_paid?: number
          created_at?: string
          due_date?: string | null
          establishment_id?: string
          fee_type?: string
          formation_id?: string
          id?: string
          label?: string
          notes?: string | null
          payment_schedule?: Json | null
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_fees_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_fees_formation_id_fkey"
            columns: ["formation_id"]
            isOneToOne: false
            referencedRelation: "formations"
            referencedColumns: ["id"]
          },
        ]
      }
      student_promotion_assignments: {
        Row: {
          assigned_at: string | null
          id: string
          promotion_id: string
          student_id: string
        }
        Insert: {
          assigned_at?: string | null
          id?: string
          promotion_id: string
          student_id: string
        }
        Update: {
          assigned_at?: string | null
          id?: string
          promotion_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_promotion_assignments_promotion_id_fkey"
            columns: ["promotion_id"]
            isOneToOne: false
            referencedRelation: "promotions"
            referencedColumns: ["id"]
          },
        ]
      }
      sub_modules: {
        Row: {
          coefficient: number
          created_at: string
          description: string | null
          duration_hours: number
          id: string
          instructor_id: string | null
          module_id: string
          order_index: number
          title: string
          updated_at: string
        }
        Insert: {
          coefficient?: number
          created_at?: string
          description?: string | null
          duration_hours?: number
          id?: string
          instructor_id?: string | null
          module_id: string
          order_index?: number
          title: string
          updated_at?: string
        }
        Update: {
          coefficient?: number
          created_at?: string
          description?: string | null
          duration_hours?: number
          id?: string
          instructor_id?: string | null
          module_id?: string
          order_index?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sub_modules_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sub_modules_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "formation_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      submission_files: {
        Row: {
          created_at: string | null
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          submission_id: string
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          submission_id: string
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          submission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "submission_files_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "assignment_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      teaching_units: {
        Row: {
          block_id: string | null
          code: string | null
          coefficient: number
          created_at: string
          credits: number | null
          formation_id: string
          id: string
          order_index: number
          title: string
          updated_at: string
        }
        Insert: {
          block_id?: string | null
          code?: string | null
          coefficient?: number
          created_at?: string
          credits?: number | null
          formation_id: string
          id?: string
          order_index?: number
          title: string
          updated_at?: string
        }
        Update: {
          block_id?: string | null
          code?: string | null
          coefficient?: number
          created_at?: string
          credits?: number | null
          formation_id?: string
          id?: string
          order_index?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teaching_units_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "competency_blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teaching_units_formation_id_fkey"
            columns: ["formation_id"]
            isOneToOne: false
            referencedRelation: "formations"
            referencedColumns: ["id"]
          },
        ]
      }
      text_book_entries: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          date: string
          end_time: string | null
          homework: string | null
          id: string
          instructor_id: string | null
          objectives: string | null
          schedule_slot_id: string | null
          start_time: string | null
          subject_matter: string | null
          text_book_id: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          date: string
          end_time?: string | null
          homework?: string | null
          id?: string
          instructor_id?: string | null
          objectives?: string | null
          schedule_slot_id?: string | null
          start_time?: string | null
          subject_matter?: string | null
          text_book_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          date?: string
          end_time?: string | null
          homework?: string | null
          id?: string
          instructor_id?: string | null
          objectives?: string | null
          schedule_slot_id?: string | null
          start_time?: string | null
          subject_matter?: string | null
          text_book_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "text_book_entries_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "text_book_entries_schedule_slot_id_fkey"
            columns: ["schedule_slot_id"]
            isOneToOne: false
            referencedRelation: "schedule_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "text_book_entries_text_book_id_fkey"
            columns: ["text_book_id"]
            isOneToOne: false
            referencedRelation: "text_books"
            referencedColumns: ["id"]
          },
        ]
      }
      text_book_entry_files: {
        Row: {
          created_at: string | null
          entry_id: string
          file_name: string
          file_size: number | null
          file_url: string
          id: string
        }
        Insert: {
          created_at?: string | null
          entry_id: string
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
        }
        Update: {
          created_at?: string | null
          entry_id?: string
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
        }
        Relationships: []
      }
      text_books: {
        Row: {
          academic_year: string | null
          created_at: string
          created_by: string | null
          description: string | null
          formation_id: string
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          academic_year?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          formation_id: string
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          academic_year?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          formation_id?: string
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "text_books_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "text_books_formation_id_fkey"
            columns: ["formation_id"]
            isOneToOne: false
            referencedRelation: "formations"
            referencedColumns: ["id"]
          },
        ]
      }
      transcript_modules: {
        Row: {
          coefficient: number
          created_at: string
          credits_earned: number | null
          credits_possible: number | null
          id: string
          is_validated: boolean
          module_average: number | null
          module_id: string
          teaching_unit_id: string | null
          transcript_id: string
        }
        Insert: {
          coefficient?: number
          created_at?: string
          credits_earned?: number | null
          credits_possible?: number | null
          id?: string
          is_validated?: boolean
          module_average?: number | null
          module_id: string
          teaching_unit_id?: string | null
          transcript_id: string
        }
        Update: {
          coefficient?: number
          created_at?: string
          credits_earned?: number | null
          credits_possible?: number | null
          id?: string
          is_validated?: boolean
          module_average?: number | null
          module_id?: string
          teaching_unit_id?: string | null
          transcript_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transcript_modules_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "formation_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transcript_modules_teaching_unit_id_fkey"
            columns: ["teaching_unit_id"]
            isOneToOne: false
            referencedRelation: "teaching_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transcript_modules_transcript_id_fkey"
            columns: ["transcript_id"]
            isOneToOne: false
            referencedRelation: "transcripts"
            referencedColumns: ["id"]
          },
        ]
      }
      transcript_templates: {
        Row: {
          columns_config: Json | null
          created_at: string
          description: string | null
          establishment_id: string
          footer_config: Json | null
          header_config: Json | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          style_config: Json | null
          template_type: string
          updated_at: string
        }
        Insert: {
          columns_config?: Json | null
          created_at?: string
          description?: string | null
          establishment_id: string
          footer_config?: Json | null
          header_config?: Json | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          style_config?: Json | null
          template_type?: string
          updated_at?: string
        }
        Update: {
          columns_config?: Json | null
          created_at?: string
          description?: string | null
          establishment_id?: string
          footer_config?: Json | null
          header_config?: Json | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          style_config?: Json | null
          template_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transcript_templates_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      transcripts: {
        Row: {
          created_at: string
          decision: string | null
          formation_id: string
          general_average: number | null
          generated_at: string | null
          id: string
          is_published: boolean
          jury_comment: string | null
          jury_date: string | null
          mention: string | null
          pdf_url: string | null
          period_id: string | null
          published_at: string | null
          student_id: string
          total_credits: number | null
          updated_at: string
          validated_credits: number | null
        }
        Insert: {
          created_at?: string
          decision?: string | null
          formation_id: string
          general_average?: number | null
          generated_at?: string | null
          id?: string
          is_published?: boolean
          jury_comment?: string | null
          jury_date?: string | null
          mention?: string | null
          pdf_url?: string | null
          period_id?: string | null
          published_at?: string | null
          student_id: string
          total_credits?: number | null
          updated_at?: string
          validated_credits?: number | null
        }
        Update: {
          created_at?: string
          decision?: string | null
          formation_id?: string
          general_average?: number | null
          generated_at?: string | null
          id?: string
          is_published?: boolean
          jury_comment?: string | null
          jury_date?: string | null
          mention?: string | null
          pdf_url?: string | null
          period_id?: string | null
          published_at?: string | null
          student_id?: string
          total_credits?: number | null
          updated_at?: string
          validated_credits?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "transcripts_formation_id_fkey"
            columns: ["formation_id"]
            isOneToOne: false
            referencedRelation: "formations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transcripts_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "evaluation_periods"
            referencedColumns: ["id"]
          },
        ]
      }
      tutor_student_assignments: {
        Row: {
          assigned_at: string
          id: string
          is_active: boolean
          student_id: string
          tutor_id: string
          updated_at: string
        }
        Insert: {
          assigned_at?: string
          id?: string
          is_active?: boolean
          student_id: string
          tutor_id: string
          updated_at?: string
        }
        Update: {
          assigned_at?: string
          id?: string
          is_active?: boolean
          student_id?: string
          tutor_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tutor_student_assignments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tutor_student_assignments_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "tutors"
            referencedColumns: ["id"]
          },
        ]
      }
      tutors: {
        Row: {
          company_name: string | null
          created_at: string
          email: string
          establishment_id: string
          first_name: string
          id: string
          is_activated: boolean
          last_name: string
          phone: string | null
          position: string | null
          profile_photo_url: string | null
          updated_at: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          email: string
          establishment_id: string
          first_name: string
          id?: string
          is_activated?: boolean
          last_name: string
          phone?: string | null
          position?: string | null
          profile_photo_url?: string | null
          updated_at?: string
        }
        Update: {
          company_name?: string | null
          created_at?: string
          email?: string
          establishment_id?: string
          first_name?: string
          id?: string
          is_activated?: boolean
          last_name?: string
          phone?: string | null
          position?: string | null
          profile_photo_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tutors_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activation_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          token: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          token: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          token?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_formation_assignments: {
        Row: {
          assigned_at: string
          formation_id: string
          id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          formation_id: string
          id?: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          formation_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_formation_assignments_formation_id_fkey"
            columns: ["formation_id"]
            isOneToOne: false
            referencedRelation: "formations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_formation_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_signatures: {
        Row: {
          created_at: string
          id: string
          signature_data: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          signature_data: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          signature_data?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string
          email: string
          establishment_id: string
          first_name: string
          id: string
          is_activated: boolean
          last_name: string
          phone: string | null
          profile_photo_url: string | null
          role: Database["public"]["Enums"]["user_role"]
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          establishment_id: string
          first_name: string
          id?: string
          is_activated?: boolean
          last_name: string
          phone?: string | null
          profile_photo_url?: string | null
          role: Database["public"]["Enums"]["user_role"]
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          establishment_id?: string
          first_name?: string
          id?: string
          is_activated?: boolean
          last_name?: string
          phone?: string | null
          profile_photo_url?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_document_shares: {
        Row: {
          created_at: string
          document_id: string
          id: string
          permission: string
          shared_by: string
          shared_with_id: string
        }
        Insert: {
          created_at?: string
          document_id: string
          id?: string
          permission?: string
          shared_by: string
          shared_with_id: string
        }
        Update: {
          created_at?: string
          document_id?: string
          id?: string
          permission?: string
          shared_by?: string
          shared_with_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_document_shares_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "workspace_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_documents: {
        Row: {
          content: Json | null
          created_at: string
          document_type: string
          establishment_id: string | null
          folder_id: string | null
          id: string
          is_shared: boolean
          last_edited_by: string | null
          owner_id: string
          owner_type: string
          title: string
          updated_at: string
        }
        Insert: {
          content?: Json | null
          created_at?: string
          document_type?: string
          establishment_id?: string | null
          folder_id?: string | null
          id?: string
          is_shared?: boolean
          last_edited_by?: string | null
          owner_id: string
          owner_type?: string
          title?: string
          updated_at?: string
        }
        Update: {
          content?: Json | null
          created_at?: string
          document_type?: string
          establishment_id?: string | null
          folder_id?: string | null
          id?: string
          is_shared?: boolean
          last_edited_by?: string | null
          owner_id?: string
          owner_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_documents_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_documents_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "workspace_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_folders: {
        Row: {
          created_at: string
          establishment_id: string | null
          id: string
          name: string
          owner_id: string
          owner_type: string
          parent_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          establishment_id?: string | null
          id?: string
          name: string
          owner_id: string
          owner_type?: string
          parent_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          establishment_id?: string | null
          id?: string
          name?: string
          owner_id?: string
          owner_type?: string
          parent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_folders_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "workspace_folders"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      tutor_students_view: {
        Row: {
          assignment_id: string | null
          establishment_id: string | null
          is_active: boolean | null
          student_email: string | null
          student_first_name: string | null
          student_id: string | null
          student_last_name: string | null
          tutor_email: string | null
          tutor_first_name: string | null
          tutor_id: string | null
          tutor_last_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tutor_student_assignments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tutor_student_assignments_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "tutors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tutors_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      calculate_read_time: { Args: { content: string }; Returns: number }
      can_access_formation_grades: {
        Args: { _formation_id: string }
        Returns: boolean
      }
      can_access_message: { Args: { _message_id: string }; Returns: boolean }
      can_access_module: { Args: { _module_id: string }; Returns: boolean }
      can_manage_attendance_student_links: {
        Args: { _sheet_id: string }
        Returns: boolean
      }
      can_manage_blog: { Args: never; Returns: boolean }
      can_manage_evaluation: {
        Args: { _evaluation_id: string }
        Returns: boolean
      }
      can_manage_module: { Args: { _module_id: string }; Returns: boolean }
      generate_signature_token: { Args: { sheet_id: string }; Returns: string }
      get_current_user_establishment: { Args: never; Returns: string }
      get_current_user_role: { Args: never; Returns: string }
      get_establishment_group_id: {
        Args: { _establishment_id: string }
        Returns: string
      }
      get_formation_students: {
        Args: { formation_id_param: string }
        Returns: {
          email: string
          first_name: string
          last_name: string
          phone: string
          profile_photo_url: string
          user_id: string
        }[]
      }
      get_my_context: { Args: never; Returns: Json }
      get_my_profile: { Args: never; Returns: Json }
      get_promotion_students: {
        Args: { promotion_id_param: string }
        Returns: {
          email: string
          first_name: string
          last_name: string
          phone: string
          profile_photo_url: string
          user_id: string
        }[]
      }
      get_tutor_apprentice_formations: {
        Args: never
        Returns: {
          formation_color: string
          formation_description: string
          formation_duration: number
          formation_end_date: string
          formation_id: string
          formation_level: string
          formation_start_date: string
          formation_status: string
          formation_title: string
          modules_count: number
          student_email: string
          student_first_name: string
          student_id: string
          student_last_name: string
        }[]
      }
      has_platform_role: {
        Args: {
          _role: Database["public"]["Enums"]["platform_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_current_user_admin: { Args: never; Returns: boolean }
      is_document_owner: { Args: { _document_id: string }; Returns: boolean }
      is_document_shared_with_me: {
        Args: { _document_id: string }
        Returns: boolean
      }
      is_document_shared_with_me_edit: {
        Args: { _document_id: string }
        Returns: boolean
      }
      is_group_admin: {
        Args: { _group_id: string; _user_id: string }
        Returns: boolean
      }
      is_member_of_group: {
        Args: { _group_id: string; _user_id: string }
        Returns: boolean
      }
      is_message_sender: { Args: { _message_id: string }; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      validate_signature_token: {
        Args: { token_param: string }
        Returns: {
          error_message: string
          is_valid: boolean
          sheet_id: string
        }[]
      }
      validate_student_link_token: {
        Args: { token_param: string }
        Returns: {
          error_message: string
          is_valid: boolean
          link_id: string
          sheet_id: string
          student_id: string
        }[]
      }
    }
    Enums: {
      attendance_link_delivery_status: "pending" | "sent" | "failed"
      blog_post_status: "draft" | "published" | "scheduled" | "archived"
      contract_type:
        | "CDI"
        | "CDD"
        | "interim"
        | "freelance"
        | "apprenticeship"
        | "internship"
        | "other"
      invitation_status: "pending" | "accepted" | "expired" | "cancelled"
      invoice_status:
        | "draft"
        | "sent"
        | "paid"
        | "partially_paid"
        | "overdue"
        | "cancelled"
        | "refunded"
      leave_status: "pending" | "approved" | "rejected" | "cancelled"
      leave_type:
        | "paid_leave"
        | "sick_leave"
        | "unpaid_leave"
        | "maternity"
        | "paternity"
        | "training"
        | "other"
      payment_method: "bank_transfer" | "check" | "cash" | "card" | "other"
      platform_role:
        | "super_admin"
        | "blog_editor"
        | "seo_manager"
        | "analytics_viewer"
      quote_status:
        | "draft"
        | "sent"
        | "accepted"
        | "rejected"
        | "expired"
        | "converted"
      social_platform:
        | "linkedin"
        | "twitter"
        | "facebook"
        | "instagram"
        | "tiktok"
        | "youtube"
        | "threads"
        | "pinterest"
      social_post_status:
        | "draft"
        | "scheduled"
        | "publishing"
        | "published"
        | "failed"
        | "cancelled"
      user_role: "AdminPrincipal" | "Admin" | "Formateur" | "Étudiant"
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
    Enums: {
      attendance_link_delivery_status: ["pending", "sent", "failed"],
      blog_post_status: ["draft", "published", "scheduled", "archived"],
      contract_type: [
        "CDI",
        "CDD",
        "interim",
        "freelance",
        "apprenticeship",
        "internship",
        "other",
      ],
      invitation_status: ["pending", "accepted", "expired", "cancelled"],
      invoice_status: [
        "draft",
        "sent",
        "paid",
        "partially_paid",
        "overdue",
        "cancelled",
        "refunded",
      ],
      leave_status: ["pending", "approved", "rejected", "cancelled"],
      leave_type: [
        "paid_leave",
        "sick_leave",
        "unpaid_leave",
        "maternity",
        "paternity",
        "training",
        "other",
      ],
      payment_method: ["bank_transfer", "check", "cash", "card", "other"],
      platform_role: [
        "super_admin",
        "blog_editor",
        "seo_manager",
        "analytics_viewer",
      ],
      quote_status: [
        "draft",
        "sent",
        "accepted",
        "rejected",
        "expired",
        "converted",
      ],
      social_platform: [
        "linkedin",
        "twitter",
        "facebook",
        "instagram",
        "tiktok",
        "youtube",
        "threads",
        "pinterest",
      ],
      social_post_status: [
        "draft",
        "scheduled",
        "publishing",
        "published",
        "failed",
        "cancelled",
      ],
      user_role: ["AdminPrincipal", "Admin", "Formateur", "Étudiant"],
    },
  },
} as const
