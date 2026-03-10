"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, ArrowLeft, ShieldAlert, Zap, BarChart3, ChevronRight, FileCode, Code2, ExternalLink } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import Link from "next/link";

export default function ReviewDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [review, setReview] = useState<any>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    if (id) {
      fetchReview();
    }
  }, [id, user, authLoading]);

  const fetchReview = async () => {
    setLoading(true);
    try {
      const docRef = doc(db, "pr_reviews", id as string);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setReview({ id: docSnap.id, ...docSnap.data() });
      } else {
        console.error("Review not found");
      }
    } catch (error) {
      console.error("Error fetching review:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="relative">
           <div className="h-16 w-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
           <div className="absolute inset-0 flex items-center justify-center">
              <Zap className="h-6 w-6 text-primary" />
           </div>
        </div>
      </div>
    );
  }

  if (!review) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center space-y-6 glass m-8 rounded-3xl border-white/10 max-w-2xl mx-auto shadow-2xl">
        <div className="p-6 bg-red-500/10 rounded-2xl text-red-500">
           <ShieldAlert className="h-12 w-12" />
        </div>
        <h2 className="text-3xl font-bold tracking-tight">Review Expired or Not Found</h2>
        <Button onClick={() => router.back()} size="lg" className="rounded-full px-8">Return to Dashboard</Button>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-500";
    if (score >= 6) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <div className="container mx-auto py-8 px-4 md:px-8 space-y-8 max-w-7xl animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full hover:bg-secondary h-12 w-12 border bg-background shadow-sm">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
             <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-bold uppercase tracking-wider text-[10px]">Automated Analysis</Badge>
             <span className="text-muted-foreground text-xs font-mono">{new Date(review.completedAt).toLocaleDateString()}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight break-words">{review.repoFullName}</h1>
          <p className="text-muted-foreground font-medium flex items-center gap-2">
             <span className="bg-secondary px-2 py-0.5 rounded text-foreground">PR #{review.prNumber}</span>
             <span className="truncate max-w-[200px] md:max-w-none opacity-80">{review.prTitle}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quality Score Card */}
        <Card className="glass border-border/40 shadow-2xl overflow-hidden rounded-3xl h-fit">
          <CardHeader className="text-center pb-2 pt-8">
            <CardTitle className="text-sm uppercase tracking-[0.2em] text-muted-foreground font-black">Quality Index</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center pt-4 pb-10 px-8">
            <div className={`relative flex items-center justify-center mb-8`}>
               <div className={`absolute inset-0 blur-3xl rounded-full opacity-20 ${review.score >= 8 ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
               <div className={`relative text-6xl md:text-8xl font-black drop-shadow-lg ${getScoreColor(review.score)}`}>
                 {review.score.toFixed(1)}
               </div>
            </div>
            
            <div className="w-full flex justify-between items-center mb-6 px-2">
               <span className="text-sm font-bold uppercase tracking-tighter text-muted-foreground">Letter Grade</span>
               <Badge className={`text-xl px-4 py-1 font-black rounded-lg ${review.score >= 8 ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white'}`}>
                 {review.grade}
               </Badge>
            </div>
            
            <div className="w-full space-y-2">
               <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">
                  <span>Progress</span>
                  <span>{Math.round(review.score * 10)}%</span>
               </div>
               <Progress value={review.score * 10} className="h-3 rounded-full bg-secondary/50" />
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <Card className="lg:col-span-2 glass border-border/40 shadow-2xl overflow-hidden rounded-3xl">
        <CardHeader className="border-b border-border/10 bg-secondary/20 py-6 px-8 flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
             <div>
                <CardTitle className="text-xl font-bold">Analysis Breakdown</CardTitle>
                <CardDescription className="font-medium">Quantified metrics by category</CardDescription>
             </div>
             <BarChart3 className="h-6 w-6 text-primary opacity-50" />
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              <StatItem 
                icon={<ShieldAlert className="text-red-500 h-6 w-6" />} 
                label="Security" 
                value={review.securityFindingsCount || "0"} 
                color="bg-red-500/10"
              />
              <StatItem 
                icon={<Zap className="text-yellow-500 h-6 w-6" />} 
                label="Performance" 
                value={review.performanceFindingsCount || "0"} 
                color="bg-yellow-500/10"
              />
              <StatItem 
                icon={<BarChart3 className="text-blue-500 h-6 w-6" />} 
                label="Complexity" 
                value={review.complexityWarningsCount || "0"} 
                color="bg-blue-500/10"
              />
              <StatItem 
                icon={<FileCode className="text-purple-500 h-6 w-6" />} 
                label="Total Issues" 
                value={review.findingsCount || "0"} 
                color="bg-purple-500/10"
              />
            </div>

            <div className="mt-12 p-6 rounded-2xl bg-secondary/30 border border-border/40 flex items-start gap-4">
               <div className="p-3 bg-primary/20 rounded-xl text-primary">
                  <ExternalLink className="h-6 w-6" />
               </div>
               <div className="space-y-1">
                  <h4 className="font-bold text-foreground">Interactive Suggestions</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    All findings have been synchronized as inline comments on your GitHub Pull Request. You can resolve them directly in your code editor or on the GitHub platform.
                  </p>
                  <Button asChild variant="link" className="p-0 h-auto text-primary font-bold mt-2">
                     <Link href={`https://github.com/${review.repoFullName}/pull/${review.prNumber}`} target="_blank">
                        View Comments on GitHub <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
                     </Link>
                  </Button>
               </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass border-border/40 shadow-2xl overflow-hidden rounded-3xl">
        <CardHeader className="border-b border-border/10 bg-secondary/20 py-6 px-8">
          <CardTitle className="text-xl font-bold">Audit History</CardTitle>
          <CardDescription>Timestamped record of this analysis run</CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row justify-between gap-8 text-sm">
             <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center font-bold text-muted-foreground">JS</div>
                <div>
                   <div className="font-bold">Detected Stack</div>
                   <div className="text-muted-foreground">JavaScript / TypeScript</div>
                </div>
             </div>
             <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center font-bold text-muted-foreground text-xs">UTC</div>
                <div>
                   <div className="font-bold">Completion Time</div>
                   <div className="text-muted-foreground">{new Date(review.completedAt).toLocaleString()}</div>
                </div>
             </div>
             <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                   <Code2 className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                   <div className="font-bold">Engine Version</div>
                   <div className="text-muted-foreground">Clarity-v2.0 (Gemini 1.5 Pro)</div>
                </div>
             </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatItem({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string | number, color: string }) {
  return (
    <div className="flex flex-col items-center p-6 rounded-2xl bg-secondary/20 border border-border/10 hover:border-border transition-all duration-300 transform hover:scale-[1.02] shadow-sm">
      <div className={`mb-4 p-3 rounded-xl ${color}`}>{icon}</div>
      <div className="text-3xl font-black tracking-tight">{value}</div>
      <div className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1">{label}</div>
    </div>
  );
}
