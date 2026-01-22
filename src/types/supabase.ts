
export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    email: string
                    full_name: string | null
                    avatar_url: string | null
                    bio: string | null
                    level: number
                    xp: number
                    role: string
                    status: string | null
                    name_changed: boolean
                    avatar_changed: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    email: string
                    full_name?: string | null
                    avatar_url?: string | null
                    bio?: string | null
                    level?: number
                    xp?: number
                    role?: string
                    status?: string | null
                    name_changed?: boolean
                    avatar_changed?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    email?: string
                    full_name?: string | null
                    avatar_url?: string | null
                    bio?: string | null
                    level?: number
                    xp?: number
                    role?: string
                    status?: string | null
                    name_changed?: boolean
                    avatar_changed?: boolean
                    created_at?: string
                    updated_at?: string
                }
            }
            posts: {
                Row: {
                    id: string
                    user_id: string
                    content: string
                    title: string | null
                    image_url: string | null
                    likes_count: number
                    comments_count: number
                    community_id: string | null
                    min_level_to_view: number
                    status: 'approved' | 'pending' | 'rejected'
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    content: string
                    title?: string | null
                    image_url?: string | null
                    likes_count?: number
                    comments_count?: number
                    community_id?: string | null
                    min_level_to_view?: number
                    status?: 'approved' | 'pending' | 'rejected'
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    content?: string
                    title?: string | null
                    image_url?: string | null
                    likes_count?: number
                    comments_count?: number
                    community_id?: string | null
                    min_level_to_view?: number
                    status?: 'approved' | 'pending' | 'rejected'
                    created_at?: string
                    updated_at?: string
                }
            }
            communities: {
                Row: {
                    id: string
                    name: string
                    slug: string
                    description: string | null
                    icon: string | null
                    cover_image: string | null
                    min_level_to_post: number
                    min_level_to_view: number
                    require_approval: boolean
                    owner_id: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    slug: string
                    description?: string | null
                    icon?: string | null
                    cover_image?: string | null
                    min_level_to_post?: number
                    min_level_to_view?: number
                    require_approval?: boolean
                    owner_id: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    slug?: string
                    description?: string | null
                    icon?: string | null
                    cover_image?: string | null
                    min_level_to_post?: number
                    min_level_to_view?: number
                    require_approval?: boolean
                    owner_id?: string
                    created_at?: string
                }
            }
            community_members: {
                Row: {
                    id: string
                    community_id: string
                    user_id: string
                    role: 'member' | 'moderator' | 'admin'
                    status: 'pending' | 'approved' | 'rejected'
                    joined_at: string
                }
                Insert: {
                    id?: string
                    community_id: string
                    user_id: string
                    role?: 'member' | 'moderator' | 'admin'
                    status?: 'pending' | 'approved' | 'rejected'
                    joined_at?: string
                }
                Update: {
                    id?: string
                    community_id?: string
                    user_id?: string
                    role?: 'member' | 'moderator' | 'admin'
                    status?: 'pending' | 'approved' | 'rejected'
                    joined_at?: string
                }
            }
            likes: {
                Row: {
                    id: string
                    user_id: string
                    post_id: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    post_id: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    post_id?: string
                    created_at?: string
                }
            }
            comments: {
                Row: {
                    id: string
                    user_id: string
                    post_id: string
                    content: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    post_id: string
                    content: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    post_id?: string
                    content?: string
                    created_at?: string
                }
            }
            conversations: {
                Row: {
                    id: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    created_at?: string
                    updated_at?: string
                }
            }
            conversation_participants: {
                Row: {
                    id: string
                    conversation_id: string
                    user_id: string
                    joined_at: string
                }
                Insert: {
                    id?: string
                    conversation_id: string
                    user_id: string
                    joined_at?: string
                }
                Update: {
                    id?: string
                    conversation_id?: string
                    user_id?: string
                    joined_at?: string
                }
            }
            direct_messages: {
                Row: {
                    id: string
                    conversation_id: string
                    sender_id: string
                    content: string
                    is_read: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    conversation_id: string
                    sender_id: string
                    content: string
                    is_read?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    conversation_id?: string
                    sender_id?: string
                    content?: string
                    is_read?: boolean
                    created_at?: string
                }
            }
            notifications: {
                Row: {
                    id: string
                    user_id: string
                    actor_id: string | null
                    type: string
                    message: string
                    post_id: string | null
                    is_read: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    actor_id?: string | null
                    type: string
                    message: string
                    post_id?: string | null
                    is_read?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    actor_id?: string | null
                    type?: string
                    message?: string
                    post_id?: string | null
                    is_read?: boolean
                    created_at?: string
                }
            }
            follows: {
                Row: {
                    id: string
                    follower_id: string
                    following_id: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    follower_id: string
                    following_id: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    follower_id?: string
                    following_id?: string
                    created_at?: string
                }
            }
            badges: {
                Row: {
                    id: string
                    name: string
                    description: string
                    icon: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    description: string
                    icon: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    description?: string
                    icon?: string
                    created_at?: string
                }
            }
            user_badges: {
                Row: {
                    id: string
                    user_id: string
                    badge_id: string
                    awarded_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    badge_id: string
                    awarded_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    badge_id?: string
                    awarded_at?: string
                }
            }
            post_approvals: {
                Row: {
                    id: string
                    post_id: string
                    user_id: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    post_id: string
                    user_id: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    post_id?: string
                    user_id?: string
                    created_at?: string
                }
            }
            daily_checkins: {
                Row: {
                    id: string
                    user_id: string
                    checkin_date: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    checkin_date: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    checkin_date?: string
                    created_at?: string
                }
            }
        }
        Functions: {
            get_or_create_conversation: {
                Args: { other_user_id: string }
                Returns: string
            }
            perform_daily_checkin: {
                Args: Record<string, never>
                Returns: { success: boolean; message: string }
            }
            has_checked_in_today: {
                Args: Record<string, never>
                Returns: boolean
            }
        }
    }
}
