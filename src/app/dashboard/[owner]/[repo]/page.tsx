"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, TrendingUp, AlertCircle } from "lucide-react";
import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type AnalyticsResponse = {
  repoFullName: string;
  totalReviews: number;
  avgScore: number;
  repoHealthScore: number;
  scoreTrend: { date: string; score: number }[];
  topIssues: { category: string; count: number }[];
  recentReviews: { id: string; prNumber: number; prTitle: string; score: number; grade: string; completedAt: string }[];
};

export default function RepoDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const owner = params.owner as string;
  const repo = params.repo as string;
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!active) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/analytics/${owner}/${repo}`, { cache: "no-store" });
        if (!res.ok) {
          throw new Error(`Failed to load analytics (${res.status})`);
        }
        const json = await res.json();
        if (!active) return;
        setData(json);
        setLastUpdated(new Date());
      } catch (e) {
        if (!active) return;
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        if (!active) return;
        setLoading(false);
      }
    };
    load();

    const id = setInterval(load, 30000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [owner, repo]);

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container mx-auto py-10 px-6">
        <Card className="border-destructive/20 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Analytics Unavailable
            </CardTitle>
            <CardDescription>{error ?? "No data available for this repository."}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-8 space-y-8 max-w-6xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">Repository Analytics</Badge>
            <span className="text-xs text-muted-foreground">{data.repoFullName}</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight mt-2">Quality Dashboard</h1>
          {lastUpdated && (
            <p className="text-xs text-muted-foreground mt-1">
              Auto-refreshing every 30s. Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <Button asChild>
            <Link href={`/repositories/${owner}/${repo}`}>Open PRs</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Repo Health</CardTitle>
          </CardHeader>
          <CardContent className="text-4xl font-black">{data.repoHealthScore.toFixed(1)}/10</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Avg Score (30d)</CardTitle>
          </CardHeader>
          <CardContent className="text-4xl font-black">{data.avgScore.toFixed(1)}/10</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Total Reviews</CardTitle>
          </CardHeader>
          <CardContent className="text-4xl font-black">{data.totalReviews}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Score Trend (30 days)
          </CardTitle>
          <CardDescription>Average review score by day</CardDescription>
        </CardHeader>
        <CardContent className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.scoreTrend}>
              <XAxis dataKey="date" />
              <YAxis domain={[0, 10]} />
              <Tooltip />
              <Line type="monotone" dataKey="score" stroke="#4f46e5" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Top Issues</CardTitle>
            <CardDescription>Most frequent categories</CardDescription>
          </CardHeader>
          <CardContent>
            {data.topIssues.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No findings in the last 30 days. Trigger an automated review to populate analytics.
              </p>
            ) : (
              <ul className="space-y-2">
                {data.topIssues.map((issue) => (
                  <li key={issue.category} className="flex items-center justify-between text-sm">
                    <span className="capitalize">{issue.category}</span>
                    <Badge variant="secondary">{issue.count}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Reviews</CardTitle>
            <CardDescription>Latest PR analyses</CardDescription>
          </CardHeader>
          <CardContent>
            {data.recentReviews.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent reviews yet.</p>
            ) : (
              <ul className="space-y-3">
                {data.recentReviews.map((r) => (
                  <li key={r.id} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="font-semibold break-words">#{r.prNumber} {r.prTitle}</div>
                      <div className="text-xs text-muted-foreground">
                        {r.completedAt ? new Date(r.completedAt).toLocaleString() : "—"}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{r.grade}</Badge>
                      <span className="text-sm font-bold">{r.score.toFixed(1)}</span>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/reviews/${r.id}`}>View</Link>
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
