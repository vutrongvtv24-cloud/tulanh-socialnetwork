"use client";

import { useState, useEffect } from "react";
import { Card, CardFooter } from "@/components/ui/card";
import { UI_Post } from "@/hooks/usePosts";
import { createClient } from "@/lib/supabase/client";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useLanguage } from "@/context/LanguageContext";
import { toast } from "sonner";
import { useGamification } from "@/context/GamificationContext";
import { isAdminUser } from "@/config/constants";
import { updatePostAction } from "@/app/actions/post";
import { PostHeader } from "./post-card/PostHeader";
import { PostContent } from "./post-card/PostContent";
import { PostActions } from "./post-card/PostActions";
import { PostComments, Comment } from "./post-card/PostComments";
import { PostApprovalStatus } from "./post-card/PostApprovalStatus";

interface PostCardProps {
    post: UI_Post;
    onToggleLike: (postId: string, currentStatus: boolean) => void;
    onDeletePost?: (postId: string) => Promise<void>;
    onBlockUser?: (userId: string) => Promise<void>;
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

    // Edit State
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(post.content);
    const [displayContent, setDisplayContent] = useState(post.content);
    const [isSaving, setIsSaving] = useState(false);

    // Approval System State
    const [approvalVotes, setApprovalVotes] = useState(0);
    const [hasVotedApprove, setHasVotedApprove] = useState(false);
    const [postStatus, setPostStatus] = useState(post.status || 'approved');

    const supabase = createClient();
    const isAdmin = isAdminUser(user?.email);
    const { level } = useGamification();
    const { t } = useLanguage();

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

    const handleUpdatePost = async () => {
        if (!editContent.trim()) return;
        setIsSaving(true);

        try {
            await updatePostAction(post.id, editContent);
            toast.success(t.toast.postCreated);
            setDisplayContent(editContent);
            setIsEditing(false);
        } catch (error) {
            console.error(error);
            toast.error("Lỗi cập nhật bài viết");
        } finally {
            setIsSaving(false);
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
            toast.success(t.admin.voteOk + " success!");
        } else {
            toast.error("Failed to vote");
        }
    };

    // Admin: Delete post
    const handleDeletePost = async () => {
        if (!isAdmin && !isAuthor) {
            toast.error(t.errors.somethingWentWrong);
            return;
        }

        if (onDeletePost) {
            await onDeletePost(post.id);
            setIsDeleted(true);
            return;
        }

        // Fallback: delete directly
        const { error } = await supabase
            .from('posts')
            .delete()
            .eq('id', post.id);

        if (!error) {
            setIsDeleted(true);
            toast.success(t.toast.postDeleted);
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
                async (payload: { new: { id: string; content: string; created_at: string; user_id: string } }) => {
                    // Update counter regardless
                    setLocalCommentsCount(prev => prev + 1);

                    // If comments are open, we need to fetch user details for the new comment
                    if (showComments) {
                        const newComment = payload.new;

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
                <PostApprovalStatus
                    approvalVotes={approvalVotes}
                    isAdmin={isAdmin}
                    hasVotedApprove={hasVotedApprove}
                    onVoteApprove={handleVoteApprove}
                    onAdminApprove={() => handleAdminAction('approve')}
                    onAdminReject={() => handleAdminAction('reject')}
                />
            )}

            <PostHeader
                post={post}
                isAuthor={isAuthor}
                isAdmin={isAdmin}
                onEdit={() => setIsEditing(true)}
                onDelete={handleDeletePost}
                onBlockUser={handleBlockUser}
            />

            <PostContent
                post={post}
                isLocked={isLocked}
                minLevel={minLevel}
                isEditing={isEditing}
                editContent={editContent}
                setEditContent={setEditContent}
                isSaving={isSaving}
                onSave={handleUpdatePost}
                onCancelEdit={() => setIsEditing(false)}
                displayContent={displayContent}
            />

            <CardFooter className="flex-col p-0">
                <PostActions
                    likes={post.likes}
                    commentsCount={localCommentsCount}
                    isLiked={post.liked_by_user}
                    onToggleLike={() => onToggleLike(post.id, post.liked_by_user)}
                    onToggleComments={() => setShowComments(!showComments)}
                    postId={post.id}
                />

                {showComments && (
                    <PostComments
                        comments={comments}
                        isLoading={isLoadingComments}
                        onSubmit={handleCommentSubmit}
                        commentText={commentText}
                        setCommentText={setCommentText}
                        isSubmitting={isSubmitting}
                        userAvatar={user?.user_metadata?.avatar_url}
                    />
                )}
            </CardFooter>
        </Card>
    );
}
