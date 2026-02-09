"use client";

import { useState } from "react";
import { PostCard } from "@/components/feed/PostCard";
import { UI_Post } from "@/hooks/usePosts";
import { createClient } from "@/lib/supabase/client";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface SinglePostViewProps {
    initialPost: UI_Post;
}

export function SinglePostView({ initialPost }: SinglePostViewProps) {
    const [post, setPost] = useState<UI_Post>(initialPost);
    const { user } = useSupabaseAuth();
    const supabase = createClient();
    const router = useRouter();

    const toggleLike = async (postId: string, currentLikeStatus: boolean) => {
        if (!user) {
            toast.error("Please login to like posts");
            return;
        }

        // Optimistic Update
        setPost(prev => ({
            ...prev,
            liked_by_user: !currentLikeStatus,
            likes: currentLikeStatus ? prev.likes - 1 : prev.likes + 1
        }));

        try {
            if (currentLikeStatus) {
                const { error } = await supabase.from("likes").delete().match({ user_id: user.id, post_id: postId });
                if (error) throw error;
            } else {
                const { error } = await supabase.from("likes").insert({ user_id: user.id, post_id: postId });
                if (error) throw error;
            }
        } catch (error) {
            console.error("Error toggling like:", error);
            // Revert on error
            setPost(prev => ({
                ...prev,
                liked_by_user: currentLikeStatus,
                likes: currentLikeStatus ? prev.likes + 1 : prev.likes - 1
            }));
            toast.error("Failed to update like");
        }
    };

    const handleDeletePost = async (postId: string) => {
        const { error } = await supabase.from('posts').delete().eq('id', postId);
        if (error) {
            toast.error("Failed to delete post");
            return;
        }
        toast.success("Post deleted");
        router.push('/'); // Redirect to home/feed
    };

    return (
        <div className="max-w-2xl mx-auto py-8">
            <PostCard
                post={post}
                onToggleLike={toggleLike}
                onDeletePost={handleDeletePost}
            />
        </div>
    );
}
