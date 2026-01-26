"use client";

import { usePathname } from "next/navigation";
import { SidebarRight } from "@/components/layout/SidebarRight";
import { TodosSidebar } from "@/components/layout/TodosSidebar";

export function RightSidebarWrapper() {
    const pathname = usePathname();

    // Check if we are on the todos page
    const isTodosPage = pathname === "/todos";

    if (isTodosPage) {
        return <TodosSidebar />;
    }

    return <SidebarRight />;
}
