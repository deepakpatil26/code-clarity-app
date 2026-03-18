
"use client";

import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  GitPullRequest,
  Loader2,
  Play,
  ChevronRight,
  BarChart2,
  ArrowLeft,
  Bot,
  ExternalLink,
  GitMerge,
  MessageSquare
} from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { listPullRequests } from "@/ai/flows/list-pull-requests-flow";
import type { PullRequest } from "@/ai/schemas/github";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { getPullRequestDiff } from "@/ai/flows/get-pull-request-diff-flow";
import { suggestCodeImprovements } from "@/ai/flows/suggest-code-improvements";
import type { SuggestCodeImprovementsOutput } from "@/ai/schemas/code-analysis";
import { AnalysisDialog } from "@/components/analysis-dialog";
import { useRepoConfig } from "@/hooks/use-repo-config";

export default function PullRequestsPage() {
  const { user, loading: authLoading, getGitHubToken } = useAuth();
  const { toast } = useToast();
  const params = useParams();
  const router = useRouter();

  const owner = params.owner as string;
  const repo = params.repo as string;
  const repoFullName = `${owner}/${repo}`;

  // Register this repo for Pro features
  useRepoConfig(repoFullName);

  const [loading, setLoading] = useState(true);
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const [currentDiff, setCurrentDiff] = useState("");
  const [analyzingPr, setAnalyzingPr] = useState<number | null>(null);
  const [analysisResult, setAnalysisResult] =
    useState<SuggestCodeImprovementsOutput | null>(null);
  const [isAnalysisDialogOpen, setIsAnalysisDialogOpen] = useState(false);
  const [selectedPrTitle, setSelectedPrTitle] = useState("");
  const [needsReauth, setNeedsReauth] = useState(false);

  const fetchPullRequests = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await getGitHubToken();
      if (!token) {
        toast({
          variant: "destructive",
          title: "Session Expired",
          description: "Could not retrieve GitHub token.",
        });
        setLoading(false);
        setNeedsReauth(true);
        return;
      }
      const result = await listPullRequests({ authToken: token, owner, repo });
      setPullRequests(result.pullRequests);
    } catch (error) {
      console.error("Failed to fetch pull requests:", error);
      toast({
        variant: "destructive",
        title: "Failed to Fetch Pull Requests",
        description:
          "An error occurred while fetching pull requests. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }, [user, getGitHubToken, owner, repo, toast]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchPullRequests();
    }
  }, [authLoading, user, fetchPullRequests]);

  const handleAnalyze = async (pr: PullRequest) => {
    setAnalyzingPr(pr.id);
    setAnalysisResult(null);
    setCurrentDiff("");
    try {
      const token = await getGitHubToken();
      if (!token) {
        toast({
          variant: "destructive",
          title: "Session Expired",
          description: "Could not retrieve GitHub token.",
        });
        setNeedsReauth(true);
        return;
      }

      // 1. Get the PR diff
      const diffResult = await getPullRequestDiff({
        authToken: token,
        owner,
        repo,
        pullNumber: pr.number,
      });

      // 2. Get suggestions for the diff
      const analysisResult = await suggestCodeImprovements({
        code: diffResult.diff,
        language: "diff",
      });

      setCurrentDiff(diffResult.diff);
      setAnalysisResult(analysisResult);
      setSelectedPrTitle(pr.title);
      setIsAnalysisDialogOpen(true);
    } catch (error) {
      console.error("Analysis failed:", error);
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: "An error occurred during the analysis. Please try again.",
      });
    } finally {
      setAnalyzingPr(null);
    }
  };

  const renderContent = () => {
    if (loading || authLoading) {
      return (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      );
    }

    if (needsReauth) {
      return (
        <div className="flex flex-col items-center justify-center text-center py-16 bg-red-500/5 rounded-2xl border border-red-500/10">
          <Bot className="h-10 w-10 text-red-500/50 mb-3" />
          <h3 className="text-xl font-bold mb-2 text-foreground">GitHub Session Expired</h3>
          <p className="text-muted-foreground mb-6 max-w-sm">
            We lost access to your GitHub token. Please return to the dashboard to reconnect and resume analysis.
          </p>
          <Button asChild className="rounded-full px-6 bg-primary hover:bg-primary/90">
            <Link href="/repositories">Return to Dashboard</Link>
          </Button>
        </div>
      );
    }

    if (pullRequests.length === 0) {
      return (
        <div className="text-center py-16">
          <p className="text-muted-foreground">No open pull requests found.</p>
        </div>
      );
    }

    return (
      <div className="border rounded-lg overflow-x-auto">
        <Table className="min-w-[640px]">
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead className="hidden md:table-cell">Author</TableHead>
              <TableHead className="hidden lg:table-cell text-right">
                Last Updated
              </TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pullRequests.map((pr) => (
              <TableRow key={pr.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    <GitMerge className="h-5 w-5 text-green-600" />
                    <div className="flex flex-col">
                      <Link
                        href={pr.url}
                        target="_blank"
                        className="hover:underline"
                        rel="noopener noreferrer"
                      >
                        {pr.title}
                      </Link>
                      <span className="text-xs text-muted-foreground">
                        #{pr.number}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage
                        src={pr.user.avatarUrl}
                        alt={pr.user.login}
                      />
                      <AvatarFallback>{pr.user.login.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span>{pr.user.login}</span>
                  </div>
                </TableCell>
                <TableCell className="hidden lg:table-cell text-right text-muted-foreground">
                  {formatDistanceToNow(new Date(pr.updatedAt), {
                    addSuffix: true,
                  })}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAnalyze(pr)}
                      disabled={analyzingPr === pr.id}
                      className="rounded-full"
                    >
                      {analyzingPr === pr.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Bot className="mr-2 h-4 w-4" />
                      )}
                      Analyze
                    </Button>
                    <Button variant="ghost" size="sm" asChild className="rounded-full">
                      <Link
                        href={pr.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Link>
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
    <>
      <AnalysisDialog
        open={isAnalysisDialogOpen}
        onOpenChange={setIsAnalysisDialogOpen}
        result={analysisResult}
        title={selectedPrTitle}
        code={currentDiff}
      />
      <div className="container mx-auto py-6 px-4 md:px-8 max-w-7xl">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 self-start sm:self-auto"
                onClick={() => router.back()}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex-1 min-w-0">
                <CardTitle className="flex items-center gap-2">
                  <GitPullRequest className="h-5 w-5 shrink-0" />
                  Pull Requests
                </CardTitle>
                <CardDescription className="truncate">
                  Open pull requests for{" "}
                  <span className="font-semibold text-primary">{`${owner}/${repo}`}</span>
                </CardDescription>
              </div>
              <Button asChild variant="outline" className="shrink-0 self-start sm:self-auto">
                <Link href={`/dashboard/${owner}/${repo}`}>View Analytics</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>{renderContent()}</CardContent>
        </Card>
      </div>
    </>
  );
}