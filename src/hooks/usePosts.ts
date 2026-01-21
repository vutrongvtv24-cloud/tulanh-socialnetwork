
import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSupabaseAuth } from "./useSupabaseAuth";
import { Database } from "@/types/supabase";

type Post = Database["public"]["Tables"]["posts"]["Row"] & {
    profiles: Database["public"]["Tables"]["profiles"]["Row"] | null;
};

export type UI_Post = {
    id: string;
    user: {
        id: string;
        name: string;
        handle: string;
        avatar: string;
        title: string;
    };
    content: string;
    likes: number;
    comments: number;
    time: string;
    liked_by_user: boolean;
    image_url?: string;
    status?: 'approved' | 'pending' | 'rejected';
    title?: string;
    min_level_to_view?: number;
    community?: {
        id: string;
        name: string;
        slug: string;
        icon?: string;
    };
};

const PAGE_SIZE = 5; // Load 5 posts at a time

export function usePosts(communitySlug?: string) {
    const [posts, setPosts] = useState<UI_Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasMore, setHasMore] = useState(true);
    const { user } = useSupabaseAuth();
    const supabase = createClient();
    const pageRef = useRef(0);

    // Store resolved UUID
    const [communityId, setCommunityId] = useState<string | null>(null);

    // Resolve Slug to ID
    useEffect(() => {
        const resolveCommunityId = async () => {
            if (!communitySlug) {
                setCommunityId(null);
                return;
            }

            // Check if it's already a UUID (simple check length > 20)
            if (communitySlug.length > 20 && communitySlug.includes('-')) {
                setCommunityId(communitySlug);
                return;
            }

            // Fetch ID from slug
            const { data, error } = await supabase
                .from('communities')
                .select('id')
                .eq('slug', communitySlug)
                .single();

            if (data) {
                setCommunityId(data.id);
            } else {
                console.warn("Community not found for slug:", communitySlug);
                setCommunityId(null); // Fallback to global or empty?
            }
        };

        resolveCommunityId();
    }, [communitySlug, supabase]);

    const fetchPosts = useCallback(async (isLoadMore = false) => {
        // If communitySlug is provided but not yet resolved to ID, wait.
        if (communitySlug && !communityId) {
            // Exception: if slug failed to resolve (invalid slug), we might stop here to show empty.
            // But for now, let's just return if we are still "loading" the ID.
            return;
        }

        if (!isLoadMore) {
            setLoading(true);
            pageRef.current = 0; // Reset page
        }

        try {
            const start = pageRef.current * PAGE_SIZE;
            const end = start + PAGE_SIZE - 1;

            // 1. Build Query
            let query = supabase
                .from("posts")
                .select(`
                    *,
                    *,
                    image_url,
                    title,
                    min_level_to_view,
                    profiles (
                        full_name,
                        avatar_url,
                        role,
                        level
                    ),
                    communities (
                        id,
                        name,
                        slug,
                        icon
                    )
                `)
                .order("created_at", { ascending: false })
                .range(start, end);

            if (communityId) {
                query = query.eq('community_id', communityId);
            } else if (communitySlug) {
                // Slug provided but ID not solved (should cause empty return or loading)
                // Actually handled by early return above.
            }
            // If no community specified, get ALL posts (both global and community posts)

            const { data: postsData, error: postsError } = await query;

            if (postsError) throw postsError;

            if (!postsData || postsData.length === 0) {
                if (isLoadMore) {
                    setHasMore(false);
                } else {
                    setPosts([]);
                }
                return;
            }

            if (postsData.length < PAGE_SIZE) {
                setHasMore(false);
            }

            // 2. Check which posts user has liked (if logged in)
            let likedPostIds = new Set<string>();
            if (user) {
                const postIds = postsData.map(p => p.id);
                if (postIds.length > 0) {
                    const { data: likesData } = await supabase
                        .from("likes")
                        .select("post_id")
                        .in("post_id", postIds)
                        .eq("user_id", user.id);

                    if (likesData) {
                        likesData.forEach(l => likedPostIds.add(l.post_id));
                    }
                }
            }

            // 3. Transform Data
            type PostWithProfile = {
                id: string;
                user_id: string;
                content: string;
                likes_count: number;
                comments_count: number;
                created_at: string;
                image_url?: string;
                status?: 'approved' | 'pending' | 'rejected';
                title?: string | null;
                min_level_to_view?: number;
                profiles: {
                    full_name: string;
                    avatar_url: string;
                    role: string;
                    level: number;
                } | null;
                communities: {
                    id: string;
                    name: string;
                    slug: string;
                    icon?: string;
                } | null;
            };

            const formattedPosts: UI_Post[] = (postsData as unknown as PostWithProfile[]).map((post) => ({
                id: post.id,
                user: {
                    id: post.user_id,
                    name: post.profiles?.full_name || "Anonymous",
                    handle: "@user",
                    avatar: post.profiles?.avatar_url || "",
                    title: `Level ${post.profiles?.level || 1} Builder`,
                },
                content: post.content,
                likes: post.likes_count || 0,
                comments: post.comments_count || 0,
                time: new Date(post.created_at).toLocaleDateString(),
                liked_by_user: likedPostIds.has(post.id),
                image_url: post.image_url,
                status: post.status,
                title: post.title || undefined,
                min_level_to_view: post.min_level_to_view || 0,
                community: post.communities ? {
                    id: post.communities.id,
                    name: post.communities.name,
                    slug: post.communities.slug,
                    icon: post.communities.icon || undefined
                } : undefined
            }));

            if (isLoadMore) {
                setPosts(prev => [...prev, ...formattedPosts]);
            } else {
                setPosts(formattedPosts);
            }

        } catch (err) {
            console.error("Error fetching posts:", err);
        } finally {
            setLoading(false);
        }
    }, [supabase, user, communityId]);

    const loadMore = useCallback(() => {
        if (!hasMore || loading) return;
        pageRef.current += 1;
        fetchPosts(true);
    }, [hasMore, loading, fetchPosts]);

    // Initial Fetch
    useEffect(() => {
        fetchPosts(false);
    }, [fetchPosts]);

    // Realtime for NEW posts only (insert at top) and updates
    // Note: This logic is tricky with infinite scroll. 
    // Simplified strategy: Listen for updates to update like/comment counts of visible posts.
    // For new posts, optionally show a "New posts available" button or insert if on page 0.
    useEffect(() => {
        // Build realtime config - only filter if specific community, else listen to all
        const channelConfig = communityId
            ? { event: 'UPDATE' as const, schema: 'public', table: 'posts', filter: `community_id=eq.${communityId}` }
            : { event: 'UPDATE' as const, schema: 'public', table: 'posts' }; // No filter = all posts

        const channel = supabase
            .channel(`public:posts_realtime:${communityId || 'all'}`)
            .on('postgres_changes', channelConfig, (payload) => {
                // Update local state if the post exists in our list
                setPosts(prev => prev.map(p => {
                    if (p.id === payload.new.id) {
                        const newPost = payload.new as any;
                        return {
                            ...p,
                            likes: newPost.likes_count,
                            comments: newPost.comments_count
                        };
                    }
                    return p;
                }));
            })
            // .on('postgres_changes', { event: 'INSERT', ... }) -> Handled by manual refresh or separate logic to avoid messing up scroll
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase, communityId]);


    const createPost = async (content: string, imageFile?: File, title?: string, minLevel?: number) => {
        if (!user) return;

        let imageUrl: string | undefined;
        if (imageFile) {
            const fileExtension = imageFile.name.split('.').pop();
            const filePath = `${user.id}/${Date.now()}.${fileExtension}`;
            const { data, error: uploadError } = await supabase.storage
                .from('post_images')
                .upload(filePath, imageFile);

            if (uploadError) throw uploadError;

            imageUrl = supabase.storage.from('post_images').getPublicUrl(filePath).data.publicUrl;
        }

        const { error, data } = await supabase.from("posts").insert({
            user_id: user.id,
            content: content,
            image_url: imageUrl,
            community_id: communityId || null,
            title: title || null,
            min_level_to_view: minLevel || 0,
        }).select().single();

        if (error) throw error;

        // Optimistically add to top and reset page
        // Actually, easiest is just to refetch page 0
        fetchPosts(false);
    };

    const toggleLike = async (postId: string, currentLikeStatus: boolean) => {
        if (!user) return;

        // Optimistic UI Update
        setPosts(prev => prev.map(p => {
            if (p.id === postId) {
                return {
                    ...p,
                    liked_by_user: !currentLikeStatus,
                    likes: currentLikeStatus ? p.likes - 1 : p.likes + 1
                };
            }
            return p;
        }));

        try {
            if (currentLikeStatus) {
                // Unlike
                const { error } = await supabase.from("likes").delete().match({ user_id: user.id, post_id: postId });
                if (error) throw error;
            } else {
                // Like
                const { error } = await supabase.from("likes").insert({ user_id: user.id, post_id: postId });
                if (error) throw error;
            }
        } catch (error) {
            console.error("Error toggling like:", error);
            // Revert handled by realtime or next fetch
        }
    };

    return { posts, loading, hasMore, loadMore, createPost, toggleLike, fetchPosts };
}
