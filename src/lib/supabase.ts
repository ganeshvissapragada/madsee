import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for database
export interface Database {
  public: {
    Tables: {
      blogs: {
        Row: {
          id: string;
          title: string;
          content: string;
          excerpt: string | null;
          hero_image: string | null;
          tags: string[];
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          content: string;
          excerpt?: string | null;
          hero_image?: string | null;
          tags?: string[];
          user_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          content?: string;
          excerpt?: string | null;
          hero_image?: string | null;
          tags?: string[];
          user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}