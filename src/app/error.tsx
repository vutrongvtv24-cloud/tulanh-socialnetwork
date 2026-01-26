"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error);
    }, [error]);

    return (
        <div className="flex h-[80vh] w-full flex-col items-center justify-center gap-4 text-center">
            <div className="rounded-full bg-destructive/10 p-4">
                <AlertCircle className="h-12 w-12 text-destructive" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Đã xảy ra lỗi!</h2>
            <p className="max-w-[400px] text-muted-foreground">
                Rất tiếc, đã có vấn đề xảy ra trong quá trình tải trang.
            </p>
            <div className="flex gap-4">
                <Button onClick={() => reset()} variant="default">
                    Thử lại
                </Button>
                <Button
                    onClick={() => window.location.href = '/'}
                    variant="outline"
                >
                    Về trang chủ
                </Button>
            </div>
        </div>
    );
}
