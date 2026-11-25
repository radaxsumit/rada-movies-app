/**
 * Generated from the live Supabase schema (project rada-movies).
 * Regenerate after schema changes: `npx supabase gen types typescript --project-id <your-project-ref>`.
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type MediaType = Database["public"]["Enums"]["media_type"];
type Verdict = Database["public"]["Enums"]["verdict"];

export type Database = {
  __InternalSupabase: { PostgrestVersion: "14.18" };
  public: {
    Tables: {
      admins: {
        Row: { created_at: string; user_id: string };
        Insert: { created_at?: string; user_id: string };
        Update: { created_at?: string; user_id?: string };
        Relationships: [
          { foreignKeyName: "admins_user_id_fkey"; columns: ["user_id"]; isOneToOne: true; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      diary_entries: {
        Row: { created_at: string; id: string; media_type: MediaType; rewatch: boolean; tmdb_id: number; user_id: string; watched_on: string };
        Insert: { created_at?: string; id?: string; media_type: MediaType; rewatch?: boolean; tmdb_id: number; user_id: string; watched_on?: string };
        Update: { created_at?: string; id?: string; media_type?: MediaType; rewatch?: boolean; tmdb_id?: number; user_id?: string; watched_on?: string };
        Relationships: [
          { foreignKeyName: "diary_entries_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      follows: {
        Row: { created_at: string; follower_id: string; following_id: string };
        Insert: { created_at?: string; follower_id: string; following_id: string };
        Update: { created_at?: string; follower_id?: string; following_id?: string };
        Relationships: [
          { foreignKeyName: "follows_follower_id_fkey"; columns: ["follower_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "follows_following_id_fkey"; columns: ["following_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      list_items: {
        Row: { list_id: string; media_type: MediaType; note: string | null; position: number; tmdb_id: number };
        Insert: { list_id: string; media_type: MediaType; note?: string | null; position?: number; tmdb_id: number };
        Update: { list_id?: string; media_type?: MediaType; note?: string | null; position?: number; tmdb_id?: number };
        Relationships: [
          { foreignKeyName: "list_items_list_id_fkey"; columns: ["list_id"]; isOneToOne: false; referencedRelation: "lists"; referencedColumns: ["id"] },
        ];
      };
      lists: {
        Row: { created_at: string; description: string | null; id: string; is_public: boolean; title: string; user_id: string };
        Insert: { created_at?: string; description?: string | null; id?: string; is_public?: boolean; title: string; user_id: string };
        Update: { created_at?: string; description?: string | null; id?: string; is_public?: boolean; title?: string; user_id?: string };
        Relationships: [
          { foreignKeyName: "lists_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      profiles: {
        Row: { avatar_url: string | null; bio: string | null; created_at: string; display_name: string | null; id: string; needs_onboarding: boolean; username: string };
        Insert: { avatar_url?: string | null; bio?: string | null; created_at?: string; display_name?: string | null; id: string; needs_onboarding?: boolean; username: string };
        Update: { avatar_url?: string | null; bio?: string | null; created_at?: string; display_name?: string | null; id?: string; needs_onboarding?: boolean; username?: string };
        Relationships: [];
      };
      reports: {
        Row: { comment_id: string | null; created_at: string; id: string; reason: string; reporter_id: string; review_id: string | null };
        Insert: { comment_id?: string | null; created_at?: string; id?: string; reason: string; reporter_id: string; review_id?: string | null };
        Update: { comment_id?: string | null; created_at?: string; id?: string; reason?: string; reporter_id?: string; review_id?: string | null };
        Relationships: [
          { foreignKeyName: "reports_comment_id_fkey"; columns: ["comment_id"]; isOneToOne: false; referencedRelation: "review_comments"; referencedColumns: ["id"] },
          { foreignKeyName: "reports_reporter_id_fkey"; columns: ["reporter_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "reports_review_id_fkey"; columns: ["review_id"]; isOneToOne: false; referencedRelation: "reviews"; referencedColumns: ["id"] },
        ];
      };
      review_comments: {
        Row: { body: string; created_at: string; id: string; parent_id: string | null; review_id: string; user_id: string };
        Insert: { body: string; created_at?: string; id?: string; parent_id?: string | null; review_id: string; user_id: string };
        Update: { body?: string; created_at?: string; id?: string; parent_id?: string | null; review_id?: string; user_id?: string };
        Relationships: [
          { foreignKeyName: "review_comments_parent_id_fkey"; columns: ["parent_id"]; isOneToOne: false; referencedRelation: "review_comments"; referencedColumns: ["id"] },
          { foreignKeyName: "review_comments_review_id_fkey"; columns: ["review_id"]; isOneToOne: false; referencedRelation: "reviews"; referencedColumns: ["id"] },
          { foreignKeyName: "review_comments_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      review_likes: {
        Row: { created_at: string; review_id: string; user_id: string };
        Insert: { created_at?: string; review_id: string; user_id: string };
        Update: { created_at?: string; review_id?: string; user_id?: string };
        Relationships: [
          { foreignKeyName: "review_likes_review_id_fkey"; columns: ["review_id"]; isOneToOne: false; referencedRelation: "reviews"; referencedColumns: ["id"] },
          { foreignKeyName: "review_likes_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      reviews: {
        Row: { body: string | null; comment_count: number; created_at: string; has_spoilers: boolean; id: string; like_count: number; media_type: MediaType; tmdb_id: number; updated_at: string; user_id: string; verdict: Verdict };
        Insert: { body?: string | null; comment_count?: number; created_at?: string; has_spoilers?: boolean; id?: string; like_count?: number; media_type: MediaType; tmdb_id: number; updated_at?: string; user_id: string; verdict: Verdict };
        Update: { body?: string | null; comment_count?: number; created_at?: string; has_spoilers?: boolean; id?: string; like_count?: number; media_type?: MediaType; tmdb_id?: number; updated_at?: string; user_id?: string; verdict?: Verdict };
        Relationships: [
          { foreignKeyName: "reviews_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      title_stats: {
        Row: { masterpiece_count: number; media_type: MediaType; must_watch_count: number; one_time_count: number; review_count: number; skip_count: number; tmdb_id: number };
        Insert: { masterpiece_count?: number; media_type: MediaType; must_watch_count?: number; one_time_count?: number; review_count?: number; skip_count?: number; tmdb_id: number };
        Update: { masterpiece_count?: number; media_type?: MediaType; must_watch_count?: number; one_time_count?: number; review_count?: number; skip_count?: number; tmdb_id?: number };
        Relationships: [];
      };
      watchlist: {
        Row: { created_at: string; media_type: MediaType; tmdb_id: number; user_id: string };
        Insert: { created_at?: string; media_type: MediaType; tmdb_id: number; user_id: string };
        Update: { created_at?: string; media_type?: MediaType; tmdb_id?: number; user_id?: string };
        Relationships: [
          { foreignKeyName: "watchlist_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      bump_title_stats: { Args: { p_delta: number; p_tmdb: number; p_type: MediaType; p_verdict: Verdict }; Returns: undefined };
      delete_my_account: { Args: Record<PropertyKey, never>; Returns: undefined };
      generate_username: { Args: { seed: string }; Returns: string };
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean };
    };
    Enums: {
      media_type: "movie" | "tv";
      verdict: "skip" | "one_time" | "must_watch" | "masterpiece";
    };
    CompositeTypes: { [_ in never]: never };
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
export type Enums<T extends keyof Database["public"]["Enums"]> = Database["public"]["Enums"][T];
