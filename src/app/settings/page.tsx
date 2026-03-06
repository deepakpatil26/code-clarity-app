"use client";

import { UpdateUserForm } from "@/components/update-user-form";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";
import { redirect } from "next/navigation";

export default function SettingsPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="h-10 w-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-8 max-w-4xl animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="mb-8 space-y-1">
         <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Workspace Settings</h1>
         <p className="text-muted-foreground font-medium">Manage your profile, API keys, and notification preferences.</p>
      </div>
      
      <Card className="glass border-border/40 shadow-2xl overflow-hidden rounded-3xl">
        <CardHeader className="border-b border-border/10 bg-secondary/20 py-6 px-8">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
               <Settings className="h-5 w-5 text-primary" />
            </div>
            General Information
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <div className="max-w-xl">
            <UpdateUserForm />
          </div>
        </CardContent>
      </Card>
      
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
         <Card className="glass border-border/40 p-6 rounded-2xl opacity-60 grayscale hover:grayscale-0 transition-all cursor-not-allowed">
            <h3 className="font-bold mb-2">API Tokens</h3>
            <p className="text-sm text-muted-foreground">Manage external access via personal access tokens. (Coming Soon)</p>
         </Card>
         <Card className="glass border-border/40 p-6 rounded-2xl opacity-60 grayscale hover:grayscale-0 transition-all cursor-not-allowed">
            <h3 className="font-bold mb-2">Notifications</h3>
            <p className="text-sm text-muted-foreground">Configure Slack, Discord, and Email alerts. (Coming Soon)</p>
         </Card>
      </div>
    </div>
  );
}
