"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { NotebookPen, Send, Lock, Trash2, MoreHorizontal, Image as ImageIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { toast } from "sonner";
import { useInView } from "react-intersection-observer";
import { useGamification } from "@/context/GamificationContext";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface JournalEntry {
    id: string;
    content: string;
    image_url?: string;
    created_at: string;
}

const PAGE_SIZE = 10;

export function PersonalJournal() {
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasMore, setHasMore] = useState(true);
    const [newEntry, setNewEntry] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [page, setPage] = useState(0);

    const { user } = useSupabaseAuth();
    const { profileName, avatarUrl } = useGamification();
    const supabase = createClient();

    // Infinite scroll ref
    const { ref, inView } = useInView();

    // Fetch journal entries
    const fetchEntries = useCallback(async (pageNum: number, replace = false) => {
        if (!user) return;

        const from = pageNum * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        const { data, error } = await supabase
            .from('journal_entries')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .range(from, to);

        if (!error && data) {
            if (replace) {
                setEntries(data);
            } else {
                setEntries(prev => [...prev, ...data]);
            }
            setHasMore(data.length === PAGE_SIZE);
        }
        setLoading(false);
    }, [user, supabase]);

    // Initial load
    useEffect(() => {
        if (user) {
            fetchEntries(0, true);
        } else {
            setLoading(false);
        }
    }, [user, fetchEntries]);

    // Load more on scroll
    useEffect(() => {
        if (inView && hasMore && !loading) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchEntries(nextPage);
        }
    }, [inView, hasMore, loading, page, fetchEntries]);

    // Realtime subscription
    useEffect(() => {
        if (!user) return;

        const channel = supabase
            .channel('journal-changes')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'journal_entries',
                filter: `user_id=eq.${user.id}`
            }, (payload: { new: JournalEntry }) => {
                setEntries(prev => [payload.new, ...prev]);
            })
            .on('postgres_changes', {
                event: 'DELETE',
                schema: 'public',
                table: 'journal_entries',
                filter: `user_id=eq.${user.id}`
            }, (payload: { old: JournalEntry }) => {
                setEntries(prev => prev.filter(e => e.id !== payload.old.id));
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, supabase]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newEntry.trim() || !user) return;

        setIsSubmitting(true);
        try {
            let imageUrl = null;

            // Upload image if exists
            if (imageFile) {
                const fileExt = imageFile.name.split('.').pop();
                const fileName = `${user.id}/${Date.now()}.${fileExt}`;
                const { data: uploadData, error: uploadError } = await supabase
                    .storage
                    .from('journal-images')
                    .upload(fileName, imageFile);

                if (!uploadError && uploadData) {
                    const { data: urlData } = supabase
                        .storage
                        .from('journal-images')
                        .getPublicUrl(uploadData.path);
                    imageUrl = urlData.publicUrl;
                }
            }

            const { error } = await supabase
                .from('journal_entries')
                .insert({
                    user_id: user.id,
                    content: newEntry.trim(),
                    image_url: imageUrl
                });

            if (!error) {
                setNewEntry("");
                setImageFile(null);
                toast.success("Đã lưu ghi chú! 📝");
            } else {
                toast.error("Lỗi: " + error.message);
            }
        } catch (err) {
            toast.error("Đã xảy ra lỗi");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        const { error } = await supabase
            .from('journal_entries')
            .delete()
            .eq('id', id);

        if (!error) {
            setEntries(prev => prev.filter(e => e.id !== id));
            toast.success("Đã xóa ghi chú!");
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('vi-VN', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (!user) {
        return (
            <div className="max-w-2xl mx-auto">
                <Card className="text-center p-8">
                    <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h2 className="text-xl font-bold mb-2">Đăng nhập để sử dụng Journal</h2>
                    <p className="text-muted-foreground">Đây là nơi lưu trữ các ghi chú cá nhân riêng tư của bạn.</p>
                </Card>
            </div>
        );
    }

    if (loading && entries.length === 0) {
        return (
            <div className="space-y-6 max-w-2xl mx-auto">
                <Card className="p-6">
                    <Skeleton className="h-24 w-full" />
                </Card>
                {[1, 2, 3].map((i) => (
                    <Card key={i} className="p-6">
                        <div className="flex gap-4 mb-4">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="space-y-2 flex-1">
                                <Skeleton className="h-4 w-[200px]" />
                                <Skeleton className="h-16 w-full" />
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-2xl mx-auto pb-10">
            {/* Header */}
            <div className="text-center py-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                    <NotebookPen className="h-6 w-6 text-primary" />
                    <h1 className="text-2xl font-bold">My Journal</h1>
                </div>
                <p className="text-muted-foreground text-sm flex items-center justify-center gap-1">
                    <Lock className="h-3 w-3" />
                    Chỉ bạn mới có thể xem các ghi chú này
                </p>
            </div>

            {/* Create Entry Form */}
            <Card>
                <CardContent className="p-4">
                    <form onSubmit={handleSubmit} className="space-y-3">
                        <div className="flex gap-3">
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={avatarUrl} />
                                <AvatarFallback>{profileName?.[0] || "U"}</AvatarFallback>
                            </Avatar>
                            <Textarea
                                placeholder="Viết ghi chú hôm nay của bạn..."
                                value={newEntry}
                                onChange={(e) => setNewEntry(e.target.value)}
                                className="min-h-[80px] resize-none flex-1"
                            />
                        </div>
                        <div className="flex justify-between items-center">
                            <label className="cursor-pointer">
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                                />
                                <div className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                                    <ImageIcon className="h-4 w-4" />
                                    {imageFile ? imageFile.name : "Thêm ảnh"}
                                </div>
                            </label>
                            <Button type="submit" disabled={!newEntry.trim() || isSubmitting}>
                                <Send className="h-4 w-4 mr-2" />
                                {isSubmitting ? "Đang lưu..." : "Lưu ghi chú"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Entries List */}
            {entries.length === 0 ? (
                <Card className="text-center py-12">
                    <NotebookPen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-30" />
                    <h3 className="text-lg font-medium mb-1">Chưa có ghi chú nào</h3>
                    <p className="text-muted-foreground text-sm">Bắt đầu viết ghi chú đầu tiên của bạn!</p>
                </Card>
            ) : (
                entries.map((entry) => (
                    <Card key={entry.id} className="overflow-hidden">
                        <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={avatarUrl} />
                                        <AvatarFallback>{profileName?.[0] || "U"}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="font-medium text-sm">{profileName}</div>
                                        <div className="text-xs text-muted-foreground">{formatDate(entry.created_at)}</div>
                                    </div>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem
                                            onSelect={() => handleDelete(entry.id)}
                                            className="text-red-600 cursor-pointer"
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Xóa ghi chú
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            <p className="whitespace-pre-wrap text-sm leading-relaxed">{entry.content}</p>
                            {entry.image_url && (
                                <div className="mt-3 rounded-lg overflow-hidden">
                                    <img
                                        src={entry.image_url}
                                        alt="Journal image"
                                        className="w-full h-auto max-h-[400px] object-cover"
                                    />
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))
            )}

            {/* Load More */}
            {hasMore && (
                <div ref={ref} className="flex justify-center p-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            )}

            {!hasMore && entries.length > 0 && (
                <p className="text-center text-muted-foreground text-sm py-4">
                    Đã hiển thị tất cả ghi chú 📚
                </p>
            )}
        </div>
    );
}
