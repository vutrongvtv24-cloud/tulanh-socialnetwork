
import { createBrowserClient } from '@supabase/ssr'

let supabaseClient: ReturnType<typeof createBrowserClient> | null = null;

/**
 * Singleton pattern for Supabase client
 * Tránh tạo nhiều instances, giảm memory leak với subscriptions
 */
export function createClient() {
  if (!supabaseClient) {
    supabaseClient = createBrowserClient(
      'https://uoqyotwurkyjdrawqbpe.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvcXlvdHd1cmt5amRyYXdxYnBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3NjUzOTksImV4cCI6MjA4NDM0MTM5OX0.brBwR5Xb4GclhbieaSS3dC9G6D3MnWWQQtCU9WWtYPk'
    );
  }
  return supabaseClient;
}
