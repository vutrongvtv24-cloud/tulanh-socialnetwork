/**
 * Rank Configuration
 * 5 Level Ranking System with Dragon/Koi Theme
 */

export interface RankConfig {
    level: number;
    name: string;
    nameVi: string;
    description: string;
    image: string;
    minXp: number;
    maxXp: number;
    color: string;
    glowColor: string;
}

export const RANKS: RankConfig[] = [
    {
        level: 1,
        name: "Silver Koi",
        nameVi: "Cá Koi Bạc",
        description: "Beginner - Just starting the journey",
        image: "/ranks/rank-1.png",
        minXp: 0,
        maxXp: 499,
        color: "text-gray-400",
        glowColor: "shadow-gray-400/50",
    },
    {
        level: 2,
        name: "Golden Koi",
        nameVi: "Cá Koi Vàng",
        description: "Apprentice - Learning the ropes",
        image: "/ranks/rank-2.png",
        minXp: 500,
        maxXp: 999,
        color: "text-yellow-500",
        glowColor: "shadow-yellow-500/50",
    },
    {
        level: 3,
        name: "Jade Dragon",
        nameVi: "Rồng Xanh Ngọc",
        description: "Skilled - Mastering the craft",
        image: "/ranks/rank-3.png",
        minXp: 1000,
        maxXp: 2499,
        color: "text-emerald-500",
        glowColor: "shadow-emerald-500/50",
    },
    {
        level: 4,
        name: "Thunder Dragon",
        nameVi: "Rồng Xanh Dương",
        description: "Expert - Commanding respect",
        image: "/ranks/rank-4.png",
        minXp: 2500,
        maxXp: 4999,
        color: "text-blue-500",
        glowColor: "shadow-blue-500/50",
    },
    {
        level: 5,
        name: "Phoenix Dragon",
        nameVi: "Rồng Đỏ",
        description: "Legend - The ultimate master",
        image: "/ranks/rank-5.png",
        minXp: 5000,
        maxXp: Infinity,
        color: "text-red-500",
        glowColor: "shadow-red-500/50",
    },
];

/**
 * Get rank configuration by level
 */
export function getRankByLevel(level: number): RankConfig {
    const clampedLevel = Math.min(Math.max(level, 1), 5);
    return RANKS[clampedLevel - 1];
}

/**
 * Get rank configuration by XP
 */
export function getRankByXp(xp: number): RankConfig {
    for (let i = RANKS.length - 1; i >= 0; i--) {
        if (xp >= RANKS[i].minXp) {
            return RANKS[i];
        }
    }
    return RANKS[0];
}

/**
 * Calculate XP progress percentage within current rank
 */
export function getXpProgressInRank(xp: number): number {
    const rank = getRankByXp(xp);
    if (rank.level === 5) {
        return 100; // Max level
    }
    const xpInRank = xp - rank.minXp;
    const xpForRank = rank.maxXp - rank.minXp + 1;
    return Math.min((xpInRank / xpForRank) * 100, 100);
}

/**
 * Get XP needed to reach next rank
 */
export function getXpToNextRank(xp: number): number {
    const rank = getRankByXp(xp);
    if (rank.level === 5) {
        return 0; // Already max
    }
    return rank.maxXp + 1 - xp;
}

// ============================================
// XP ACTION VALUES
// ============================================
export const XP_ACTIONS = {
    DAILY_CHECKIN: 3,
    CREATE_POST: 5,
    RECEIVE_LIKE: 1,
    RECEIVE_COMMENT: 2,  // Only first comment per user
    RECEIVE_SHARE: 3,
    GIVE_COMMENT: 1,
} as const;

// ============================================
// LEVEL UP BONUSES
// ============================================
export const LEVEL_UP_BONUS: Record<number, number> = {
    2: 50,   // Lv1 -> Lv2: +50 XP bonus
    3: 80,   // Lv2 -> Lv3: +80 XP bonus
    4: 150,  // Lv3 -> Lv4: +150 XP bonus
    5: 300,  // Lv4 -> Lv5: +300 XP bonus
};

// ============================================
// IMAGE POST LIMITS BY LEVEL
// ============================================
export interface ImageLimit {
    count: number;
    period: 'day' | 'week';
    description: string;
}

export const IMAGE_LIMITS: Record<number, ImageLimit> = {
    1: { count: 3, period: 'week', description: '3 bài ảnh / 7 ngày' },
    2: { count: 5, period: 'week', description: '5 bài ảnh / 7 ngày' },
    3: { count: 2, period: 'day', description: '2 bài ảnh / ngày' },
    4: { count: 2, period: 'day', description: '2 bài ảnh / ngày' },
    5: { count: Infinity, period: 'day', description: 'Không giới hạn' },
};

/**
 * Get image post limit for a level
 */
export function getImageLimit(level: number): ImageLimit {
    return IMAGE_LIMITS[level] || IMAGE_LIMITS[1];
}

// ============================================
// GAMIFICATION RULES (for UI display)
// ============================================
export const GAMIFICATION_RULES = {
    title: 'Cách tính điểm XP',
    rules: [
        { icon: '📅', action: 'Điểm danh hàng ngày', xp: '+3 XP' },
        { icon: '📝', action: 'Đăng bài mới', xp: '+5 XP' },
        { icon: '❤️', action: 'Nhận Like', xp: '+1 XP' },
        { icon: '💬', action: 'Nhận Comment', xp: '+2 XP' },
        { icon: '🔁', action: 'Nhận Share', xp: '+3 XP' },
        { icon: '🗣️', action: 'Đi Comment', xp: '+1 XP' },
    ],
    bonusTitle: 'Bonus khi lên Level',
    bonuses: [
        { level: 2, bonus: '+50 XP' },
        { level: 3, bonus: '+80 XP' },
        { level: 4, bonus: '+150 XP' },
        { level: 5, bonus: '+300 XP' },
    ],
};
