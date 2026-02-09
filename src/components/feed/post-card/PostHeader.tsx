import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Ban, Edit, Flag, MoreHorizontal, Trash2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";
import { UI_Post } from "@/hooks/usePosts";

interface PostHeaderProps {
    post: UI_Post;
    isAuthor: boolean;
    isAdmin: boolean;
    onEdit: () => void;
    onDelete: () => void;
    onBlockUser: () => void;
}

export function PostHeader({ post, isAuthor, isAdmin, onEdit, onDelete, onBlockUser }: PostHeaderProps) {
    const { t } = useLanguage();

    return (
        <div className="flex flex-row items-start justify-between space-y-0 p-4 pb-2">
            <div className="flex items-center gap-3">
                <Link href={`/profile/${post.user.id}`} className="cursor-pointer hover:opacity-80 transition-opacity">
                    <Avatar>
                        <AvatarImage src={post.user.avatar} />
                        <AvatarFallback>{post.user.name[0]}</AvatarFallback>
                    </Avatar>
                </Link>
                <div>
                    <Link href={`/profile/${post.user.id}`} className="font-semibold text-sm flex items-center gap-2 hover:underline cursor-pointer">
                        {post.user.name}
                        {post.user.title && (
                            <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded text-secondary-foreground font-semibold no-underline shadow-sm">
                                {post.user.title}
                            </span>
                        )}
                    </Link>
                    <div className="flex items-center gap-2 flex-wrap">
                        <Link href={`/post/${post.id}`} className="text-xs text-muted-foreground hover:underline">
                            {post.time}
                        </Link>
                        {post.community && (
                            <Link
                                href={`/community/${post.community.slug}`}
                                className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                            >
                                {post.community.slug === 'youtube' && '📺'}
                                {post.community.slug === 'tricks-courses' && '🎓'}
                                {post.community.name}
                            </Link>
                        )}
                    </div>
                </div>
            </div>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="-mr-2 h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                    {/* Edit for Author */}
                    {isAuthor && (
                        <>
                            <DropdownMenuItem
                                onSelect={(e) => {
                                    e.preventDefault();
                                    onEdit();
                                }}
                                className="cursor-pointer"
                            >
                                <Edit className="h-4 w-4 mr-2" />
                                {t.common.edit}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                        </>
                    )}
                    {/* Author or Admin can delete */}
                    {(isAuthor || isAdmin) && (
                        <DropdownMenuItem
                            onSelect={(e) => {
                                e.preventDefault();
                                onDelete();
                            }}
                            className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {isAdmin && !isAuthor
                                ? t.admin.deleteAdmin
                                : t.feed.delete}
                        </DropdownMenuItem>
                    )}

                    {/* Admin only: Block user */}
                    {isAdmin && !isAuthor && (
                        <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onSelect={(e) => {
                                    e.preventDefault();
                                    onBlockUser();
                                }}
                                className="text-orange-600 focus:text-orange-600 focus:bg-orange-50 cursor-pointer"
                            >
                                <Ban className="h-4 w-4 mr-2" />
                                {t.admin.blockUser}
                            </DropdownMenuItem>
                        </>
                    )}

                    {/* Everyone can report */}
                    {!isAuthor && (
                        <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onSelect={() => toast.info("Đã ghi nhận báo cáo của bạn")}
                                className="cursor-pointer"
                            >
                                <Flag className="h-4 w-4 mr-2" />
                                {t.admin.reportPost}
                            </DropdownMenuItem>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
