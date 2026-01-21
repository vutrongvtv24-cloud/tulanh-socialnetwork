"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { MOCK_USER } from "@/data/mock";
import { createClient } from "@/lib/supabase/client";
import { XpToast, useXpToast } from "@/components/gamification/XpToast";
import { getRankByXp, getXpToNextRank, XP_ACTIONS, getImageLimit } from "@/config/ranks";

type GamificationContextType = {
    level: number;
    xp: number;
    xpToNextLevel: number;
    xpProgress: number; // percentage 0-100
    badges: typeof MOCK_USER.badges;
    showXpGain: (amount: number, reason: string) => void;
    profileName: string;
    avatarUrl: string;
    performDailyCheckin: () => Promise<{ success: boolean; message: string }>;
    hasCheckedInToday: boolean;
    imagePostLimit: { count: number; description: string };
};

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

export function GamificationProvider({ children }: { children: React.ReactNode }) {
    const [level, setLevel] = useState(1);
    const [xp, setXp] = useState(0);
    const [badges, setBadges] = useState(MOCK_USER.badges);
    const [userId, setUserId] = useState<string | null>(null);
    const [profileName, setProfileName] = useState("Builder User");
    const [avatarUrl, setAvatarUrl] = useState("");
    const previousXp = useRef<number>(0);
    const previousLevel = useRef<number>(1);
    const [hasCheckedInToday, setHasCheckedInToday] = useState(false);

    const { current: xpToastCurrent, showXpGain, handleComplete } = useXpToast();

    const supabase = createClient();

    // Calculate XP progress using new rank system
    const currentRank = getRankByXp(xp);
    const xpToNextLevel = getXpToNextRank(xp);
    const xpInCurrentRank = xp - currentRank.minXp;
    const xpNeededForRank = (currentRank.maxXp === Infinity) ? 1000 : (currentRank.maxXp - currentRank.minXp + 1);
    const xpProgress = level === 5 ? 100 : Math.min((xpInCurrentRank / xpNeededForRank) * 100, 100);
    const imagePostLimit = getImageLimit(level);

    // Initial Load
    useEffect(() => {
        const init = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                setUserId(session.user.id);

                const { data: profile } = await supabase
                    .from('profiles')
                    .select('level, xp, full_name, avatar_url')
                    .eq('id', session.user.id)
                    .single();

                if (profile) {
                    setLevel(profile.level || 1);
                    setXp(profile.xp || 0);
                    setProfileName(profile.full_name || session.user.user_metadata?.full_name || "Builder User");
                    setAvatarUrl(profile.avatar_url || session.user.user_metadata?.avatar_url || "");
                    previousXp.current = profile.xp || 0;
                    previousLevel.current = profile.level || 1;
                }
            }
        };
        init();
    }, []);

    // Realtime subscription to profile changes (for XP updates from triggers)
    useEffect(() => {
        if (!userId) return;

        const channel = supabase
            .channel(`profile-xp:${userId}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'profiles',
                filter: `id=eq.${userId}`
            }, (payload) => {
                const newProfile = payload.new as { xp: number; level: number; full_name?: string; avatar_url?: string };

                // Calculate XP gained
                const xpGained = newProfile.xp - previousXp.current;
                const levelGained = newProfile.level - previousLevel.current;

                // Update state
                setXp(newProfile.xp);
                setLevel(newProfile.level);
                if (newProfile.full_name) setProfileName(newProfile.full_name);
                if (newProfile.avatar_url) setAvatarUrl(newProfile.avatar_url);

                // Show XP toast if XP increased
                if (xpGained > 0) {
                    showXpGain(xpGained, getXpReason(xpGained));
                }

                // Show level up celebration
                if (levelGained > 0) {
                    setTimeout(() => {
                        showXpGain(0, `🎉 Level Up! You're now Level ${newProfile.level}!`);
                    }, 2500);
                }

                // Update refs
                previousXp.current = newProfile.xp;
                previousLevel.current = newProfile.level;
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId, supabase, showXpGain]);

    // Helper to determine reason based on XP amount (updated for V2)
    const getXpReason = (amount: number): string => {
        switch (amount) {
            case XP_ACTIONS.CREATE_POST: return "Đăng bài! 📝";
            case XP_ACTIONS.DAILY_CHECKIN: return "Điểm danh! 📅";
            case XP_ACTIONS.RECEIVE_COMMENT: return "Nhận Comment! 💬";
            case XP_ACTIONS.RECEIVE_SHARE: return "Nhận Share! 🔁";
            case XP_ACTIONS.RECEIVE_LIKE:
            case XP_ACTIONS.GIVE_COMMENT: return "Tương tác! ⚡";
            default:
                if (amount >= 50) return "Bonus Level Up! 🎁";
                return "Hoạt động! ✨";
        }
    };

    // Daily Check-in Function
    const performDailyCheckin = useCallback(async () => {
        const { data, error } = await supabase.rpc('perform_daily_checkin');

        if (error) {
            return { success: false, message: error.message };
        }

        if (data?.success) {
            setHasCheckedInToday(true);
            showXpGain(XP_ACTIONS.DAILY_CHECKIN, 'Điểm danh! 📅');
        }

        return { success: data?.success || false, message: data?.message || 'Lỗi không xác định' };
    }, [supabase, showXpGain]);

    // Check if already checked in today
    useEffect(() => {
        if (!userId) return;

        const checkTodayStatus = async () => {
            const { data } = await supabase.rpc('has_checked_in_today');
            setHasCheckedInToday(data === true);
        };

        checkTodayStatus();
    }, [userId, supabase]);

    // Fetch badges
    useEffect(() => {
        if (!userId) return;

        const fetchBadges = async () => {
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

            if (userBadges) {
                const formattedBadges = (userBadges as unknown as { awarded_at: string, badges: { id: string, name: string, icon: string, description: string } }[]).map((ub) => ({
                    ...ub.badges,
                    unlocked: true,
                    awarded_at: ub.awarded_at
                }));
                setBadges(formattedBadges);
            }
        };

        fetchBadges();
    }, [userId]);

    return (
        <GamificationContext.Provider value={{
            level,
            xp,
            xpToNextLevel,
            xpProgress,
            badges,
            showXpGain,
            profileName,
            avatarUrl,
            performDailyCheckin,
            hasCheckedInToday,
            imagePostLimit
        }}>
            {children}
            {/* XP Toast overlay */}
            <XpToast xpGain={xpToastCurrent} onComplete={handleComplete} />
        </GamificationContext.Provider>
    );
}

export function useGamification() {
    const context = useContext(GamificationContext);
    if (context === undefined) {
        throw new Error("useGamification must be used within a GamificationProvider");
    }
    return context;
}
