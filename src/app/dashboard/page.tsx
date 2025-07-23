"use client";

import { CodeAnalysisViewer } from "@/components/code-analysis-viewer";
import { useAuth } from "@/hooks/use-auth";
import { redirect } from "next/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      redirect("/login");
    }
  }, [user, loading]);

  if (loading || !user) {
    return null; // Or a loading spinner
  }

  return (
    <div className="p-4 lg:p-6 xl:p-8 h-full">
      <CodeAnalysisViewer />
    </div>
  );
}
