"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import {
  LayoutDashboard,
  Settings,
  GitPullRequest,
  LogOut,
  Code2,
} from "lucide-react";
import Image from "next/image";

const menuItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/repositories", label: "Repositories", icon: GitPullRequest },
  { href: "/settings", label: "Settings", icon: Settings },
];

const CodeClarityLogo = () => (
  <Link href="/" className="flex items-center gap-3 px-2 py-4 hover:opacity-80 transition-opacity">
    <div className="bg-primary p-2 rounded-xl shadow-lg shadow-primary/20">
      <Code2 className="text-white h-6 w-6" />
    </div>
    <div className="flex flex-col">
      <span className="text-lg font-bold tracking-tight leading-none group-data-[collapsible=icon]:hidden">
        CodeClarity
      </span>
      <span className="text-[10px] uppercase font-bold text-primary tracking-widest group-data-[collapsible=icon]:hidden">
        Pro Account
      </span>
    </div>
  </Link>
);

export function SidebarNav() {
  const { user, signOut } = useAuth();
  const pathname = usePathname();

  return (
    <>
      <SidebarHeader>
        <CodeClarityLogo />
      </SidebarHeader>
      <SidebarContent className="px-3 py-2">
        <SidebarMenu className="gap-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || (item.href === "/repositories" && pathname.startsWith("/repositories"));
            return (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href} className="w-full">
                  <SidebarMenuButton
                    tooltip={item.label}
                    isActive={isActive}
                    disabled={!user}
                    className={`h-11 px-4 transition-all duration-300 rounded-xl ${
                      isActive 
                        ? "bg-primary/10 text-primary font-semibold border-r-2 border-primary" 
                        : "hover:bg-secondary/80"
                    }`}
                  >
                    <item.icon className={`h-5 w-5 ${isActive ? "text-primary" : "text-muted-foreground mr-2"}`} />
                    <span className="ml-2">{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4 mt-auto">
        {user && (
          <div className="space-y-4">
            <div className="px-2 py-2 group-data-[collapsible=icon]:hidden">
               <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-1">Status</div>
               <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-[11px] font-semibold text-foreground/80">Worker Online</span>
               </div>
            </div>
          </div>
        )}
        <div className="text-[10px] text-muted-foreground/60 text-center mt-4 group-data-[collapsible=icon]:hidden">
          © 2026 CodeClarity Pro
        </div>
      </SidebarFooter>
    </>
  );
}
