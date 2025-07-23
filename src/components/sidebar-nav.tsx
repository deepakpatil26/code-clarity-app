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
} from "lucide-react";
import Image from "next/image";

const menuItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/repositories", label: "Repositories", icon: GitPullRequest },
  { href: "/settings", label: "Settings", icon: Settings },
];

const CodeClarityLogo = () => (
  <Image
    src="/logo.png"
    alt="CodeClarity Logo"
    width={64}
    height={64}
    className="h-16 w-16 rounded-full"
  />
);

export function SidebarNav() {
  const { user, signOut } = useAuth();
  const pathname = usePathname();

  return (
    <>
      <SidebarHeader className="flex items-center gap-2">
        <CodeClarityLogo />
        <span className="text-xl font-semibold tracking-tight">
          CodeClarity
        </span>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} className="w-full">
                <SidebarMenuButton
                  tooltip={item.label}
                  isActive={
                    pathname === item.href ||
                    (item.href === "/repositories" &&
                      pathname.startsWith("/repositories"))
                  }
                  disabled={!user}
                >
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-2">
        {user && (
          <div className="p-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={signOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        )}
        <SidebarSeparator className="mb-2" />
        <div className="text-xs text-muted-foreground p-2 text-center">
          © 2024 CodeClarity
        </div>
      </SidebarFooter>
    </>
  );
}
