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
  ExternalLink,
  GitMerge,
  MessageSquare,
  ArrowLeft,
  Bot,
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

export default function PullRequestsPage() {
  const { user, loading: authLoading, getGitHubToken } = useAuth();
  const { toast } = useToast();
  const params = useParams();
  const router = useRouter();

  const owner = params.owner as string;
  const repo = params.repo as string;

  const [loading, setLoading] = useState(true);
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const [analyzingPr, setAnalyzingPr] = useState<number | null>(null);
  const [analysisResult, setAnalysisResult] =
    useState<SuggestCodeImprovementsOutput | null>(null);
  const [isAnalysisDialogOpen, setIsAnalysisDialogOpen] = useState(false);
  const [selectedPrTitle, setSelectedPrTitle] = useState("");

  const fetchPullRequests = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await getGitHubToken();
      if (!token) {
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: "Could not retrieve GitHub token.",
        });
        setLoading(false);
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
    try {
      const token = await getGitHubToken();
      if (!token) {
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: "Could not retrieve GitHub token.",
        });
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

    if (pullRequests.length === 0) {
      return (
        <div className="text-center py-16">
          <p className="text-muted-foreground">No open pull requests found.</p>
        </div>
      );
    }

    return (
      <div className="border rounded-lg">
        <Table>
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
                <TableCell className="text-right space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAnalyze(pr)}
                    disabled={analyzingPr === pr.id}
                  >
                    {analyzingPr === pr.id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Bot className="mr-2 h-4 w-4" />
                    )}
                    Analyze
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link
                      href={pr.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" /> View
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
    <>
      <AnalysisDialog
        open={isAnalysisDialogOpen}
        onOpenChange={setIsAnalysisDialogOpen}
        result={analysisResult}
        title={selectedPrTitle}
      />
      <div className="flex-1 p-4 lg:p-6 xl:p-8">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => router.back()}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <GitPullRequest className="h-6 w-6" />
                  Pull Requests
                </CardTitle>
                <CardDescription>
                  Open pull requests for{" "}
                  <span className="font-semibold text-primary">{`${owner}/${repo}`}</span>
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>{renderContent()}</CardContent>
        </Card>
      </div>
    </>
  );
}
