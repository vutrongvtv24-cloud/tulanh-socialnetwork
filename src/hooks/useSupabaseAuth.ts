
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { User, Session, AuthChangeEvent } from "@supabase/supabase-js";

export function useSupabaseAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event: AuthChangeEvent, session: Session | null) => {
                setSession(session);
                setUser(session?.user ?? null);
                setLoading(false);
            }
        );

        // Initial check
        const initSession = async () => {
            const { data } = await supabase.auth.getSession();
            setSession(data.session);
            setUser(data.session?.user ?? null);
            setLoading(false);
        };
        initSession();

        return () => subscription.unsubscribe();
    }, [supabase]);

    const signInWithGoogle = async () => {
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
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
