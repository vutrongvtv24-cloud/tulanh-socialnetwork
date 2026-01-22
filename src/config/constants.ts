/**
 * Application Constants
 * Tập trung quản lý các giá trị cố định trong ứng dụng
 */

// Admin Emails - có thể dễ dàng thêm/bớt admin
export const ADMIN_EMAILS = [
    'vutrongvtv24@gmail.com',
] as const;

// Content Limits
export const CONTENT_LIMITS = {
    POST_MAX_LENGTH: 10000,
    COMMENT_MAX_LENGTH: 2000,
    TITLE_MAX_LENGTH: 200,
    BIO_MAX_LENGTH: 500,
} as const;

// Pagination
export const PAGINATION = {
    PAGE_SIZE: 5,
    LEADERBOARD_LIMIT: 10,
    NOTIFICATIONS_LIMIT: 20,
} as const;

// Storage Buckets
export const STORAGE_BUCKETS = {
    POST_IMAGES: 'post_images',
    AVATARS: 'avatars',
} as const;

// Helper function to check if user is admin
export function isAdminUser(email: string | null | undefined): boolean {
    if (!email) return false;
    return ADMIN_EMAILS.includes(email as typeof ADMIN_EMAILS[number]);
}
