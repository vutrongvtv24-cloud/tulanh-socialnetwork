
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Header } from "@/components/layout/Header";
import { SidebarLeft } from "@/components/layout/SidebarLeft";
import { SidebarRight } from "@/components/layout/SidebarRight";
import { GamificationProvider } from "@/context/GamificationContext";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Friends Zone",
  description: "Ecosystem for Builders",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <GamificationProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            disableTransitionOnChange
          >
            <div className="min-h-screen bg-background">
              <Header />
              <div className="container mx-auto flex pt-20 gap-8 px-4 justify-center">
                <aside className="hidden lg:block w-[240px] shrink-0 sticky top-24 h-[calc(100vh-6rem)] overflow-y-auto pb-8">
                  <SidebarLeft />
                </aside>

                <main className="flex-1 max-w-2xl min-w-0 pb-10">
                  {children}
                </main>

                <aside className="hidden xl:block w-[320px] shrink-0 sticky top-24 h-[calc(100vh-6rem)] overflow-y-auto pb-8">
                  <SidebarRight />
                </aside>
              </div>
              <Toaster />
            </div>
          </ThemeProvider>
        </GamificationProvider>
      </body>
    </html>
  );
}
