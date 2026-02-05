
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { User, Session, AuthChangeEvent } from "@supabase/supabase-js";

export function useSupabaseAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        // Timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
            setLoading(false);
            console.warn('Auth session check timeout after 10s');
        }, 10000);

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event: AuthChangeEvent, session: Session | null) => {
                setSession(session);
                setUser(session?.user ?? null);
                setLoading(false);
                clearTimeout(timeoutId);
            }
        );

        // Initial check with error handling
        const initSession = async () => {
            try {
                const { data, error } = await supabase.auth.getSession();
                if (error) {
                    console.error('Auth session error:', error);
                }
                setSession(data.session);
                setUser(data.session?.user ?? null);
            } catch (error) {
                console.error('Failed to get session:', error);
            } finally {
                clearTimeout(timeoutId);
                setLoading(false);
            }
        };
        initSession();

        return () => {
            subscription.unsubscribe();
            clearTimeout(timeoutId);
        };
    }, [supabase]);

    const signInWithGoogle = async () => {
        const baseUrl = 'https://tulanh.online';
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${baseUrl}/auth/callback`,
                scopes: 'email profile openid',
            },
        });
    };

    const signInWithEmail = async (email: string) => {
        // For simplicity, using Magic Link. Can be changed to Password if needed.
        // Let's use OTP/MagicLink consistent with modern apps, or standard password.
        // Given the error context, let's use Password for immediate testing if they set it up.
        // Actually, Supabase default is Magic Link (OTP) enabled.
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`,
            }
        });
        if (error) throw error;
        return { success: true };
    };

    // Fallback to simple password login if they want
    const signInWithPassword = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        if (error) throw error;
    }

    const signUpWithPassword = async (email: string, password: string) => {
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                // Auto-confirm if enabled in Supabase or require email verification
                emailRedirectTo: `${window.location.origin}/auth/callback`,
            }
        });
        if (error) throw error;
    }

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    return {
        user,
        session,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signInWithPassword,
        signUpWithPassword,
        signOut,
    };
}
