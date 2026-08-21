// Hand-authored type definitions mirroring the SQL migrations in
// supabase/migrations. If you use the Supabase CLI against a live project,
// you can regenerate this file with:
//   supabase gen types typescript --project-id <id> > src/lib/supabase/database.types.ts

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          avatar_url: string | null;
          locale: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & {
          id: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
        Relationships: [];
      };
      brand_kits: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          display_name: string;
          instagram_handle: string;
          avatar_url: string | null;
          logo_url: string | null;
          logo_alt_url: string | null;
          color_primary: string;
          color_secondary: string;
          color_accent: string;
          color_background: string;
          color_text: string;
          font_heading: string;
          font_body: string;
          button_style: string;
          corner_radius: number;
          visual_style: string;
          footer_text: string | null;
          default_cta: string | null;
          site_or_handle: string | null;
          is_preset: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["brand_kits"]["Row"]> & {
          user_id: string;
          name: string;
          display_name: string;
          instagram_handle: string;
        };
        Update: Partial<Database["public"]["Tables"]["brand_kits"]["Row"]>;
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          user_id: string;
          brand_kit_id: string | null;
          title: string;
          format: "1080x1350" | "1080x1080";
          status: "draft" | "ready" | "exported";
          locale: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["projects"]["Row"]> & {
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["projects"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "projects_brand_kit_id_fkey";
            columns: ["brand_kit_id"];
            isOneToOne: false;
            referencedRelation: "brand_kits";
            referencedColumns: ["id"];
          },
        ];
      };
      content_sources: {
        Row: {
          id: string;
          user_id: string;
          project_id: string;
          type: "url" | "text" | "topic";
          url: string | null;
          title: string | null;
          description: string | null;
          author: string | null;
          image_url: string | null;
          site_name: string | null;
          raw_text: string | null;
          edited_text: string | null;
          summary: string | null;
          central_thesis: string | null;
          patterns: unknown;
          imported_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["content_sources"]["Row"]> & {
          user_id: string;
          project_id: string;
          type: "url" | "text" | "topic";
        };
        Update: Partial<Database["public"]["Tables"]["content_sources"]["Row"]>;
        Relationships: [];
      };
      carousels: {
        Row: {
          id: string;
          user_id: string;
          project_id: string;
          brand_kit_id: string | null;
          title: string;
          framework: string | null;
          format: "1080x1350" | "1080x1080";
          strategy: unknown;
          caption: unknown;
          editorial_score: unknown;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["carousels"]["Row"]> & {
          user_id: string;
          project_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["carousels"]["Row"]>;
        Relationships: [];
      };
      slides: {
        Row: {
          id: string;
          user_id: string;
          carousel_id: string;
          order_index: number;
          type: string;
          template: string;
          format: "1080x1350" | "1080x1080";
          slide_data: unknown;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["slides"]["Row"]> & {
          user_id: string;
          carousel_id: string;
          order_index: number;
          type: string;
        };
        Update: Partial<Database["public"]["Tables"]["slides"]["Row"]>;
        Relationships: [];
      };
      assets: {
        Row: {
          id: string;
          user_id: string;
          brand_kit_id: string | null;
          project_id: string | null;
          kind: "logo" | "logo_alt" | "avatar" | "upload" | "export";
          storage_path: string;
          width: number | null;
          height: number | null;
          mime_type: string;
          size_bytes: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["assets"]["Row"]> & {
          user_id: string;
          kind: "logo" | "logo_alt" | "avatar" | "upload" | "export";
          storage_path: string;
          mime_type: string;
          size_bytes: number;
        };
        Update: Partial<Database["public"]["Tables"]["assets"]["Row"]>;
        Relationships: [];
      };
      exports: {
        Row: {
          id: string;
          user_id: string;
          project_id: string;
          carousel_id: string | null;
          format: "1080x1350" | "1080x1080";
          quality: "standard" | "high" | "maximum";
          file_count: number;
          pdf_included: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["exports"]["Row"]> & {
          user_id: string;
          project_id: string;
          format: "1080x1350" | "1080x1080";
        };
        Update: Partial<Database["public"]["Tables"]["exports"]["Row"]>;
        Relationships: [];
      };
      ai_generations: {
        Row: {
          id: string;
          user_id: string;
          project_id: string | null;
          kind:
            | "structure_preview"
            | "generation"
            | "slide_improvement"
            | "split_slide"
            | "score";
          provider: string;
          model: string | null;
          input_summary: unknown;
          succeeded: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["ai_generations"]["Row"]> & {
          user_id: string;
          kind:
            | "structure_preview"
            | "generation"
            | "slide_improvement"
            | "split_slide"
            | "score";
          provider: string;
        };
        Update: Partial<Database["public"]["Tables"]["ai_generations"]["Row"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
