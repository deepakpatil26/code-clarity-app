"use client";

import { useAuth } from "@/hooks/use-auth";
import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
} from "@/components/ui/sidebar";
import { SidebarNav } from "@/components/sidebar-nav";
import { Header } from "@/components/header";
import { PropsWithChildren } from "react";
import { Loader2 } from "lucide-react";
import { usePathname } from "next/navigation";

const AUTH_ROUTES = ["/login", "/signup"];

export function AppLayout({ children }: PropsWithChildren) {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  const isAuthRoute = AUTH_ROUTES.includes(pathname);

  if (isAuthRoute) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarNav />
      </Sidebar>
      <SidebarInset>
        <Header />
        <main className="flex-1 bg-secondary/40">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
