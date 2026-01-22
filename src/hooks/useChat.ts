
import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSupabaseAuth } from "./useSupabaseAuth";

export interface Message {
    id: string;
    conversation_id: string;
    sender_id: string;
    content: string;
    created_at: string;
    is_read: boolean;
}

export interface Conversation {
    id: string;
    updated_at: string;
    other_user: {
        id: string;
        full_name: string;
        avatar_url: string;
    } | null;
    last_message?: string;
}

export function useChat() {
    const { user } = useSupabaseAuth();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    // Fetch Conversations
    useEffect(() => {
        if (!user) return;

        const fetchConversations = async () => {
            // Complex Query: Get Conversations -> Participants -> Profiles
            // Supabase JS doesn't support complex deep joins easily for this structure in one go 
            // without Foreign Keys being strictly set up for every relation direction or using views.
            // We will do a 2-step fetch for simplicity and robustness.

            // 1. Get Conversation IDs user is in
            const { data: myParticipations } = await supabase
                .from('conversation_participants')
                .select('conversation_id')
                .eq('user_id', user.id);

            if (!myParticipations || myParticipations.length === 0) {
                setConversations([]);
                setLoading(false);
                return;
            }

            const convIds = myParticipations.map((p: { conversation_id: string }) => p.conversation_id);

            // 2. Get Details of those conversations
            // And specifically, the OTHER participant info
            const { data: allParticipants } = await supabase
                .from('conversation_participants')
                .select(`
                    conversation_id,
                    user_id,
                    profiles ( full_name, avatar_url )
                `)
                .in('conversation_id', convIds)
                .neq('user_id', user.id); // Get everyone who is NOT me

            // 3. Get Conversations metadata (updated_at)
            const { data: convMeta } = await supabase
                .from('conversations')
                .select('id, updated_at')
                .in('id', convIds)
                .order('updated_at', { ascending: false });

            // 4. Fetch last message for each conversation (optimization: could be a view later)
            const lastMessagesMap: Record<string, string> = {};
            if (convIds.length > 0) {
                const { data: lastMsgs } = await supabase
                    .from('direct_messages')
                    .select('conversation_id, content')
                    .in('conversation_id', convIds)
                    .order('created_at', { ascending: false })
                    // We can't distinct on client easily for batch, so simplified approach:
                    // Just fetch latest ones. For scale, this needs a DB View.
                    // For now, let's just cheat and fetch all recent messages or just leave it empty
                    // Actually, a better way without view:
                    // Just let the UI say "Open to chat" or handle it if we really need it.
                    // But the user wants "Immediate implementation". Let's try to get it right.
                    ;

                // Alternative: map through convs and fetch limit 1 for each (N+1 but acceptable for < 20 convs)
                await Promise.all(convIds.map(async (cid: string) => {
                    const { data } = await supabase
                        .from('direct_messages')
                        .select('content')
                        .eq('conversation_id', cid)
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .single();
                    if (data) lastMessagesMap[cid] = data.content;
                }));
            }

            if (convMeta && allParticipants) {
                const formatted: Conversation[] = convMeta.map((c: { id: string; updated_at: string }) => {
                    const other = allParticipants.find((p: { conversation_id: string }) => p.conversation_id === c.id) as {
                        conversation_id: string;
                        user_id: string;
                        profiles: { full_name: string; avatar_url: string } | { full_name: string; avatar_url: string }[] | null;
                    } | undefined;
                    return {
                        id: c.id,
                        updated_at: c.updated_at,
                        last_message: lastMessagesMap[c.id] || "No messages yet",
                        other_user: other ? {
                            id: other.user_id,
                            full_name: Array.isArray(other.profiles) ? other.profiles[0]?.full_name : other.profiles?.full_name,
                            avatar_url: Array.isArray(other.profiles) ? other.profiles[0]?.avatar_url : other.profiles?.avatar_url
                        } : null
                    };
                });
                setConversations(formatted);
            }
            setLoading(false);
        };

        fetchConversations();
    }, [user, supabase]);

    // Fetch Messages for Active Conversation
    useEffect(() => {
        if (!activeConversationId) return;

        const fetchMessages = async () => {
            const { data } = await supabase
                .from('direct_messages')
                .select('*')
                .eq('conversation_id', activeConversationId)
                .order('created_at', { ascending: true });

            if (data) setMessages(data);
        };

        fetchMessages();

        // Realtime Messages
        const channel = supabase
            .channel(`chat:${activeConversationId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'direct_messages',
                filter: `conversation_id=eq.${activeConversationId}`
            }, (payload: { new: Message }) => {
                setMessages(prev => [...prev, payload.new]);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [activeConversationId, supabase]);

    const sendMessage = async (content: string) => {
        if (!user || !activeConversationId || !content.trim()) return;

        // 1. Optimistic Update (Show message immediately)
        const optimisticMessage: Message = {
            id: `temp-${Date.now()}`, // Temporary ID
            conversation_id: activeConversationId,
            sender_id: user.id,
            content: content,
            created_at: new Date().toISOString(),
            is_read: false
        };

        setMessages(prev => [...prev, optimisticMessage]);

        // 2. Send to Server
        const { data, error } = await supabase.from('direct_messages').insert({
            conversation_id: activeConversationId,
            sender_id: user.id,
            content: content
        }).select().single();

        if (error) {
            console.error("Send message error:", error.message);
            // Revert optimistic update on error
            setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
            alert(`Failed to send: ${error.message}`);
            return;
        }

        // 3. Replace temp message with real one (if realtime doesn't catch it first)
        if (data) {
            setMessages(prev => prev.map(m => m.id === optimisticMessage.id ? (data as Message) : m));
        }

        // Update Conversation timestamp
        await supabase.from('conversations')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', activeConversationId);
    };

    const startConversation = async (otherUserId: string) => {
        if (!user) {
            console.error("User not logged in");
            return null;
        }

        const { data, error } = await supabase.rpc('get_or_create_conversation', {
            other_user_id: otherUserId
        });

        if (error) {
            console.error("Start conversation error:", error.message, error.details, error.hint);
            alert(`Failed to start conversation: ${error.message}. Please make sure the chat SQL schema has been run on Supabase.`);
            return null;
        }

        if (data) {
            setActiveConversationId(data);
            return data;
        }
        return null;
    };

    return {
        conversations,
        messages,
        activeConversationId,
        setActiveConversationId,
        sendMessage,
        startConversation,
        loading
    };
}
