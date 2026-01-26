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
            console.warn("Missing provider_token. Session:", session);
            toast.error('Không tìm thấy quyền truy cập Google Calendar. Vui lòng đăng xuất và đăng nhập lại.');
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
                const errorData = await response.json();
                console.error("Google API Error:", errorData);
                throw new Error(errorData.error?.message || 'Failed to sync to Google Calendar');
            }

            const data = await response.json();
            toast.success('Đã đồng bộ công việc lên Google Calendar!');
            setSyncedEvents(prev => [...prev, data]);
            return data;
        } catch (error: any) {
            console.error('Calendar sync error:', error);
            toast.error(`Lỗi đồng bộ: ${error.message}`);
        } finally {
            setIsSyncing(false);
        }
    };

    return { syncToCalendar, isSyncing };
};
