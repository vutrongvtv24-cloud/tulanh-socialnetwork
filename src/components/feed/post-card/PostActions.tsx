import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";
import { Heart, MessageSquare, Share2 } from "lucide-react";
import { toast } from "sonner";

interface PostActionsProps {
    likes: number;
    commentsCount: number;
    isLiked: boolean;
    onToggleLike: () => void;
    onToggleComments: () => void;
    postId?: string; // Add postId for sharing
}

export function PostActions({ likes, commentsCount, isLiked, onToggleLike, onToggleComments, postId }: PostActionsProps) {
    const { t } = useLanguage();

    const handleShare = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!postId) {
            toast.error("Không tìm thấy ID bài viết");
            return;
        }

        // Construct the share URL
        const shareUrl = `${window.location.origin}/post/${postId}`;
        const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;

        console.log("Sharing URL:", shareUrl); // Debug log

        try {
            // Try explicit clipboard write first
            await navigator.clipboard.writeText(shareUrl);
            toast.success("Link đã copy vào clipboard!");
        } catch (err) {
            console.error("Clipboard error:", err);
            // Non-blocking error for clipboard, proceed to open share dialog
        }

        // Open Facebook share
        window.open(facebookShareUrl, '_blank', 'width=600,height=400');
    };

    return (
        <div className="flex w-full justify-between border-t bg-muted/20 p-2">
            <Button
                variant="ghost"
                size="sm"
                className={`flex-1 gap-2 hover:text-red-500 hover:bg-red-500/10 transition-colors ${isLiked ? "text-red-500" : "text-muted-foreground"}`}
                onClick={onToggleLike}
            >
                <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
                {likes}
            </Button>
            <Button
                variant="ghost"
                size="sm"
                className="flex-1 gap-2 text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 transition-colors"
                onClick={onToggleComments}
            >
                <MessageSquare className="h-4 w-4" />
                {commentsCount}
            </Button>
            <Button
                variant="ghost"
                size="sm"
                className="flex-1 gap-2 text-muted-foreground bg-transparent hover:text-blue-500 hover:bg-blue-500/10 transition-colors"
                onClick={handleShare}
            >
                <Share2 className="h-4 w-4" />
                {t.feed.share}
            </Button>
        </div>
    );
}
