
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageSquare, Share2, MoreHorizontal, Send, Check, X, ThumbsUp, Lock, Trash2, Ban, Flag } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UI_Post } from "@/hooks/usePosts";
import { createClient } from "@/lib/supabase/client";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import Link from "next/link";
import { toast } from "sonner";
import { useGamification } from "@/context/GamificationContext";

interface PostCardProps {
    post: UI_Post;
    onToggleLike: (postId: string, currentStatus: boolean) => void;
    onDeletePost?: (postId: string) => Promise<void>;
    onBlockUser?: (userId: string) => Promise<void>;
}

interface Comment {
    id: string;
    content: string;
    created_at: string;
    user: {
        name: string;
        avatar: string;
    };
}

export function PostCard({ post, onToggleLike, onDeletePost, onBlockUser }: PostCardProps) {
    const { user } = useSupabaseAuth();
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState<Comment[]>([]);
    const [isLoadingComments, setIsLoadingComments] = useState(false);
    const [commentText, setCommentText] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [localCommentsCount, setLocalCommentsCount] = useState(post.comments);
    const [isDeleted, setIsDeleted] = useState(false);

    // Approval System State
    const [approvalVotes, setApprovalVotes] = useState(0);
    const [hasVotedApprove, setHasVotedApprove] = useState(false);
    const [postStatus, setPostStatus] = useState(post.status || 'approved');

    const supabase = createClient();
    const isAdmin = user?.email === 'vutrongvtv24@gmail.com';
    const { level } = useGamification();

    const minLevel = post.min_level_to_view || 0;
    const isAuthor = user?.id === post.user.id;
    // content is locked if minLevel > level AND user is not author AND user is not admin
    const isLocked = minLevel > level && !isAuthor && !isAdmin;

    useEffect(() => {
        // Only fetch approval stats if post is pending
        if (postStatus === 'pending' && user) {
            fetchApprovalStats();
        }
    }, [postStatus, user, post.id]);

    const fetchApprovalStats = async () => {
        // Count votes
        const { count } = await supabase
            .from('post_approvals')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', post.id);

        setApprovalVotes(count || 0);

        // Check if current user voted
        if (user) {
            const { data } = await supabase
                .from('post_approvals')
                .select('id')
                .eq('post_id', post.id)
                .eq('user_id', user.id)
                .single();
            setHasVotedApprove(!!data);
        }
    };

    const handleAdminAction = async (action: 'approve' | 'reject') => {
        if (!isAdmin) return;
        const newStatus = action === 'approve' ? 'approved' : 'rejected';

        const { error } = await supabase
            .from('posts')
            .update({ status: newStatus })
            .eq('id', post.id);

        if (!error) {
            setPostStatus(newStatus);
            toast.success(`Post ${action}d successfully`);
        } else {
            toast.error("Action failed");
        }
    };

    const handleVoteApprove = async () => {
        if (!user || hasVotedApprove) return;

        const { error } = await supabase
            .from('post_approvals')
            .insert({ post_id: post.id, user_id: user.id });

        if (!error) {
            setHasVotedApprove(true);
            setApprovalVotes(prev => prev + 1);
            toast.success("Voted to approve!");
        } else {
            toast.error("Failed to vote");
        }
    };

    // Admin: Delete post
    const handleDeletePost = async () => {
        console.log('[Delete Post] Attempting to delete post:', post.id);
        console.log('[Delete Post] isAdmin:', isAdmin, 'isAuthor:', isAuthor);
        console.log('[Delete Post] user email:', user?.email);

        if (!isAdmin && !isAuthor) {
            toast.error("Bạn không có quyền xóa bài viết này");
            return;
        }

        if (onDeletePost) {
            await onDeletePost(post.id);
            setIsDeleted(true);
            return;
        }

        // Fallback: delete directly
        const { error, status, statusText } = await supabase
            .from('posts')
            .delete()
            .eq('id', post.id);

        console.log('[Delete Post] Response:', { error, status, statusText });

        if (!error) {
            setIsDeleted(true);
            toast.success("Đã xóa bài viết thành công!");
        } else {
            console.error('[Delete Post] Error:', error);
            toast.error(`Lỗi xóa bài: ${error.message || 'Không xác định'}`);
        }
    };

    // Admin: Block user
    const handleBlockUser = async () => {
        if (!isAdmin) return;

        if (onBlockUser) {
            await onBlockUser(post.user.id);
            return;
        }

        // Fallback: Update user profile to blocked status
        const { error } = await supabase
            .from('profiles')
            .update({ status: 'blocked' })
            .eq('id', post.user.id);

        if (!error) {
            toast.success(`User ${post.user.name} has been blocked!`);
        } else {
            toast.error("Failed to block user");
        }
    };

    // Fetch comments when section is opened
    useEffect(() => {
        if (showComments && comments.length === 0) {
            fetchComments();
        }
    }, [showComments]);

    const fetchComments = async () => {
        setIsLoadingComments(true);
        const { data, error } = await supabase
            .from("comments")
            .select(`
                id,
                content,
                created_at,
                profiles (
                    full_name,
                    avatar_url
                )
            `)
            .eq("post_id", post.id)
            .order("created_at", { ascending: true });

        if (error) {
            console.error("Error fetching comments:", error);
        } else {
            setComments((data as unknown as {
                id: string;
                content: string;
                created_at: string;
                profiles: { full_name: string; avatar_url: string } | null;
            }[]).map((c) => ({
                id: c.id,
                content: c.content,
                created_at: c.created_at,
                user: {
                    name: c.profiles?.full_name || "Anonymous",
                    avatar: c.profiles?.avatar_url || "",
                }
            })));
        }
        setIsLoadingComments(false);
    };

    // Realtime Comments Subscription
    useEffect(() => {
        // Only subscribe if comments section is open or we want to update the counter
        const channel = supabase
            .channel(`public:comments:${post.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'comments',
                    filter: `post_id=eq.${post.id}`
                },
                async (payload) => {
                    // Update counter regardless
                    setLocalCommentsCount(prev => prev + 1);

                    // If comments are open, we need to fetch user details for the new comment
                    if (showComments) {
                        const newComment = payload.new as { id: string, content: string, created_at: string, user_id: string };

                        // Fetch profile for the new comment
                        const { data: profile } = await supabase
                            .from('profiles')
                            .select('full_name, avatar_url')
                            .eq('id', newComment.user_id)
                            .single();

                        const commentWithUser: Comment = {
                            id: newComment.id,
                            content: newComment.content,
                            created_at: newComment.created_at,
                            user: {
                                name: profile?.full_name || "Anonymous",
                                avatar: profile?.avatar_url || "",
                            }
                        };

                        setComments(prev => {
                            // Avoid duplicate if it was our own comment (optimistically added)
                            if (prev.some(c => c.id === newComment.id)) return prev;
                            return [...prev, commentWithUser];
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [post.id, showComments, supabase]);

    const handleCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!commentText.trim() || !user) return;

        setIsSubmitting(true);
        try {
            const { error, data } = await supabase
                .from("comments")
                .insert({
                    post_id: post.id,
                    user_id: user.id,
                    content: commentText.trim()
                })
                .select()
                .single();

            if (error) throw error;

            // Optimistic update
            const newComment: Comment = {
                id: data.id,
                content: commentText,
                created_at: new Date().toISOString(),
                user: {
                    name: user.user_metadata.full_name || "Me",
                    avatar: user.user_metadata.avatar_url || "",
                }
            };

            setComments([...comments, newComment]);
            setCommentText("");
            setLocalCommentsCount(prev => prev + 1);
        } catch (error) {
            console.error("Failed to post comment:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // If rejected, hide completely (or show to owner/admin only)
    if (postStatus === 'rejected' && !isAdmin && user?.id !== post.user.id) {
        return null; // Don't render rejected posts for normal users
    }

    // If deleted, hide the post
    if (isDeleted) {
        return null;
    }

    return (
        <Card className="overflow-hidden border-border/60">
            {postStatus === 'pending' && (
                <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-yellow-600 text-xs font-medium flex items-center gap-1">
                            <Lock className="h-3 w-3" /> Pending Approval
                        </span>
                        <span className="text-xs text-muted-foreground">• {approvalVotes} community votes</span>
                    </div>

                    <div className="flex items-center gap-2">
                        {isAdmin ? (
                            <>
                                <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-green-600" onClick={() => handleAdminAction('approve')}>
                                    <Check className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-red-600" onClick={() => handleAdminAction('reject')}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </>
                        ) : (
                            !hasVotedApprove && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-6 text-xs gap-1"
                                    onClick={handleVoteApprove}
                                >
                                    <ThumbsUp className="h-3 w-3" /> Vote OK
                                </Button>
                            )
                        )}
                    </div>
                </div>
            )}

            <CardHeader className="flex flex-row items-start justify-between space-y-0 p-4 pb-2">
                <div className="flex items-center gap-3">
                    <Link href={`/profile/${post.user.id}`} className="cursor-pointer hover:opacity-80 transition-opacity">
                        <Avatar>
                            <AvatarImage src={post.user.avatar} />
                            <AvatarFallback>{post.user.name[0]}</AvatarFallback>
                        </Avatar>
                    </Link>
                    <div>
                        <Link href={`/profile/${post.user.id}`} className="font-semibold text-sm flex items-center gap-2 hover:underline cursor-pointer">
                            {post.user.name}
                            {post.user.title && (
                                <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded text-muted-foreground font-normal no-underline">
                                    {post.user.title}
                                </span>
                            )}
                        </Link>
                        <div className="flex items-center gap-2 flex-wrap">
                            <div className="text-xs text-muted-foreground">{post.time}</div>
                            {post.community && (
                                <Link
                                    href={`/community/${post.community.slug}`}
                                    className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                                >
                                    {post.community.slug === 'youtube' && '📺'}
                                    {post.community.slug === 'tricks-courses' && '🎓'}
                                    {post.community.name}
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="-mr-2 h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        {/* Author or Admin can delete */}
                        {(isAuthor || isAdmin) && (
                            <DropdownMenuItem
                                onSelect={(e) => {
                                    e.preventDefault();
                                    handleDeletePost();
                                }}
                                className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                {isAdmin && !isAuthor ? 'Xóa bài (Admin)' : 'Xóa bài'}
                            </DropdownMenuItem>
                        )}

                        {/* Admin only: Block user */}
                        {isAdmin && !isAuthor && (
                            <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onSelect={(e) => {
                                        e.preventDefault();
                                        handleBlockUser();
                                    }}
                                    className="text-orange-600 focus:text-orange-600 focus:bg-orange-50 cursor-pointer"
                                >
                                    <Ban className="h-4 w-4 mr-2" />
                                    Block người dùng
                                </DropdownMenuItem>
                            </>
                        )}

                        {/* Everyone can report */}
                        {!isAuthor && (
                            <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onSelect={() => toast.info("Đã ghi nhận báo cáo của bạn")}
                                    className="cursor-pointer"
                                >
                                    <Flag className="h-4 w-4 mr-2" />
                                    Báo cáo bài viết
                                </DropdownMenuItem>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardHeader>
            <CardContent className="p-4 pt-2">
                {isLocked ? (
                    <div className="space-y-3">
                        {/* Show title even when locked */}
                        {post.title && (
                            <h3 className="font-bold text-lg leading-tight">{post.title}</h3>
                        )}
                        {/* Locked content notice */}
                        <div className="relative rounded-md border border-dashed border-amber-500/30 bg-amber-500/5 p-4 text-center space-y-2">
                            <div className="flex items-center justify-center gap-2">
                                <Lock className="h-4 w-4 text-amber-600" />
                                <span className="font-medium text-amber-700">Level {minLevel} Required</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Nâng cấp lên Level {minLevel} để xem nội dung này
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                        {post.title && (
                            <h3 className="font-bold text-lg mb-2 leading-tight">{post.title}</h3>
                        )}
                        <p className="whitespace-pre-wrap text-sm leading-relaxed mb-3">
                            {post.content}
                        </p>
                        {post.image_url && (
                            <div className="relative w-full rounded-md overflow-hidden bg-muted/20">
                                <img
                                    src={post.image_url}
                                    alt="Post Image"
                                    loading="lazy"
                                    className="w-full h-auto max-h-[500px] object-cover"
                                />
                            </div>
                        )}
                    </>
                )}
            </CardContent>
            <CardFooter className="flex-col p-0">
                <div className="flex w-full justify-between border-t bg-muted/20 p-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        className={`flex-1 gap-2 hover:text-red-500 hover:bg-red-500/10 transition-colors ${post.liked_by_user ? "text-red-500" : "text-muted-foreground"}`}
                        onClick={() => onToggleLike(post.id, post.liked_by_user)}
                    >
                        <Heart className={`h-4 w-4 ${post.liked_by_user ? "fill-current" : ""}`} />
                        {post.likes}
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 gap-2 text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 transition-colors"
                        onClick={() => setShowComments(!showComments)}
                    >
                        <MessageSquare className="h-4 w-4" />
                        {localCommentsCount}
                    </Button>
                    <Button variant="ghost" size="sm" className="flex-1 gap-2 text-muted-foreground bg-transparent">
                        <Share2 className="h-4 w-4" />
                        Share
                    </Button>
                </div>

                {/* Confirm Logic: If showComments is true, render comments section */}
                {showComments && (
                    <div className="w-full border-t bg-background px-4 py-3 space-y-4">
                        {/* Comment Logic */}
                        <div className="space-y-3 pl-2 border-l-2 border-muted">
                            {isLoadingComments ? (
                                <p className="text-xs text-muted-foreground">Loading comments...</p>
                            ) : comments.length > 0 ? (
                                comments.map(comment => (
                                    <div key={comment.id} className="text-sm">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-xs">{comment.user.name}</span>
                                            <span className="text-[10px] text-muted-foreground">{new Date(comment.created_at).toLocaleTimeString()}</span>
                                        </div>
                                        <p className="text-muted-foreground mt-0.5">{comment.content}</p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-muted-foreground italic">No comments yet. Be the first!</p>
                            )}
                        </div>

                        {/* Input */}
                        {user ? (
                            <form onSubmit={handleCommentSubmit} className="flex gap-2">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={user.user_metadata?.avatar_url} />
                                    <AvatarFallback>Me</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 flex gap-2">
                                    <input
                                        type="text"
                                        value={commentText}
                                        onChange={(e) => setCommentText(e.target.value)}
                                        placeholder="Write a comment..."
                                        className="flex-1 bg-muted/50 rounded-full px-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                    <Button type="submit" size="icon" className="h-8 w-8 rounded-full" disabled={!commentText.trim() || isSubmitting}>
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </div>
                            </form>
                        ) : (
                            <p className="text-xs text-center text-muted-foreground">Sign in to comment</p>
                        )}
                    </div>
                )}
            </CardFooter>
        </Card>
    );
}
