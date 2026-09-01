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
      admin_config_audit: {
        Row: {
          action: string
          admin_id: string | null
          created_at: string | null
          id: string
          ip_address: string | null
          new_value: Json | null
          old_value: Json | null
        }
        Insert: {
          action: string
          admin_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          new_value?: Json | null
          old_value?: Json | null
        }
        Update: {
          action?: string
          admin_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          new_value?: Json | null
          old_value?: Json | null
        }
        Relationships: []
      }
      admin_config_backups: {
        Row: {
          admin_id: string | null
          config_snapshot: Json
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          admin_id?: string | null
          config_snapshot: Json
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          admin_id?: string | null
          config_snapshot?: Json
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      assistant_feedback: {
        Row: {
          created_at: string | null
          id: string
          message_text: string | null
          rating: number | null
          response_text: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message_text?: string | null
          rating?: number | null
          response_text?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message_text?: string | null
          rating?: number | null
          response_text?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author: string | null
          canonical_url: string | null
          content: string
          cover_image: string | null
          created_at: string
          excerpt: string | null
          id: string
          is_published: boolean
          meta_description: string | null
          meta_title: string | null
          published_at: string
          slug: string
          sort_order: number
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          author?: string | null
          canonical_url?: string | null
          content?: string
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_published?: boolean
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string
          slug: string
          sort_order?: number
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          author?: string | null
          canonical_url?: string | null
          content?: string
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_published?: boolean
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string
          slug?: string
          sort_order?: number
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      brands: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          slug: string | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          slug?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          slug?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          created_at: string
          id: string
          product_id: string | null
          quantity: number
          user_id: string
          variation_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          product_id?: string | null
          quantity?: number
          user_id: string
          variation_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string | null
          quantity?: number
          user_id?: string
          variation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_variation_id_fkey"
            columns: ["variation_id"]
            isOneToOne: false
            referencedRelation: "product_variations"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          banner_image: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          parent_id: string | null
          slug: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          banner_image?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          banner_image?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_conversations: {
        Row: {
          admin_id: string | null
          buyer_id: string
          created_at: string
          id: string
          is_read: boolean | null
          last_message_at: string
          subject: string | null
        }
        Insert: {
          admin_id?: string | null
          buyer_id: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          last_message_at?: string
          subject?: string | null
        }
        Update: {
          admin_id?: string | null
          buyer_id?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          last_message_at?: string
          subject?: string | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          conversation_id: string | null
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          sender_id: string
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          sender_id: string
        }
        Update: {
          conversation_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      checkout_otp_verifications: {
        Row: {
          attempts: number
          consumed_at: string | null
          created_at: string
          expires_at: string
          id: string
          last_sent_at: string
          mobile_number: string
          otp_hash: string
          send_count: number
          user_id: string | null
          verified: boolean
          verified_at: string | null
        }
        Insert: {
          attempts?: number
          consumed_at?: string | null
          created_at?: string
          expires_at: string
          id?: string
          last_sent_at?: string
          mobile_number: string
          otp_hash: string
          send_count?: number
          user_id?: string | null
          verified?: boolean
          verified_at?: string | null
        }
        Update: {
          attempts?: number
          consumed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          last_sent_at?: string
          mobile_number?: string
          otp_hash?: string
          send_count?: number
          user_id?: string | null
          verified?: boolean
          verified_at?: string | null
        }
        Relationships: []
      }
      contact_inquiries: {
        Row: {
          created_at: string | null
          email: string
          id: string
          message: string
          name: string
          status: string | null
          subject: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          message: string
          name: string
          status?: string | null
          subject?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          message?: string
          name?: string
          status?: string | null
          subject?: string | null
        }
        Relationships: []
      }
      coupons: {
        Row: {
          auto_apply: boolean | null
          category_id: string | null
          code: string
          created_at: string
          description: string | null
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean | null
          max_discount_amount: number | null
          min_order_amount: number | null
          min_purchase_amount: number | null
          show_on_product: boolean | null
          start_date: string | null
          starts_at: string | null
          title: string | null
          usage_count: number | null
          usage_limit: number | null
          used_count: number | null
          user_usage_limit: number | null
        }
        Insert: {
          auto_apply?: boolean | null
          category_id?: string | null
          code: string
          created_at?: string
          description?: string | null
          discount_type: string
          discount_value: number
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_discount_amount?: number | null
          min_order_amount?: number | null
          min_purchase_amount?: number | null
          show_on_product?: boolean | null
          start_date?: string | null
          starts_at?: string | null
          title?: string | null
          usage_count?: number | null
          usage_limit?: number | null
          used_count?: number | null
          user_usage_limit?: number | null
        }
        Update: {
          auto_apply?: boolean | null
          category_id?: string | null
          code?: string
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_discount_amount?: number | null
          min_order_amount?: number | null
          min_purchase_amount?: number | null
          show_on_product?: boolean | null
          start_date?: string | null
          starts_at?: string | null
          title?: string | null
          usage_count?: number | null
          usage_limit?: number | null
          used_count?: number | null
          user_usage_limit?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "coupons_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_pincodes: {
        Row: {
          city: string | null
          created_at: string
          delivery_days: number | null
          id: string
          is_active: boolean | null
          is_cod_available: boolean | null
          pincode: string
          state: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string
          delivery_days?: number | null
          id?: string
          is_active?: boolean | null
          is_cod_available?: boolean | null
          pincode: string
          state?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string
          delivery_days?: number | null
          id?: string
          is_active?: boolean | null
          is_cod_available?: boolean | null
          pincode?: string
          state?: string | null
        }
        Relationships: []
      }
      ekart_integration_logs: {
        Row: {
          created_at: string
          event_type: string | null
          id: string
          order_id: string | null
          payload: Json | null
          response: Json | null
          status: string | null
        }
        Insert: {
          created_at?: string
          event_type?: string | null
          id?: string
          order_id?: string | null
          payload?: Json | null
          response?: Json | null
          status?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string | null
          id?: string
          order_id?: string | null
          payload?: Json | null
          response?: Json | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ekart_integration_logs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      email_delivery_logs: {
        Row: {
          correlation_id: string | null
          created_at: string
          email_type: string
          error_message: string | null
          id: string
          metadata: Json
          order_id: string | null
          provider: string
          recipient: string
          smtp_host: string | null
          smtp_port: number | null
          status: string
          subject: string | null
        }
        Insert: {
          correlation_id?: string | null
          created_at?: string
          email_type: string
          error_message?: string | null
          id?: string
          metadata?: Json
          order_id?: string | null
          provider?: string
          recipient: string
          smtp_host?: string | null
          smtp_port?: number | null
          status?: string
          subject?: string | null
        }
        Update: {
          correlation_id?: string | null
          created_at?: string
          email_type?: string
          error_message?: string | null
          id?: string
          metadata?: Json
          order_id?: string | null
          provider?: string
          recipient?: string
          smtp_host?: string | null
          smtp_port?: number | null
          status?: string
          subject?: string | null
        }
        Relationships: []
      }
      email_logs: {
        Row: {
          content: string | null
          id: string
          metadata: Json | null
          notification_type: string | null
          recipient_email: string
          sent_at: string
          status: string | null
          subject: string | null
          template_name: string | null
        }
        Insert: {
          content?: string | null
          id?: string
          metadata?: Json | null
          notification_type?: string | null
          recipient_email: string
          sent_at?: string
          status?: string | null
          subject?: string | null
          template_name?: string | null
        }
        Update: {
          content?: string | null
          id?: string
          metadata?: Json | null
          notification_type?: string | null
          recipient_email?: string
          sent_at?: string
          status?: string | null
          subject?: string | null
          template_name?: string | null
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          content: string
          created_at: string
          id: string
          name: string
          subject: string
          version: number | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          name: string
          subject: string
          version?: number | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          name?: string
          subject?: string
          version?: number | null
        }
        Relationships: []
      }
      family_testimonials: {
        Row: {
          age: string | null
          created_at: string
          heading: string
          id: string
          image_url: string | null
          is_active: boolean
          message: string
          name: string
          rating: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          age?: string | null
          created_at?: string
          heading: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          message: string
          name: string
          rating?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          age?: string | null
          created_at?: string
          heading?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          message?: string
          name?: string
          rating?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      hero_slides: {
        Row: {
          aspect_ratio: string | null
          badge_label: string | null
          created_at: string | null
          cta_link: string | null
          cta_text: string | null
          desktop_height: string | null
          id: string
          image_url: string
          is_active: boolean | null
          link_url: string | null
          mobile_height: string | null
          mobile_image_url: string | null
          overlay: Json | null
          sort_order: number | null
          subtitle: string | null
          title: string | null
        }
        Insert: {
          aspect_ratio?: string | null
          badge_label?: string | null
          created_at?: string | null
          cta_link?: string | null
          cta_text?: string | null
          desktop_height?: string | null
          id?: string
          image_url: string
          is_active?: boolean | null
          link_url?: string | null
          mobile_height?: string | null
          mobile_image_url?: string | null
          overlay?: Json | null
          sort_order?: number | null
          subtitle?: string | null
          title?: string | null
        }
        Update: {
          aspect_ratio?: string | null
          badge_label?: string | null
          created_at?: string | null
          cta_link?: string | null
          cta_text?: string | null
          desktop_height?: string | null
          id?: string
          image_url?: string
          is_active?: boolean | null
          link_url?: string | null
          mobile_height?: string | null
          mobile_image_url?: string | null
          overlay?: Json | null
          sort_order?: number | null
          subtitle?: string | null
          title?: string | null
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount: number | null
          created_at: string
          customer_name: string | null
          due_date: string | null
          id: string
          invoice_number: string | null
          order_id: string | null
          order_number: string | null
          paid_at: string | null
          pdf_url: string | null
          status: string | null
          tax: number | null
          total: number | null
          user_id: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          customer_name?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          order_id?: string | null
          order_number?: string | null
          paid_at?: string | null
          pdf_url?: string | null
          status?: string | null
          tax?: number | null
          total?: number | null
          user_id: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          customer_name?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          order_id?: string | null
          order_number?: string | null
          paid_at?: string | null
          pdf_url?: string | null
          status?: string | null
          tax?: number | null
          total?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          audience: string
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          order_id: string | null
          title: string
          user_id: string | null
        }
        Insert: {
          audience?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          order_id?: string | null
          title: string
          user_id?: string | null
        }
        Update: {
          audience?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          order_id?: string | null
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          order_id: string | null
          price: number
          product_id: string | null
          product_image: string | null
          product_name: string | null
          quantity: number
          total: number
          total_price: number | null
          unit_price: number | null
          variation_details: string | null
          variation_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          order_id?: string | null
          price: number
          product_id?: string | null
          product_image?: string | null
          product_name?: string | null
          quantity: number
          total: number
          total_price?: number | null
          unit_price?: number | null
          variation_details?: string | null
          variation_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          order_id?: string | null
          price?: number
          product_id?: string | null
          product_image?: string | null
          product_name?: string | null
          quantity?: number
          total?: number
          total_price?: number | null
          unit_price?: number | null
          variation_details?: string | null
          variation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_variation_id_fkey"
            columns: ["variation_id"]
            isOneToOne: false
            referencedRelation: "product_variations"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          billing_address: Json | null
          buyer_type: string | null
          coupon_id: string | null
          created_at: string
          discount_amount: number | null
          ekart_last_attempt_at: string | null
          ekart_last_error: string | null
          ekart_sync_status: string | null
          id: string
          mobile_number: string | null
          mobile_verified: boolean
          mobile_verified_at: string | null
          notes: string | null
          order_number: string | null
          payment_status: string | null
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          shipping: number | null
          shipping_address: Json | null
          status: string | null
          subtotal: number | null
          tax: number | null
          total: number | null
          total_amount: number
          tracking_number: string | null
          user_id: string
        }
        Insert: {
          billing_address?: Json | null
          buyer_type?: string | null
          coupon_id?: string | null
          created_at?: string
          discount_amount?: number | null
          ekart_last_attempt_at?: string | null
          ekart_last_error?: string | null
          ekart_sync_status?: string | null
          id?: string
          mobile_number?: string | null
          mobile_verified?: boolean
          mobile_verified_at?: string | null
          notes?: string | null
          order_number?: string | null
          payment_status?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          shipping?: number | null
          shipping_address?: Json | null
          status?: string | null
          subtotal?: number | null
          tax?: number | null
          total?: number | null
          total_amount: number
          tracking_number?: string | null
          user_id: string
        }
        Update: {
          billing_address?: Json | null
          buyer_type?: string | null
          coupon_id?: string | null
          created_at?: string
          discount_amount?: number | null
          ekart_last_attempt_at?: string | null
          ekart_last_error?: string | null
          ekart_sync_status?: string | null
          id?: string
          mobile_number?: string | null
          mobile_verified?: boolean
          mobile_verified_at?: string | null
          notes?: string | null
          order_number?: string | null
          payment_status?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          shipping?: number | null
          shipping_address?: Json | null
          status?: string | null
          subtotal?: number | null
          tax?: number | null
          total?: number | null
          total_amount?: number
          tracking_number?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
        ]
      }
      otp_verification_audit: {
        Row: {
          attempt_count: number
          client_ip: string | null
          id: string
          is_locked_out: boolean
          last_attempt_at: string | null
          mobile_number: string
          user_agent: string | null
        }
        Insert: {
          attempt_count?: number
          client_ip?: string | null
          id?: string
          is_locked_out?: boolean
          last_attempt_at?: string | null
          mobile_number: string
          user_agent?: string | null
        }
        Update: {
          attempt_count?: number
          client_ip?: string | null
          id?: string
          is_locked_out?: boolean
          last_attempt_at?: string | null
          mobile_number?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      password_reset_otps: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          otp_code: string
          verified: boolean
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          otp_code: string
          verified?: boolean
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          otp_code?: string
          verified?: boolean
        }
        Relationships: []
      }
      product_attribute_assignments: {
        Row: {
          attribute_id: string
          attribute_value_id: string
          created_at: string | null
          id: string
          product_id: string
          used_for_variations: boolean | null
          visible_on_product: boolean | null
        }
        Insert: {
          attribute_id: string
          attribute_value_id: string
          created_at?: string | null
          id?: string
          product_id: string
          used_for_variations?: boolean | null
          visible_on_product?: boolean | null
        }
        Update: {
          attribute_id?: string
          attribute_value_id?: string
          created_at?: string | null
          id?: string
          product_id?: string
          used_for_variations?: boolean | null
          visible_on_product?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "product_attribute_assignments_attribute_id_fkey"
            columns: ["attribute_id"]
            isOneToOne: false
            referencedRelation: "product_attributes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_attribute_assignments_attribute_value_id_fkey"
            columns: ["attribute_value_id"]
            isOneToOne: false
            referencedRelation: "product_attribute_values"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_attribute_assignments_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_attribute_values: {
        Row: {
          attribute_id: string
          created_at: string | null
          id: string
          value: string
        }
        Insert: {
          attribute_id: string
          created_at?: string | null
          id?: string
          value: string
        }
        Update: {
          attribute_id?: string
          created_at?: string | null
          id?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_attribute_values_attribute_id_fkey"
            columns: ["attribute_id"]
            isOneToOne: false
            referencedRelation: "product_attributes"
            referencedColumns: ["id"]
          },
        ]
      }
      product_attributes: {
        Row: {
          created_at: string | null
          display_type: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          display_type?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string | null
          display_type?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      product_custom_tabs: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          product_id: string | null
          sort_order: number | null
          tab_content: string | null
          tab_title: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          product_id?: string | null
          sort_order?: number | null
          tab_content?: string | null
          tab_title: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          product_id?: string | null
          sort_order?: number | null
          tab_content?: string | null
          tab_title?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_custom_tabs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_offers: {
        Row: {
          badge_label: string | null
          category_id: string | null
          created_at: string
          description: string | null
          details_url: string | null
          id: string
          is_active: boolean | null
          offer_type: string
          product_id: string | null
          sort_order: number | null
        }
        Insert: {
          badge_label?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          details_url?: string | null
          id?: string
          is_active?: boolean | null
          offer_type: string
          product_id?: string | null
          sort_order?: number | null
        }
        Update: {
          badge_label?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          details_url?: string | null
          id?: string
          is_active?: boolean | null
          offer_type?: string
          product_id?: string | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_offers_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_offers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_reels: {
        Row: {
          category_id: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          object_fit: string | null
          product_id: string
          show_on_home: boolean | null
          show_on_product: boolean | null
          sort_order: number | null
          title: string | null
          updated_at: string | null
          video_url: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          object_fit?: string | null
          product_id: string
          show_on_home?: boolean | null
          show_on_product?: boolean | null
          sort_order?: number | null
          title?: string | null
          updated_at?: string | null
          video_url: string
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          object_fit?: string | null
          product_id?: string
          show_on_home?: boolean | null
          show_on_product?: boolean | null
          sort_order?: number | null
          title?: string | null
          updated_at?: string | null
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_reels_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_reels_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_reviews: {
        Row: {
          created_at: string
          id: string
          is_approved: boolean | null
          is_verified: boolean | null
          photos: string[] | null
          product_id: string | null
          rating: number
          review_text: string | null
          review_title: string | null
          reviewer_name: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_approved?: boolean | null
          is_verified?: boolean | null
          photos?: string[] | null
          product_id?: string | null
          rating: number
          review_text?: string | null
          review_title?: string | null
          reviewer_name: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_approved?: boolean | null
          is_verified?: boolean | null
          photos?: string[] | null
          product_id?: string | null
          rating?: number
          review_text?: string | null
          review_title?: string | null
          reviewer_name?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variations: {
        Row: {
          color: string | null
          color_image: string | null
          created_at: string | null
          gallery_images: string[] | null
          guest_price: number
          id: string
          is_active: boolean | null
          product_id: string
          regular_price: number | null
          retail_moq: number | null
          retail_price: number
          retail_regular_price: number | null
          sale_end_date: string | null
          sale_start_date: string | null
          shop_moq: number | null
          shop_price: number
          shop_regular_price: number | null
          size: string | null
          sku: string | null
          sort_order: number | null
          stock_quantity: number | null
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          color?: string | null
          color_image?: string | null
          created_at?: string | null
          gallery_images?: string[] | null
          guest_price?: number
          id?: string
          is_active?: boolean | null
          product_id: string
          regular_price?: number | null
          retail_moq?: number | null
          retail_price?: number
          retail_regular_price?: number | null
          sale_end_date?: string | null
          sale_start_date?: string | null
          shop_moq?: number | null
          shop_price?: number
          shop_regular_price?: number | null
          size?: string | null
          sku?: string | null
          sort_order?: number | null
          stock_quantity?: number | null
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          color?: string | null
          color_image?: string | null
          created_at?: string | null
          gallery_images?: string[] | null
          guest_price?: number
          id?: string
          is_active?: boolean | null
          product_id?: string
          regular_price?: number | null
          retail_moq?: number | null
          retail_price?: number
          retail_regular_price?: number | null
          sale_end_date?: string | null
          sale_start_date?: string | null
          shop_moq?: number | null
          shop_price?: number
          shop_regular_price?: number | null
          size?: string | null
          sku?: string | null
          sort_order?: number | null
          stock_quantity?: number | null
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_variations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          banner_image: string | null
          brand_id: string | null
          category_id: string | null
          created_at: string | null
          description: string | null
          description_blocks: Json | null
          features: string[] | null
          gst_enabled: boolean | null
          gst_percentage: number | null
          gst_pricing_mode: string | null
          guest_price: number
          has_variations: boolean | null
          height: number | null
          hsn_code: string | null
          id: string
          images: string[] | null
          is_active: boolean | null
          length: number | null
          meta_description: string | null
          meta_title: string | null
          name: string
          regular_price: number
          retail_moq: number
          retail_price: number
          shipping_class: string | null
          shop_moq: number
          shop_price: number
          short_description: string | null
          sku: string | null
          slug: string
          stock_quantity: number | null
          tags: string[] | null
          tax_class: string | null
          updated_at: string | null
          weight: number | null
          width: number | null
        }
        Insert: {
          banner_image?: string | null
          brand_id?: string | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          description_blocks?: Json | null
          features?: string[] | null
          gst_enabled?: boolean | null
          gst_percentage?: number | null
          gst_pricing_mode?: string | null
          guest_price?: number
          has_variations?: boolean | null
          height?: number | null
          hsn_code?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          length?: number | null
          meta_description?: string | null
          meta_title?: string | null
          name: string
          regular_price?: number
          retail_moq?: number
          retail_price?: number
          shipping_class?: string | null
          shop_moq?: number
          shop_price?: number
          short_description?: string | null
          sku?: string | null
          slug: string
          stock_quantity?: number | null
          tags?: string[] | null
          tax_class?: string | null
          updated_at?: string | null
          weight?: number | null
          width?: number | null
        }
        Update: {
          banner_image?: string | null
          brand_id?: string | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          description_blocks?: Json | null
          features?: string[] | null
          gst_enabled?: boolean | null
          gst_percentage?: number | null
          gst_pricing_mode?: string | null
          guest_price?: number
          has_variations?: boolean | null
          height?: number | null
          hsn_code?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          length?: number | null
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          regular_price?: number
          retail_moq?: number
          retail_price?: number
          shipping_class?: string | null
          shop_moq?: number
          shop_price?: number
          short_description?: string | null
          sku?: string | null
          slug?: string
          stock_quantity?: number | null
          tags?: string[] | null
          tax_class?: string | null
          updated_at?: string | null
          weight?: number | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          city: string | null
          company_name: string | null
          country: string | null
          created_at: string
          email: string | null
          full_name: string | null
          gst_number: string | null
          id: string
          is_active: boolean | null
          onboarding_completed: boolean | null
          phone: string | null
          postal_code: string | null
          state: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          gst_number?: string | null
          id?: string
          is_active?: boolean | null
          onboarding_completed?: boolean | null
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          gst_number?: string | null
          id?: string
          is_active?: boolean | null
          onboarding_completed?: boolean | null
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      promo_banners: {
        Row: {
          created_at: string | null
          id: string
          image_url: string
          is_active: boolean | null
          link: string | null
          mobile_image_url: string | null
          offer_text: string | null
          sort_order: number | null
          subtitle: string | null
          title: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url: string
          is_active?: boolean | null
          link?: string | null
          mobile_image_url?: string | null
          offer_text?: string | null
          sort_order?: number | null
          subtitle?: string | null
          title?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string
          is_active?: boolean | null
          link?: string | null
          mobile_image_url?: string | null
          offer_text?: string | null
          sort_order?: number | null
          subtitle?: string | null
          title?: string | null
        }
        Relationships: []
      }
      rfq_cart_items: {
        Row: {
          created_at: string
          id: string
          product_id: string | null
          quantity: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id?: string | null
          quantity?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string | null
          quantity?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rfq_cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      rfq_items: {
        Row: {
          created_at: string
          id: string
          price_quoted: number | null
          product_id: string | null
          product_image: string | null
          product_name: string | null
          quantity: number
          quoted_price: number | null
          rfq_id: string | null
          target_price: number | null
          variation_details: string | null
          variation_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          price_quoted?: number | null
          product_id?: string | null
          product_image?: string | null
          product_name?: string | null
          quantity: number
          quoted_price?: number | null
          rfq_id?: string | null
          target_price?: number | null
          variation_details?: string | null
          variation_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          price_quoted?: number | null
          product_id?: string | null
          product_image?: string | null
          product_name?: string | null
          quantity?: number
          quoted_price?: number | null
          rfq_id?: string | null
          target_price?: number | null
          variation_details?: string | null
          variation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rfq_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfq_items_rfq_id_fkey"
            columns: ["rfq_id"]
            isOneToOne: false
            referencedRelation: "rfq_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfq_items_variation_id_fkey"
            columns: ["variation_id"]
            isOneToOne: false
            referencedRelation: "product_variations"
            referencedColumns: ["id"]
          },
        ]
      }
      rfq_requests: {
        Row: {
          address: string | null
          admin_notes: string | null
          attachments: string[] | null
          buyer_type: string | null
          city: string | null
          company_name: string | null
          country: string | null
          created_at: string
          customer_type: string | null
          email: string | null
          full_name: string | null
          gst_number: string | null
          id: string
          phone: string | null
          postal_code: string | null
          product_id: string | null
          product_name: string | null
          quantity: number
          quoted_price: number | null
          rfq_number: string | null
          state: string | null
          status: string | null
          target_price: number | null
          user_id: string
        }
        Insert: {
          address?: string | null
          admin_notes?: string | null
          attachments?: string[] | null
          buyer_type?: string | null
          city?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string
          customer_type?: string | null
          email?: string | null
          full_name?: string | null
          gst_number?: string | null
          id?: string
          phone?: string | null
          postal_code?: string | null
          product_id?: string | null
          product_name?: string | null
          quantity: number
          quoted_price?: number | null
          rfq_number?: string | null
          state?: string | null
          status?: string | null
          target_price?: number | null
          user_id: string
        }
        Update: {
          address?: string | null
          admin_notes?: string | null
          attachments?: string[] | null
          buyer_type?: string | null
          city?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string
          customer_type?: string | null
          email?: string | null
          full_name?: string | null
          gst_number?: string | null
          id?: string
          phone?: string | null
          postal_code?: string | null
          product_id?: string | null
          product_name?: string | null
          quantity?: number
          quoted_price?: number | null
          rfq_number?: string | null
          state?: string | null
          status?: string | null
          target_price?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rfq_requests_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      security_audit_logs: {
        Row: {
          actor_id: string | null
          created_at: string | null
          email: string | null
          event_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          status: string
          user_agent: string | null
        }
        Insert: {
          actor_id?: string | null
          created_at?: string | null
          email?: string | null
          event_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          status: string
          user_agent?: string | null
        }
        Update: {
          actor_id?: string | null
          created_at?: string | null
          email?: string | null
          event_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          status?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      signup_otp_events: {
        Row: {
          correlation_id: string | null
          created_at: string | null
          email: string
          expires_at: string | null
          full_name: string | null
          id: string
          otp_code: string
          password_hash: string | null
        }
        Insert: {
          correlation_id?: string | null
          created_at?: string | null
          email: string
          expires_at?: string | null
          full_name?: string | null
          id?: string
          otp_code: string
          password_hash?: string | null
        }
        Update: {
          correlation_id?: string | null
          created_at?: string | null
          email?: string
          expires_at?: string | null
          full_name?: string | null
          id?: string
          otp_code?: string
          password_hash?: string | null
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          created_at: string | null
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          created_at?: string | null
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          created_at?: string | null
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      sms_delivery_receipts: {
        Row: {
          id: string
          mobile_number: string
          provider_msg_id: string
          provider_response: Json | null
          received_at: string | null
          status: string
        }
        Insert: {
          id?: string
          mobile_number: string
          provider_msg_id: string
          provider_response?: Json | null
          received_at?: string | null
          status: string
        }
        Update: {
          id?: string
          mobile_number?: string
          provider_msg_id?: string
          provider_response?: Json | null
          received_at?: string | null
          status?: string
        }
        Relationships: []
      }
      sms_logs: {
        Row: {
          created_at: string
          error_details: string | null
          id: string
          message_content: string | null
          notification_type: string
          order_id: string | null
          phone_number: string
          provider_name: string | null
          provider_response: string | null
          sent_at: string | null
          status: string
        }
        Insert: {
          created_at?: string
          error_details?: string | null
          id?: string
          message_content?: string | null
          notification_type: string
          order_id?: string | null
          phone_number: string
          provider_name?: string | null
          provider_response?: string | null
          sent_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          error_details?: string | null
          id?: string
          message_content?: string | null
          notification_type?: string
          order_id?: string | null
          phone_number?: string
          provider_name?: string | null
          provider_response?: string | null
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "sms_logs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_rate_limits: {
        Row: {
          hits: number | null
          key: string
          window_start: string | null
        }
        Insert: {
          hits?: number | null
          key: string
          window_start?: string | null
        }
        Update: {
          hits?: number | null
          key?: string
          window_start?: string | null
        }
        Relationships: []
      }
      sms_retry_logs: {
        Row: {
          admin_id: string | null
          created_at: string | null
          id: string
          original_log_id: string | null
          status: string
        }
        Insert: {
          admin_id?: string | null
          created_at?: string | null
          id?: string
          original_log_id?: string | null
          status: string
        }
        Update: {
          admin_id?: string | null
          created_at?: string | null
          id?: string
          original_log_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "sms_retry_logs_original_log_id_fkey"
            columns: ["original_log_id"]
            isOneToOne: false
            referencedRelation: "sms_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      webhook_events: {
        Row: {
          created_at: string | null
          event_type: string | null
          id: string
          payload: Json | null
          response_body: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          event_type?: string | null
          id?: string
          payload?: Json | null
          response_body?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string | null
          id?: string
          payload?: Json | null
          response_body?: string | null
          status?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_order_sms_status: {
        Args: { _order_id: string }
        Returns: {
          created_at: string
          error_code: string
          id: string
          mobile_number: string
          sent_at: string
          sms_type: string
          status: string
        }[]
      }
      admin_update_order_status: {
        Args: { _order_id: string; _status: string }
        Returns: {
          billing_address: Json | null
          buyer_type: string | null
          coupon_id: string | null
          created_at: string
          discount_amount: number | null
          ekart_last_attempt_at: string | null
          ekart_last_error: string | null
          ekart_sync_status: string | null
          id: string
          mobile_number: string | null
          mobile_verified: boolean
          mobile_verified_at: string | null
          notes: string | null
          order_number: string | null
          payment_status: string | null
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          shipping: number | null
          shipping_address: Json | null
          status: string | null
          subtotal: number | null
          tax: number | null
          total: number | null
          total_amount: number
          tracking_number: string | null
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      check_rate_limit: {
        Args: {
          _event_type: string
          _key: string
          _lockout_minutes: number
          _max_attempts: number
          _window_minutes: number
        }
        Returns: {
          is_locked: boolean
          remaining_attempts: number
        }[]
      }
      check_sms_rate_limit: {
        Args: { _key: string; _max_hits: number; _window_seconds: number }
        Returns: boolean
      }
      create_order_atomic: {
        Args: {
          _billing_address: Json
          _buyer_type: string
          _coupon_id: string
          _items: Json
          _notes: string
          _shipping: number
          _shipping_address: Json
          _tax: number
          _user_id: string
        }
        Returns: {
          billing_address: Json | null
          buyer_type: string | null
          coupon_id: string | null
          created_at: string
          discount_amount: number | null
          ekart_last_attempt_at: string | null
          ekart_last_error: string | null
          ekart_sync_status: string | null
          id: string
          mobile_number: string | null
          mobile_verified: boolean
          mobile_verified_at: string | null
          notes: string | null
          order_number: string | null
          payment_status: string | null
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          shipping: number | null
          shipping_address: Json | null
          status: string | null
          subtotal: number | null
          tax: number | null
          total: number | null
          total_amount: number
          tracking_number: string | null
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_auto_apply_coupon: {
        Args: { _subtotal: number }
        Returns: {
          auto_apply: boolean | null
          category_id: string | null
          code: string
          created_at: string
          description: string | null
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean | null
          max_discount_amount: number | null
          min_order_amount: number | null
          min_purchase_amount: number | null
          show_on_product: boolean | null
          start_date: string | null
          starts_at: string | null
          title: string | null
          usage_count: number | null
          usage_limit: number | null
          used_count: number | null
          user_usage_limit: number | null
        }[]
        SetofOptions: {
          from: "*"
          to: "coupons"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_product_review_stats: {
        Args: { _product_id: string }
        Returns: {
          avg_rating: number
          review_count: number
        }[]
      }
      get_public_product_reviews: {
        Args: { _product_id: string }
        Returns: {
          created_at: string
          id: string
          is_approved: boolean
          is_owner: boolean
          is_verified: boolean
          photos: string[]
          rating: number
          review_text: string
          review_title: string
          reviewer_name: string
        }[]
      }
      get_sms_credentials: {
        Args: never
        Returns: {
          api_key: string
          order_template: string
          otp_template: string
          sender_id: string
          webhook_secret: string
        }[]
      }
      get_sms_delivery_metrics: {
        Args: { _end_date: string; _start_date: string }
        Returns: {
          count: number
          day: string
          error_code: string
          failure_rate: number
          sms_type: string
          status: string
        }[]
      }
      has_role: { Args: { _role: string; _user_id: string }; Returns: boolean }
      increment_coupon_usage: {
        Args: { coupon_id_param: string }
        Returns: undefined
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      list_all_coupons: {
        Args: never
        Returns: {
          auto_apply: boolean | null
          category_id: string | null
          code: string
          created_at: string
          description: string | null
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean | null
          max_discount_amount: number | null
          min_order_amount: number | null
          min_purchase_amount: number | null
          show_on_product: boolean | null
          start_date: string | null
          starts_at: string | null
          title: string | null
          usage_count: number | null
          usage_limit: number | null
          used_count: number | null
          user_usage_limit: number | null
        }[]
        SetofOptions: {
          from: "*"
          to: "coupons"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      list_public_coupons: {
        Args: { _category_id?: string }
        Returns: {
          auto_apply: boolean | null
          category_id: string | null
          code: string
          created_at: string
          description: string | null
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean | null
          max_discount_amount: number | null
          min_order_amount: number | null
          min_purchase_amount: number | null
          show_on_product: boolean | null
          start_date: string | null
          starts_at: string | null
          title: string | null
          usage_count: number | null
          usage_limit: number | null
          used_count: number | null
          user_usage_limit: number | null
        }[]
        SetofOptions: {
          from: "*"
          to: "coupons"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      list_public_recent_reviews: {
        Args: { _limit?: number }
        Returns: {
          created_at: string
          id: string
          rating: number
          review_text: string
          reviewer_name: string
        }[]
      }
      list_signup_otp_events: {
        Args: never
        Returns: {
          correlation_id: string
          created_at: string
          email: string
          expires_at: string
          full_name: string
          id: string
          otp_code: string
        }[]
      }
      list_users_with_roles: {
        Args: never
        Returns: {
          email: string
          full_name: string
          roles: string[]
          user_id: string
        }[]
      }
      log_security_audit_access:
        | {
            Args: { _event_type: string; _metadata?: Json }
            Returns: undefined
          }
        | {
            Args: { _event_type: string; _metadata?: Json; _status?: string }
            Returns: undefined
          }
      log_security_event: {
        Args: {
          _actor_id: string
          _email: string
          _event_type: string
          _metadata: Json
          _status: string
        }
        Returns: undefined
      }
      mark_conversation_read: {
        Args: { _conversation_id: string }
        Returns: undefined
      }
      mark_message_read: { Args: { _message_id: string }; Returns: undefined }
      record_admin_config_audit: {
        Args: { _action: string; _new_value: Json; _old_value: Json }
        Returns: undefined
      }
      validate_coupon: {
        Args: { _code: string; _subtotal: number }
        Returns: {
          code: string
          discount_type: string
          discount_value: number
          error: string
          id: string
          max_discount_amount: number
          min_order_amount: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "shop" | "retail"
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
      app_role: ["admin", "moderator", "user", "shop", "retail"],
    },
  },
} as const
