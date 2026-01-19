"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useGamification } from "@/context/GamificationContext";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SidebarRight() {
    const { level, xp, badges, xpToNextLevel } = useGamification();
    const { user: authUser } = useSupabaseAuth();
    const { leaders, loading: loadingLeaderboard } = useLeaderboard();

    // Use session user if available, otherwise fallback to Guest
    const user = authUser ? {
        name: authUser.user_metadata.full_name || "Builder User",
        avatar: authUser.user_metadata.avatar_url || "",
        title: "Member",
    } : {
        name: "Guest",
        avatar: "",
        title: "Visitor"
    };

    return (
        <div className="space-y-6">
            <Card className="border-none shadow-none bg-transparent sm:bg-card sm:border sm:shadow-sm">
                <CardHeader className="pb-2 pt-4 px-0 sm:px-6">
                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Your Progress</CardTitle>
                </CardHeader>
                <CardContent className="px-0 sm:px-6">
                    <div className="flex items-center gap-4 mb-4">
                        <Avatar className="h-12 w-12 rounded-full border-2 border-primary/10">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback>{user.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                            <div className="font-bold text-base flex items-center gap-2">
                                {user.name}
                                {/* Badges next to name */}
                                <div className="flex gap-1">
                                    {badges.filter(b => b.unlocked).slice(0, 3).map((b, i) => (
                                        <span key={i} className="text-sm" title={b.name}>{b.icon}</span>
                                    ))}
                                </div>
                            </div>
                            <div className="text-xs font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded-full inline-block mt-1">
                                {user.title} • Level {level}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1.5 mb-6">
                        <div className="flex justify-between text-xs font-medium">
                            <span className="flex items-center gap-1">
                                <span className="text-primary">⚡</span> XP Progress
                            </span>
                            <span className="text-muted-foreground font-mono">
                                {Math.round(xp)}<span className="opacity-50">/{xpToNextLevel}</span>
                            </span>
                        </div>
                        <div className="relative">
                            <Progress value={(xp / xpToNextLevel) * 100} className="h-3" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-[10px] font-bold text-primary-foreground drop-shadow-sm">
                                    {Math.round((xp / xpToNextLevel) * 100)}%
                                </span>
                            </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground text-center">
                            {xpToNextLevel - xp} XP to Level {level + 1}
                        </p>
                    </div>

                    <div className="grid grid-cols-5 gap-2">
                        {badges.map((b, i) => (
                            <div key={i} className={`aspect-square rounded-md bg-secondary flex items-center justify-center text-lg ${b.unlocked ? '' : 'opacity-30 grayscale'}`} title={b.name}>
                                {b.icon}
                            </div>
                        ))}
                        {/* Badge Placeholders */}
                        {[...Array(5 - badges.length)].map((_, i) => (
                            <div key={`p-${i}`} className="aspect-square rounded-md bg-secondary/50 flex items-center justify-center text-xs opacity-20">
                                🔒
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card className="hidden xl:block">
                <CardHeader>
                    <CardTitle className="text-sm font-bold">Leaderboard</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {loadingLeaderboard ? (
                        <div className="text-xs text-muted-foreground text-center">Loading rankings...</div>
                    ) : leaders.length > 0 ? (
                        leaders.map((leader, i) => (
                            <div
                                key={leader.id}
                                className="flex items-center gap-3 text-sm group p-2 rounded-md -mx-2 hover:bg-secondary/50 transition-colors"
                            >
                                <div className={`font-bold w-5 text-center ${i === 0 ? 'text-yellow-500' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-amber-700' : 'text-muted-foreground'}`}>
                                    {i + 1}
                                </div>

                                <Link href={`/profile/${leader.id}`} className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer">
                                    <Avatar className="h-8 w-8 shrink-0">
                                        <AvatarImage src={leader.avatar_url} />
                                        <AvatarFallback>{leader.full_name?.[0] || "U"}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 truncate font-medium hover:underline decoration-primary">
                                        {leader.full_name}
                                        {leader.id === authUser?.id && <span className="ml-1 text-[10px] text-primary">(You)</span>}
                                    </div>
                                </Link>

                                <div className="flex items-center gap-2 shrink-0">
                                    <span className="font-bold text-primary text-xs hidden sm:inline-block">{leader.xp + (leader.level * 100)} XP</span>

                                    {leader.id !== authUser?.id && (
                                        <Link href={`/messages?userId=${leader.id}`} title={`Message ${leader.full_name}`}>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 opacity-70 hover:opacity-100 hover:bg-primary/20 hover:text-primary">
                                                <MessageCircle className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-xs text-muted-foreground text-center">Be the first to join the leaderboard!</div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
