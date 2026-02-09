"use client";

import { useState, useEffect } from "react";
import { Search, Bell, Menu, LogIn, LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { useLanguage } from "@/context/LanguageContext";
import { useSearch } from "@/hooks/useSearch";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import Link from "next/link";

export function Header() {
    const { user, signInWithGoogle, signOut } = useSupabaseAuth();
    const { notifications, unreadCount, markAsRead } = useNotifications();
    const { t } = useLanguage();

    return (
        <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-sm">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
                {/* Logo with Glow Effect */}
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="lg:hidden">
                        <Menu className="h-5 w-5" />
                    </Button>
                    <Link href="/" className="group flex items-center gap-3">
                        {/* Logo Container with Glow Effect */}
                        <div className="relative flex items-center gap-2 filter drop-shadow-[0_0_8px_rgba(56,189,248,0.6)] group-hover:drop-shadow-[0_0_15px_rgba(56,189,248,0.9)] transition-all duration-300">
                            {/* Text */}
                            <span className="font-bold text-2xl tracking-tight text-foreground hidden sm:block font-sans [-webkit-text-stroke:1px_#f97316] drop-shadow-[0_0_2px_rgba(249,115,22,0.8)]">
                                Tủ lạnh
                            </span>
                            {/* Icon - Placed AFTER text as requested */}
                            <div className="relative h-10 w-auto aspect-[355/582]">
                                <img
                                    src="/images/fridge-logo.png"
                                    alt="Fridge Logo"
                                    className="h-full w-auto object-contain"
                                />
                            </div>
                        </div>
                    </Link>
                </div>

                {/* Right Tools */}
                <div className="flex items-center gap-2 md:gap-4">
                    {/* Search */}
                    <div className="relative hidden md:block w-64">
                        <SearchLogic />
                    </div>

                    {/* Notifications */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="relative" onClick={markAsRead}>
                                <Bell className="h-5 w-5" />
                                {unreadCount > 0 && (
                                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-background" />
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-80 p-0">
                            <div className="p-4 border-b font-semibold text-sm">{t.messages.title}</div>
                            <div className="max-h-[300px] overflow-y-auto">
                                {notifications.length > 0 ? (
                                    notifications.map((n) => (
                                        <div key={n.id} className="p-3 border-b last:border-0 hover:bg-muted/50 text-sm flex gap-3">
                                            <div className="mt-1">
                                                {n.type === 'like' && '❤️'}
                                                {n.type === 'comment' && '💬'}
                                                {n.type === 'badge' && '🏆'}
                                            </div>
                                            <div className="space-y-1">
                                                <p className="leading-snug">
                                                    <span className="font-semibold">{n.actor?.full_name || "System"}</span> {n.message}
                                                </p>
                                                <p className="text-[10px] text-muted-foreground">{new Date(n.created_at).toLocaleTimeString()}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-4 text-center text-sm text-muted-foreground">{t.messages.noMessages}</div>
                                )}
                            </div>
                        </PopoverContent>
                    </Popover>



                    {user ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Avatar className="h-9 w-9 border cursor-pointer hover:opacity-80 transition-opacity">
                                    <AvatarImage src={user.user_metadata.avatar_url || ""} />
                                    <AvatarFallback>{user.user_metadata.full_name?.[0] || "U"}</AvatarFallback>
                                </Avatar>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                    <Link href={`/profile/${user.id}`} className="cursor-pointer">
                                        {t.profile.editProfile.replace('Edit ', '')}
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => signOut()}>
                                    <LogOut className="mr-2 h-4 w-4" />
                                    {t.auth.signOut}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <Button asChild className="gap-2">
                            <Link href="/auth" className="flex items-center gap-2">
                                <LogIn className="h-4 w-4" />
                                {t.auth.signInWithGoogle.replace(' with Google', '')}
                            </Link>
                        </Button>
                    )}
                </div>
            </div>
        </header>
    )
}

function SearchLogic() {
    const { query, setQuery, results, loading } = useSearch();
    const [open, setOpen] = useState(false);

    // Hide results when clicking outside (simple hack, improved with click-away listener later)
    useEffect(() => {
        if (!query) setOpen(false);
        else setOpen(true);
    }, [query]);

    return (
        <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
                placeholder="Search..."
                className="pl-9 h-9 bg-muted/50 border-none"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => { if (query) setOpen(true) }}
                onBlur={() => { setTimeout(() => setOpen(false), 200) }} // Delay to allow click on result
            />

            {open && (results.length > 0 || loading || (query.length > 0 && !loading)) && (
                <div className="absolute top-10 left-0 w-full bg-popover border rounded-md shadow-md z-50 overflow-hidden min-h-[40px]">
                    {loading && <div className="p-2 text-xs text-muted-foreground flex justify-center">Searching...</div>}
                    {!loading && results.length === 0 && query.length > 0 && (
                        <div className="p-3 text-xs text-muted-foreground text-center">No results found.</div>
                    )}
                    {results.map((r) => (
                        <Link key={r.type + r.id} href={r.url} className="block p-2 hover:bg-accent flex items-center gap-2 cursor-pointer transition-colors border-b last:border-0">
                            {r.type === 'profile' ? (
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={r.avatar} />
                                    <AvatarFallback>U</AvatarFallback>
                                </Avatar>
                            ) : (
                                <div className="h-8 w-8 flex items-center justify-center bg-secondary rounded-full text-sm">📝</div>
                            )}
                            <div className="overflow-hidden flex-1">
                                <div className="text-sm font-medium truncate">{r.title}</div>
                                {r.subtitle && <div className="text-[10px] text-muted-foreground truncate">{r.subtitle}</div>}
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
