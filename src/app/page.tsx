"use client";

import { Feed } from "@/components/feed/Feed";
import { LandingPage } from "@/components/landing/LandingPage";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function Home() {
  const { user, loading } = useSupabaseAuth();

  if (loading) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto pb-10">
        <Card className="p-6">
          <div className="flex gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        </Card>
        {[1, 2].map((i) => (
          <Card key={i} className="p-6">
            <div className="flex gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-1/3 mb-4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  // Community Feed - shows all public posts from everyone
  return <Feed />;
}

