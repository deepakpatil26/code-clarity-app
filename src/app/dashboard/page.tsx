"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CodeAnalysisViewer } from "@/components/code-analysis-viewer";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, limit, onSnapshot, where } from "firebase/firestore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, GitPullRequest, LayoutDashboard, History, ExternalLink, Zap, Code2, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const [recentReviews, setRecentReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [queryError, setQueryError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      redirect("/login");
    }
  }, [user, loading]);

  useEffect(() => {
    if (user) {
      setQueryError(null);
      const q = query(
        collection(db, "pr_reviews"),
        where("userId", "==", user.uid),
        orderBy("completedAt", "desc"),
        limit(5)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const reviews = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setRecentReviews(reviews);
        setReviewsLoading(false);
      }, (error: any) => {
        console.error("Error fetching recent reviews:", error);
        setReviewsLoading(false);
        if (error.code === 'permission-denied') {
          setQueryError("Access Denied: Please check Firestore Security Rules.");
        } else if (error.message.includes('index')) {
          setQueryError("Index Required: Check console for the creation link.");
        } else {
          setQueryError(error.message);
        }
      });

      return () => unsubscribe();
    }
  }, [user]);

  if (loading || !user) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="relative">
           <div className="h-16 w-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
           <div className="absolute inset-0 flex items-center justify-center">
              <Code2 className="h-6 w-6 text-primary" />
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 md:px-8 space-y-8 max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground font-medium">Welcome back, {user.displayName?.split(' ')[0] ?? 'Developer'}. Here's your code health at a glance.</p>
        </div>
        <Button asChild className="rounded-full shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90">
           <Link href="/repositories">
              <GitPullRequest className="mr-2 h-4 w-4" /> Analyze New Repo
           </Link>
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="glass border-border/40 p-1 rounded-xl overflow-x-auto no-scrollbar">
          <TabsTrigger value="overview" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="analyzer" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">
            <Zap className="h-4 w-4" />
            <span className="hidden sm:inline">Manual Analyzer</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Stats */}
            <Card className="lg:col-span-2 glass border-border/40 shadow-xl overflow-hidden rounded-2xl">
              <CardHeader className="border-b border-border/10 bg-secondary/20 pb-4">
                <div className="flex justify-between items-center">
                   <div>
                      <CardTitle className="text-xl">Latest Pull Request Reviews</CardTitle>
                      <CardDescription>Real-time updates from your linked repositories</CardDescription>
                   </div>
                   <History className="h-5 w-5 text-muted-foreground opacity-50" />
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {reviewsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-20 w-full animate-pulse bg-secondary/50 rounded-xl"></div>)}
                  </div>
                ) : queryError ? (
                  <div className="flex flex-col items-center justify-center py-12 px-6 border-2 border-dashed border-destructive/20 rounded-2xl bg-destructive/5">
                    <AlertCircle className="h-10 w-10 text-destructive mb-3" />
                    <p className="text-destructive font-semibold">{queryError}</p>
                    <p className="text-sm text-muted-foreground mt-2 text-center max-w-md">
                      Ensure you've applied the security rules and created the necessary indexes in the Firebase Console.
                    </p>
                  </div>
                ) : recentReviews.length > 0 ? (
                  <div className="space-y-4">
                    {recentReviews.map((review) => (
                      <Link 
                        key={review.id} 
                        href={`/reviews/${review.id}`}
                        className="group flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border border-transparent hover:border-primary/20 hover:bg-primary/5 transition-all duration-300"
                      >
                        <div className="flex items-center gap-4 w-full">
                          <div className={`p-3 rounded-xl transition-colors ${review.score >= 8 ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                            <GitPullRequest className="h-6 w-6" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-bold truncate text-foreground group-hover:text-primary transition-colors">{review.repoFullName}</div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                               <span className="font-mono bg-secondary px-1.5 py-0.5 rounded leading-none">#{review.prNumber}</span>
                               <span className="truncate max-w-[150px] sm:max-w-none">{review.prTitle}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between w-full sm:w-auto mt-4 sm:mt-0 gap-6 pl-14 sm:pl-0">
                           <div className="flex flex-col items-end">
                              <div className={`text-2xl font-black ${review.score >= 8 ? 'text-green-500' : 'text-yellow-500'}`}>{review.score.toFixed(1)}</div>
                              <Badge variant="outline" className={`text-[9px] px-1.5 h-4 font-bold border-muted-foreground/30`}>{review.grade}</Badge>
                           </div>
                           <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 px-6 border-2 border-dashed rounded-2xl bg-secondary/10">
                    <History className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-10" />
                    <p className="text-muted-foreground font-medium mb-6">No automated reviews processed yet.</p>
                    <Button variant="outline" asChild className="rounded-full">
                       <Link href="/repositories">Link a Repository</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Health Score Card */}
            <Card className="glass border-border/40 shadow-xl overflow-hidden rounded-2xl flex flex-col h-fit">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm uppercase tracking-widest text-muted-foreground font-bold">Ecosystem Health</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center pt-4 flex-1">
                 <div className="relative flex items-center justify-center mb-6">
                    <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full"></div>
                    <div className="relative text-6xl md:text-7xl font-black text-primary drop-shadow-sm">
                      {recentReviews.length > 0 
                        ? (recentReviews.reduce((acc, r) => acc + r.score, 0) / recentReviews.length).toFixed(1)
                        : "--"}
                    </div>
                 </div>
                 <p className="text-sm font-semibold text-foreground uppercase tracking-tight">Average Code Quality</p>
                 <p className="text-xs text-muted-foreground mt-1">Based on {recentReviews.length} recent reviews</p>
                 
                 <div className="mt-10 w-full space-y-4">
                    <div className="p-4 rounded-xl bg-secondary/30 border border-border/50">
                       <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium text-muted-foreground">Monitored Repos</span>
                          <span className="text-lg font-bold">{new Set(recentReviews.map(r => r.repoFullName)).size}</span>
                       </div>
                       <div className="w-full bg-border/50 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-primary h-full" style={{ width: '60%' }}></div>
                       </div>
                    </div>

                    <div className="p-4 rounded-xl bg-secondary/30 border border-border/50">
                       <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium text-muted-foreground">Recent Findings</span>
                          <span className="text-lg font-bold">{recentReviews.reduce((acc, r) => acc + (r.findingsCount || 0), 0)}</span>
                       </div>
                       <div className="w-full bg-border/50 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-accent h-full" style={{ width: '40%' }}></div>
                       </div>
                    </div>
                 </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analyzer" className="outline-none">
          <Card className="glass border-border/40 shadow-xl overflow-hidden rounded-2xl min-h-[600px]">
             <CardHeader className="border-b border-border/10 bg-secondary/20">
                <CardTitle>Manual Code Analyzer</CardTitle>
                <CardDescription>Upload local files or paste code for instant AI-powered improvements.</CardDescription>
             </CardHeader>
             <CardContent className="p-0">
               <CodeAnalysisViewer />
             </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
