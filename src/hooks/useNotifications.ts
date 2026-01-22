
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSupabaseAuth } from "./useSupabaseAuth";

export interface Notification {
    id: string;
    type: 'like' | 'comment' | 'badge' | 'system';
    message: string;
    is_read: boolean;
    created_at: string;
    actor?: {
        full_name: string;
        avatar_url: string;
    };
}

export function useNotifications() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const { user } = useSupabaseAuth();
    const supabase = createClient();

    useEffect(() => {
        if (!user) return;

        const fetchNotifications = async () => {
            const { data, error } = await supabase
                .from('notifications')
                .select(`
                    *,
                    actor:actor_id (
                        full_name,
                        avatar_url
                    )
                `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false }) // Newest first
                .limit(20);

            if (data) {
                const typedData = data as unknown as Notification[];
                setNotifications(typedData);
                setUnreadCount(typedData.filter(n => !n.is_read).length);
            }
        };

        fetchNotifications();

        // Realtime Subscription
        const channel = supabase
            .channel('notifications_realtime')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`,
                },
                (payload: { new: Notification }) => {
                    // Fetch new notification details (need actor info) or assume simplified
                    fetchNotifications();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, supabase]);

    const markAsRead = async () => {
        if (!user || unreadCount === 0) return;

        // Optimistic
        setUnreadCount(0);
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));

        await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', user.id)
            .eq('is_read', false);
    };

    return { notifications, unreadCount, markAsRead };
}
