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
  const [needsReauth, setNeedsReauth] = useState(false);

  const isGitHubConnected = user?.providerData.some(
    (provider) => provider.providerId === "github.com"
  );

  const handleGitHubConnect = async () => {
    const success = await signInWithGitHub();
    if (success) {
      setNeedsReauth(false);
      fetchRepositories();
    }
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
          title: "Session Expired",
          description: "Could not retrieve GitHub token. Please re-authenticate.",
        });
        setLoading(false);
        setNeedsReauth(true);
        return;
      }
      const result = await listRepositories({ authToken: token });
      setRepositories(result.repositories);
    } catch (error) {
      console.error("Failed to fetch repositories:", error);
      setLoading(false);
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
    if (authLoading) return null;

    if (!user) {
      return (
        <div className="flex flex-col items-center justify-center py-20 bg-secondary/10 rounded-2xl border-2 border-dashed">
           <p className="text-muted-foreground font-medium">Please sign in to view your repositories.</p>
           <Button asChild className="mt-4 rounded-full">
              <Link href="/login">Sign In</Link>
           </Button>
        </div>
      );
    }

    if (!isGitHubConnected || needsReauth) {
      return (
        <>
          <ReauthDialog open={showReauthDialog} onOpenChange={setShowReauthDialog} />
          <div className="flex flex-col items-center justify-center text-center py-20 px-6 glass rounded-2xl border-white/10 shadow-xl">
            <div className="p-5 bg-primary/10 rounded-2xl mb-6">
               <Github className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-2xl font-bold mb-3 tracking-tight">Connect Your GitHub</h3>
            <p className="text-muted-foreground mb-8 max-w-sm font-medium">
              We need access to your repositories to perform automated PR analysis and security scans.
            </p>
            <Button onClick={handleGitHubConnect} size="lg" className="rounded-full px-8 h-12 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90">
              <Github className="mr-3 h-5 w-5" /> Connect via OAuth
            </Button>
          </div>
        </>
      );
    }

    if (loading) {
      return (
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-16 w-full animate-pulse bg-secondary/50 rounded-xl"></div>
          ))}
        </div>
      );
    }

    if (repositories.length === 0) {
      return (
        <div className="text-center py-20 glass rounded-2xl border-white/10">
          <Github className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-20" />
          <p className="text-muted-foreground font-semibold">No public repositories found in your workspace.</p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto rounded-xl border border-border/40 bg-secondary/5">
        <Table className="min-w-[720px]">
          <TableHeader className="bg-secondary/30">
            <TableRow className="hover:bg-transparent border-border/10">
              <TableHead className="font-bold py-4">Repository Name</TableHead>
              <TableHead className="hidden md:table-cell font-bold">Language</TableHead>
              <TableHead className="hidden lg:table-cell text-center font-bold">Stats</TableHead>
              <TableHead className="text-right font-bold pr-6">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {repositories.map((repo) => (
              <TableRow key={repo.id} className="group hover:bg-primary/5 transition-colors border-border/10">
                <TableCell className="font-semibold py-5">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${repo.isPrivate ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      {repo.isPrivate ? <ShieldCheck className="h-4 w-4" /> : <GitPullRequest className="h-4 w-4" />}
                    </div>
                    <Link
                      href={`/repositories/${repo.owner}/${repo.name}`}
                      className="hover:text-primary transition-colors leading-none"
                    >
                      {repo.fullName}
                    </Link>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {repo.language ? (
                    <Badge variant="outline" className="font-semibold border-primary/20 text-primary bg-primary/5">{repo.language}</Badge>
                  ) : <span className="text-muted-foreground text-xs italic">Not specified</span>}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                   <div className="flex items-center justify-center gap-4 text-xs font-semibold">
                      <div className="flex items-center gap-1.5 text-yellow-500">
                         <Star className="h-3.5 w-3.5 fill-current" />
                         <span>{repo.stars}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                         <GitFork className="h-3.5 w-3.5" />
                         <span>{repo.forks}</span>
                      </div>
                   </div>
                </TableCell>
                <TableCell className="text-right pr-6">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" asChild>
                       <Link href={repo.url} target="_blank"><ExternalLink className="h-4 w-4" /></Link>
                    </Button>
                    <Button variant="outline" size="sm" className="rounded-full px-4 h-8 font-bold border-primary/30 hover:bg-primary hover:text-white transition-all transform group-hover:scale-105" asChild>
                      <Link href={`/repositories/${repo.owner}/${repo.name}`}>Configure</Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-8 px-4 md:px-8 max-w-7xl animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="mb-8 space-y-1">
         <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Your Repositories</h1>
         <p className="text-muted-foreground font-medium">Select a repository to enable AI code reviews and security tracking.</p>
      </div>
      
      <Card className="glass border-border/40 shadow-2xl overflow-hidden rounded-2xl">
        <CardContent className="p-4 sm:p-6 lg:p-8">{renderContent()}</CardContent>
      </Card>
    </div>
  );
}
