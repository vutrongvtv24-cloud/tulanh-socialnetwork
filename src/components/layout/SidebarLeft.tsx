"use client";

import { Button } from "@/components/ui/button";
import { Lock, Home, Hash, MessageCircle, BookOpen, CheckSquare, NotebookPen, Users, StickyNote } from "lucide-react";
import { RPG_CLASSES, SPACES } from "@/data/mock";
import Link from "next/link";
import { useGamification } from "@/context/GamificationContext";
import { useLanguage } from "@/context/LanguageContext";
import { usePathname } from "next/navigation";

export function SidebarLeft() {
    const { level } = useGamification();
    const { t } = useLanguage();
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path;

    return (
        <div className="space-y-6 pb-4">
            <div className="space-y-1">
                <Button
                    variant="ghost"
                    className={`w-full justify-start font-medium transition-all duration-200 ${isActive("/")
                        ? "bg-primary/20 text-primary-foreground border-l-4 border-primary rounded-r-full"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/10"
                        }`}
                    asChild
                >
                    <Link href="/">
                        <Users className={`mr-2 h-4 w-4 ${isActive("/") ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"}`} />
                        {t.nav.community}
                    </Link>
                </Button>
                <Button
                    variant="ghost"
                    className={`w-full justify-start font-medium transition-all duration-200 ${isActive("/journal")
                        ? "bg-primary/20 text-primary-foreground border-l-4 border-primary rounded-r-full"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/10"
                        }`}
                    asChild
                >
                    <Link href="/journal">
                        <NotebookPen className={`mr-2 h-4 w-4 ${isActive("/journal") ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"}`} />
                        {t.nav.myJournal}
                    </Link>
                </Button>
                <Button
                    variant="ghost"
                    className={`w-full justify-start font-medium transition-all duration-200 ${isActive("/todos")
                        ? "bg-primary/20 text-primary-foreground border-l-4 border-primary rounded-r-full"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/10"
                        }`}
                    asChild
                >
                    <Link href="/todos">
                        <CheckSquare className={`mr-2 h-4 w-4 ${isActive("/todos") ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"}`} />
                        {t.nav.todoList}
                    </Link>
                </Button>
                <Button
                    variant="ghost"
                    className={`w-full justify-start font-medium transition-all duration-200 ${isActive("/notes")
                        ? "bg-primary/20 text-primary-foreground border-l-4 border-primary rounded-r-full"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/10"
                        }`}
                    asChild
                >
                    <Link href="/notes">
                        <StickyNote className={`mr-2 h-4 w-4 ${isActive("/notes") ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"}`} />
                        Tủ Lạnh
                    </Link>
                </Button>
                <Button
                    variant="ghost"
                    className={`w-full justify-start font-medium transition-all duration-200 ${isActive("/messages")
                        ? "bg-primary/20 text-primary-foreground border-l-4 border-primary rounded-r-full"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/10"
                        }`}
                    asChild
                >
                    <Link href="/messages">
                        <MessageCircle className={`mr-2 h-4 w-4 ${isActive("/messages") ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"}`} />
                        {t.nav.messages}
                    </Link>
                </Button>
            </div>





        </div>
    )
}
