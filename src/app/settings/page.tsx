"use client";

import { UpdateUserForm } from "@/components/update-user-form";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";
import { redirect } from "next/navigation";

export default function SettingsPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return null; // or a loading spinner
  }

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex-1 p-4 lg:p-6 xl:p-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-w-2xl">
            <UpdateUserForm />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
