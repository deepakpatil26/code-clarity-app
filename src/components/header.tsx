"use client";

import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { LifeBuoy, LogIn, LogOut, Settings, User, Search } from "lucide-react";
import Link from "next/link";

export function Header() {
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/60 px-4 backdrop-blur-md sm:px-8 border-border/40">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="hover:bg-accent/50 rounded-lg p-2 transition-colors" />
        <div className="hidden md:flex items-center bg-secondary/30 rounded-full px-4 py-1.5 border border-border/50 focus-within:border-primary/50 transition-all duration-300 w-64 group">
           <Search className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors mr-2" />
           <input 
              type="text" 
              placeholder="Quick search..." 
              className="bg-transparent border-none text-xs focus:outline-none w-full"
           />
           <kbd className="hidden lg:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
             <span className="text-xs">⌘</span>K
           </kbd>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end text-right">
               <span className="text-sm font-semibold leading-none">{user.displayName ?? "Developer"}</span>
               <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">Pro Member</span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0.5 border-2 border-primary/20 hover:border-primary/50 transition-all overflow-hidden bg-secondary">
                  <Avatar className="h-full w-full">
                    <AvatarImage
                      src={user.photoURL ?? ""}
                      alt={user.displayName ?? "User"}
                    />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                      {user.email?.charAt(0).toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 mt-2 rounded-xl glass p-1 shadow-2xl border-white/10" align="end" forceMount>
                <DropdownMenuLabel className="font-normal p-3">
                  <div className="flex flex-col space-y-2">
                    <p className="text-sm font-semibold leading-none text-foreground">
                      {user.displayName ?? "User Account"}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground truncate">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/5" />
                <DropdownMenuItem asChild className="rounded-lg cursor-pointer hover:bg-white/10">
                   <Link href="/settings" className="flex items-center w-full">
                      <Settings className="mr-3 h-4 w-4 text-primary" />
                      <span>Workspace Settings</span>
                   </Link>
                </DropdownMenuItem>
                <DropdownMenuItem disabled className="rounded-lg opacity-50">
                   <User className="mr-3 h-4 w-4 text-muted-foreground" />
                   <span>My Profile</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/5" />
                <DropdownMenuItem onClick={signOut} className="rounded-lg cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive">
                   <LogOut className="mr-3 h-4 w-4" />
                   <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <Button asChild className="rounded-full bg-primary hover:bg-primary/90">
            <Link href="/login">
              <LogIn className="mr-2 h-4 w-4" />
              Sign In
            </Link>
          </Button>
        )}
      </div>
    </header>
  );
}
