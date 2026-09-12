/**
 * Supabase の DB 型定義。
 *
 * 本番では次のコマンドで自動生成して上書きする（手書きの内容は初期プレースホルダー）:
 *   npm run gen:types
 *
 * 00001_init.sql のスキーマと手動で同期している。
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type BookStatus = "wishlist" | "unread" | "reading" | "completed";
export type BookSource = "google_books" | "openbd" | "manual";
export type MemoType =
  | "note"
  | "quote"
  | "summary"
  | "review"
  | "vocabulary"
  | "action";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string | null;
          display_name: string | null;
          avatar_url: string | null;
          is_public: boolean | null;
          yearly_goal: number | null;
          created_at: string | null;
        };
        Insert: {
          id: string;
          username?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          is_public?: boolean | null;
          yearly_goal?: number | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          username?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          is_public?: boolean | null;
          yearly_goal?: number | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      books: {
        Row: {
          id: string;
          isbn13: string | null;
          isbn10: string | null;
          title: string;
          authors: string[] | null;
          publisher: string | null;
          published_date: string | null;
          cover_url: string | null;
          description: string | null;
          categories: string[] | null;
          source: BookSource | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          isbn13?: string | null;
          isbn10?: string | null;
          title: string;
          authors?: string[] | null;
          publisher?: string | null;
          published_date?: string | null;
          cover_url?: string | null;
          description?: string | null;
          categories?: string[] | null;
          source?: BookSource | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          isbn13?: string | null;
          isbn10?: string | null;
          title?: string;
          authors?: string[] | null;
          publisher?: string | null;
          published_date?: string | null;
          cover_url?: string | null;
          description?: string | null;
          categories?: string[] | null;
          source?: BookSource | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      user_books: {
        Row: {
          id: string;
          user_id: string;
          book_id: string;
          status: BookStatus;
          rating: number | null;
          started_at: string | null;
          completed_at: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          book_id: string;
          status: BookStatus;
          rating?: number | null;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          book_id?: string;
          status?: BookStatus;
          rating?: number | null;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "user_books_book_id_fkey";
            columns: ["book_id"];
            isOneToOne: false;
            referencedRelation: "books";
            referencedColumns: ["id"];
          },
        ];
      };
      reading_histories: {
        Row: {
          id: string;
          user_book_id: string;
          started_at: string | null;
          completed_at: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_book_id: string;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_book_id?: string;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "reading_histories_user_book_id_fkey";
            columns: ["user_book_id"];
            isOneToOne: false;
            referencedRelation: "user_books";
            referencedColumns: ["id"];
          },
        ];
      };
      book_memos: {
        Row: {
          id: string;
          user_book_id: string;
          type: MemoType;
          content: string;
          page: number | null;
          section: string | null;
          is_completed: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_book_id: string;
          type: MemoType;
          content: string;
          page?: number | null;
          section?: string | null;
          is_completed?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_book_id?: string;
          type?: MemoType;
          content?: string;
          page?: number | null;
          section?: string | null;
          is_completed?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "book_memos_user_book_id_fkey";
            columns: ["user_book_id"];
            isOneToOne: false;
            referencedRelation: "user_books";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
