"use client";

import { useAuth } from "@/hooks/use-auth";
import { PRAnalysisViewer } from "@/components/pr-analysis/pr-analysis-viewer";
import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";
import Link from "next/link";

export default function PRDetailPage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <div className="text-center max-w-md space-y-4">
          <h1 className="text-2xl font-bold">PR Analysis</h1>
          <p className="text-muted-foreground">
            Sign in with GitHub to analyze pull requests and get detailed code
            reviews.
          </p>
          <Button asChild className="mt-4">
            <Link href="/login">
              <Github className="mr-2 h-4 w-4" />
              Sign in with GitHub
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <PRAnalysisViewer />
    </div>
  );
}
