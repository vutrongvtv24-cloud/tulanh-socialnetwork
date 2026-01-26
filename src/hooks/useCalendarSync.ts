"use client";

import { useState, useEffect } from 'react';
import { useSupabaseAuth } from './useSupabaseAuth';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export const useCalendarSync = () => {
    const { session } = useSupabaseAuth();
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncedEvents, setSyncedEvents] = useState<any[]>([]);

    const syncToCalendar = async (todo: { content: string, date?: Date }) => {
        if (!session?.provider_token) {
            // If we don't have a provider token (because we didn't ask for scopes or login type is different),
            // we might not actully be able to client-side sync easily without a backend proxy or proper scope handling.
            // However, Supabase stores generation tokens.
            // Let's assume for this MVP we just start the flow.

            // Actually, Supabase exposes `provider_token` in the session ONLY if it was just created or refreshed correctly.
            // Checking session...
            console.log("Session for Calendar:", session);
        }

        if (!session || session.user.app_metadata.provider !== 'google') {
            toast.error('Vui lòng đăng nhập bằng Google để sử dụng tính năng này');
            return;
        }

        setIsSyncing(true);
        try {
            const event = {
                'summary': todo.content,
                'start': {
                    'dateTime': (todo.date || new Date()).toISOString(),
                    'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone
                },
                'end': {
                    'dateTime': new Date((todo.date || new Date()).getTime() + 60 * 60 * 1000).toISOString(), // 1 hour later
                    'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone
                }
            };

            const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + session.provider_token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(event)
            });

            if (!response.ok) {
                throw new Error('Failed to sync to Google Calendar');
            }

            const data = await response.json();
            toast.success('Đã đồng bộ công việc lên Google Calendar!');
            setSyncedEvents(prev => [...prev, data]);
            return data;
        } catch (error) {
            console.error('Calendar sync error:', error);
            toast.error('Lỗi đồng bộ lịch. Vui lòng thử lại sau.');
        } finally {
            setIsSyncing(false);
        }
    };

    return { syncToCalendar, isSyncing };
};
