"use client";

import { CodeAnalysisViewer } from "@/components/code-analysis-viewer";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";
import Link from "next/link";

export default function AnalysisPage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <div className="text-center max-w-md space-y-4">
          <h1 className="text-2xl font-bold">Code Analysis</h1>
          <p className="text-muted-foreground">
            Sign in with GitHub to analyze your code and get instant feedback on
            quality, security, and performance.
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
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Code Analysis</h1>
        <p className="text-muted-foreground">
          Upload or select files to analyze code quality, security, and
          performance.
        </p>
      </div>

      <CodeAnalysisViewer />
    </div>
  );
}
