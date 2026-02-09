"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";


export default function AuthPage() {
    const { signInWithGoogle } = useSupabaseAuth();
    const { t, setLanguage } = useLanguage();

    const handleGoogleLogin = async () => {
        try {
            await signInWithGoogle();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to login with Google';
            toast.error(message);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4 bg-muted/20 gap-8">


            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="text-center space-y-4 pb-8">
                    <CardTitle className="text-3xl font-extrabold tracking-tight">Chào mừng Bro đến với Tủ lạnh !</CardTitle>
                    <CardDescription className="text-base">
                        {t.auth.description}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <Button
                        size="lg"
                        variant="outline"
                        className="w-full h-14 text-base font-medium gap-3 hover:bg-muted/50 transition-all border-2"
                        onClick={handleGoogleLogin}
                    >
                        <svg className="h-6 w-6" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                            <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                        </svg>
                        {t.auth.signInWithGoogle}
                    </Button>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">
                                {t.auth.onlyGoogle}
                            </span>
                        </div>
                    </div>

                    <p className="text-xs text-center text-muted-foreground px-6 leading-relaxed">
                        {t.auth.agreement}
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
