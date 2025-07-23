"use client";

import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  GitPullRequest,
  Github,
  Loader2,
  Star,
  GitFork,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { listRepositories } from "@/ai/flows/list-repositories-flow";
import type { Repository } from "@/ai/schemas/github";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { ReauthDialog } from "@/components/reauth-dialog";

export default function RepositoriesPage() {
  const {
    user,
    loading: authLoading,
    getGitHubToken,
    signInWithGitHub,
    pendingCredentialForLinking,
  } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [showReauthDialog, setShowReauthDialog] = useState(false);

  const isGitHubConnected = user?.providerData.some(
    (provider) => provider.providerId === "github.com"
  );

  const handleGitHubConnect = async () => {
    const success = await signInWithGitHub();
    if (!success && pendingCredentialForLinking.current) {
      setShowReauthDialog(true);
    }
  };

  const fetchRepositories = useCallback(async () => {
    if (!isGitHubConnected) return;

    setLoading(true);
    try {
      const token = await getGitHubToken();
      if (!token) {
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description:
            "Could not retrieve GitHub token. Please re-authenticate with GitHub.",
        });
        setLoading(false);
        return;
      }
      const result = await listRepositories({ authToken: token });
      setRepositories(result.repositories);
    } catch (error) {
      console.error("Failed to fetch repositories:", error);
      toast({
        variant: "destructive",
        title: "Failed to Fetch Repositories",
        description:
          "An error occurred while fetching your repositories. Please try again later.",
      });
    } finally {
      setLoading(false);
    }
  }, [isGitHubConnected, getGitHubToken, toast]);

  useEffect(() => {
    if (!authLoading && user && isGitHubConnected) {
      fetchRepositories();
    }
  }, [authLoading, user, isGitHubConnected, fetchRepositories]);

  const renderContent = () => {
    if (authLoading) {
      return null;
    }

    if (!user) {
      return <p>Please sign in to view repositories.</p>;
    }

    if (!isGitHubConnected) {
      return (
        <>
          <ReauthDialog
            open={showReauthDialog}
            onOpenChange={setShowReauthDialog}
          />
          <div className="flex flex-col items-center justify-center text-center py-16 px-4 border-2 border-dashed rounded-lg">
            <Github className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Connect to GitHub</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              To view your repositories, connect your GitHub account.
            </p>
            <Button onClick={handleGitHubConnect} disabled={authLoading}>
              <Github className="mr-2 h-4 w-4" /> Connect to GitHub
            </Button>
          </div>
        </>
      );
    }

    if (loading) {
      return (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      );
    }

    if (repositories.length === 0) {
      return (
        <div className="text-center py-16">
          <p className="text-muted-foreground">No public repositories found.</p>
        </div>
      );
    }

    return (
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="hidden md:table-cell">Language</TableHead>
              <TableHead className="hidden lg:table-cell text-center">
                Stars
              </TableHead>
              <TableHead className="hidden lg:table-cell text-center">
                Forks
              </TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {repositories.map((repo) => (
              <TableRow key={repo.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {repo.isPrivate ? (
                      <ShieldCheck className="h-4 w-4 text-primary" />
                    ) : (
                      <GitPullRequest className="h-4 w-4 text-muted-foreground" />
                    )}
                    <Link
                      href={`/repositories/${repo.owner}/${repo.name}`}
                      className="hover:underline"
                    >
                      {repo.fullName}
                    </Link>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {repo.language && (
                    <Badge variant="secondary">{repo.language}</Badge>
                  )}
                </TableCell>
                <TableCell className="hidden lg:table-cell text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span>{repo.stars}</span>
                  </div>
                </TableCell>
                <TableCell className="hidden lg:table-cell text-center">
                  <div className="flex items-center justify-center gap-1">
                    <GitFork className="h-4 w-4 text-muted-foreground" />
                    <span>{repo.forks}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" asChild>
                    <Link
                      href={repo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" /> View on GitHub
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="flex-1 p-4 lg:p-6 xl:p-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitPullRequest className="h-6 w-6" />
            Repositories
          </CardTitle>
        </CardHeader>
        <CardContent>{renderContent()}</CardContent>
      </Card>
    </div>
  );
}
