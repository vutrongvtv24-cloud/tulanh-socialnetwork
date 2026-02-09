
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { SinglePostView } from "@/components/feed/SinglePostView";
import { Metadata } from "next";
import { getRankByLevel } from "@/config/ranks";

interface PageProps {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { id } = await params;
    const supabase = await createClient(); // Await createClient() here 

    const { data: post } = await supabase
        .from("posts")
        .select(`
            content,
            image_url,
            title,
            profiles (full_name)
        `)
        .eq("id", id)
        .single();

    if (!post) {
        return {
            title: "Post not found",
        };
    }

    const title = post.title || `${post.profiles?.full_name || "User"}'s Post`;
    const description = post.content.slice(0, 160);
    const images = post.image_url ? [post.image_url] : [];

    return {
        title: title,
        description: description,
        openGraph: {
            title: title,
            description: description,
            images: images,
            type: "article",
        },
        twitter: {
            card: "summary_large_image",
            title: title,
            description: description,
            images: images,
        },
    };
}

export default async function PostPage({ params }: PageProps) {
    const { id } = await params;
    const supabase = await createClient();

    // 1. Fetch Post Data
    const { data: post, error } = await supabase
        .from("posts")
        .select(`
            *,
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
        .eq("id", id)
        .single();

    if (error || !post) {
        console.error("Error fetching post:", error);
        notFound();
    }

    // 2. Type casting for post data
    const postData = post as any;

    // 3. Get current user and like status
    const { data: { user } } = await supabase.auth.getUser();

    let likedByUser = false;
    if (user) {
        const { data: likeData } = await supabase
            .from("likes")
            .select("id")
            .eq("post_id", id)
            .eq("user_id", user.id)
            .single();
        likedByUser = !!likeData;
    }

    // 4. Format for UI
    // Ensure types match UI_Post
    const formattedPost = {
        id: postData.id,
        user: {
            id: postData.user_id,
            name: postData.profiles?.full_name || "Anonymous",
            handle: "@user",
            avatar: postData.profiles?.avatar_url || "",
            title: getRankByLevel(postData.profiles?.level || 1).nameVi,
        },
        content: postData.content,
        likes: postData.likes_count || 0,
        comments: postData.comments_count || 0,
        time: new Date(postData.created_at).toLocaleDateString(),
        liked_by_user: likedByUser,
        image_url: postData.image_url || undefined,
        status: postData.status as 'approved' | 'pending' | 'rejected' | undefined,
        title: postData.title || undefined,
        min_level_to_view: postData.min_level_to_view || 0,
        community: postData.communities ? {
            id: postData.communities.id,
            name: postData.communities.name,
            slug: postData.communities.slug, // Use slug for community link
            icon: postData.communities.icon || undefined
        } : undefined
    };

    return <SinglePostView initialPost={formattedPost} />;
}
