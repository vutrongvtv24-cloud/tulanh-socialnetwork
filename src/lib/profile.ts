import { createClient } from "@/lib/supabase/client";

export async function fetchProfile(userId: string) {
    const supabase = createClient();

    // Fetch Profile
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (profileError) return null;

    // Fetch Badges
    const { data: userBadges } = await supabase
        .from('user_badges')
        .select(`
            awarded_at,
            badges (
                id,
                name,
                icon,
                description
            )
        `)
        .eq('user_id', userId);

    const badges = userBadges?.map((ub: Record<string, unknown>) => ({
        ...(ub.badges as Record<string, unknown>),
        unlocked: true,
        awarded_at: ub.awarded_at
    })) || [];

    // Fetch Recent Posts
    const { data: posts } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    return {
        ...profile,
        badges,
        posts: posts || []
    };
}


/**
 * Update profile name - only allowed once after registration
 * Admin can change infinitely
 * @returns { success: boolean, error?: string }
 */
export async function updateProfileName(userId: string, newName: string): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();

    // Validate name
    if (!newName || newName.trim().length < 2) {
        return { success: false, error: "Name must be at least 2 characters" };
    }

    if (newName.trim().length > 50) {
        return { success: false, error: "Name must be less than 50 characters" };
    }

    // Check if user has already changed their name
    const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('name_changed, email')
        .eq('id', userId)
        .single();

    if (fetchError) {
        return { success: false, error: "Failed to fetch profile" };
    }

    const isAdmin = profile?.email === 'vutrongvtv24@gmail.com';

    // If not admin and already changed, block
    if (!isAdmin && profile?.name_changed) {
        return { success: false, error: "You have already used your one-time name change" };
    }

    // Update name and mark as changed (only if not admin)
    const { error: updateError } = await supabase
        .from('profiles')
        .update({
            full_name: newName.trim(),
            // If admin, keep name_changed as is (or false). If user, set true.
            // Actually, for simplicity, we can just set true. Admin bypasses the check anyway.
            name_changed: isAdmin ? profile.name_changed : true
        })
        .eq('id', userId);

    if (updateError) {
        return { success: false, error: "Failed to update name" };
    }

    return { success: true };
}

/**
 * Check if user can still change their name
 */
export async function canChangeName(userId: string): Promise<boolean> {
    const supabase = createClient();

    const { data: profile, error } = await supabase
        .from('profiles')
        .select('name_changed, email')
        .eq('id', userId)
        .single();

    // If there's an error (e.g., column doesn't exist) or profile is null, allow change
    if (error || !profile) {
        return true;
    }

    const isAdmin = profile?.email === 'vutrongvtv24@gmail.com';
    if (isAdmin) return true;

    // If name_changed is null/undefined/false, allow change
    return profile.name_changed !== true;
}

/**
 * Check if user can still change their avatar
 */
export async function canChangeAvatar(userId: string): Promise<boolean> {
    const supabase = createClient();

    const { data: profile, error } = await supabase
        .from('profiles')
        .select('avatar_changed, email')
        .eq('id', userId)
        .single();

    // If there's an error (e.g., column doesn't exist) or profile is null, allow change
    if (error || !profile) {
        return true;
    }

    const isAdmin = profile?.email === 'vutrongvtv24@gmail.com';
    if (isAdmin) return true;

    // If avatar_changed is null/undefined/false, allow change
    return profile.avatar_changed !== true;
}
