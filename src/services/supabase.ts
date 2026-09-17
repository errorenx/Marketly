import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { User } from '../types';

let supabaseInstance: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient | null => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return null;
  }

  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(url, key);
    } catch (err) {
      console.warn('Failed to initialize Supabase client:', err);
      return null;
    }
  }

  return supabaseInstance;
};

/**
 * Persists user details directly to Supabase table 'profiles' or 'users'
 */
export async function saveUserToSupabase(user: User, passwordHash?: string): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    // If Supabase credentials are not configured in environment, local backend & local storage handles persistence
    return { success: true };
  }

  try {
    const payload = {
      id: user.id,
      first_name: user.firstName,
      last_name: user.lastName,
      username: user.username,
      email: user.email,
      role: user.role,
      phone: (user as any).phone || '',
      avatar: user.avatar,
      bio: user.bio,
      description: user.description,
      country: user.country || 'Pakistan',
      city: user.city,
      followers_count: user.followersCount || 0,
      following_count: user.followingCount || 0,
      likes_count: user.likesCount || 0,
      created_at: user.createdAt || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Attempt upsert to 'profiles' or 'users'
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(payload, { onConflict: 'id' });

    if (profileError) {
      // If table is named 'users', try that as fallback
      const { error: usersError } = await supabase
        .from('users')
        .upsert(payload, { onConflict: 'id' });

      if (usersError) {
        console.warn('Supabase profile upsert error:', profileError.message || usersError.message);
        return { success: false, error: profileError.message };
      }
    }

    return { success: true };
  } catch (err: any) {
    console.warn('Supabase exception:', err);
    return { success: false, error: err.message };
  }
}
