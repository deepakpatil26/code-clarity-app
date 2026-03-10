import { NextRequest, NextResponse } from "next/server";
import { collections, initializeFirebaseAdmin } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import IORedis from "ioredis";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { owner: string; repo: string } }
) {
  initializeFirebaseAdmin();
  const repoFullName = `${params.owner}/${params.repo}`;
  const since = Timestamp.fromDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));

  try {
    const redisUrl = process.env.REDIS_URL;
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    let redis: IORedis | null = null;
    if (redisUrl) {
      redis = new IORedis(redisUrl, { maxRetriesPerRequest: null });

      // Rate limit: 60 requests per minute per IP
      const rateKey = `rate:analytics:${ip}`;
      const rate = await redis.incr(rateKey);
      if (rate === 1) {
        await redis.expire(rateKey, 60);
      }
      if (rate > 60) {
        return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
      }

      // Cache: 30 seconds
      const cacheKey = `cache:analytics:${repoFullName}`;
      const cached = await redis.get(cacheKey);
      if (cached) {
        return NextResponse.json(JSON.parse(cached));
      }
    }

    const reviewsSnap = await collections
      .prReviews()
      .where("repoFullName", "==", repoFullName)
      .get();

    const reviews = reviewsSnap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((r: any) => {
        const ts = r.completedAtTs?.toDate?.() ?? (r.completedAt ? new Date(r.completedAt) : null);
        return ts ? ts >= since.toDate() : false;
      });
    const totalReviews = reviews.length;
    const avgScore =
      totalReviews > 0
        ? reviews.reduce((acc: number, r: any) => acc + (r.score || 0), 0) / totalReviews
        : 0;

    const trendMap = new Map<string, { total: number; count: number }>();
    reviews.forEach((r: any) => {
      const date = r.completedAt
        ? new Date(r.completedAt).toISOString().slice(0, 10)
        : r.completedAtTs?.toDate?.().toISOString().slice(0, 10);
      if (!date) return;
      const cur = trendMap.get(date) || { total: 0, count: 0 };
      cur.total += r.score || 0;
      cur.count += 1;
      trendMap.set(date, cur);
    });

    const scoreTrend = Array.from(trendMap.entries())
      .map(([date, data]) => ({
        date,
        score: Number((data.total / data.count).toFixed(2)),
      }))
      .sort((a, b) => (a.date > b.date ? 1 : -1));

    const findingsSnap = await collections
      .reviewFindings()
      .where("repoFullName", "==", repoFullName)
      .get();

    const issueCounts: Record<string, number> = {};
    findingsSnap.docs.forEach((doc) => {
      const data = doc.data() as any;
      const ts = data.createdAtTs?.toDate?.() ?? (data.createdAt ? new Date(data.createdAt) : null);
      if (!ts || ts < since.toDate()) return;
      const key = data.category || "other";
      issueCounts[key] = (issueCounts[key] || 0) + 1;
    });

    const topIssues = Object.entries(issueCounts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const recentReviews = reviews.slice(0, 10).map((r: any) => ({
      id: r.id,
      prNumber: r.prNumber,
      prTitle: r.prTitle,
      score: r.score,
      grade: r.grade,
      completedAt: r.completedAt,
    }));

    const repoHealthScore =
      reviews.slice(0, 10).reduce((acc: number, r: any) => acc + (r.score || 0), 0) /
      Math.max(1, Math.min(10, reviews.length));

    const payload = {
      repoFullName,
      totalReviews,
      avgScore,
      repoHealthScore: Number(repoHealthScore.toFixed(2)),
      scoreTrend,
      topIssues,
      recentReviews,
    };

    if (redis) {
      const cacheKey = `cache:analytics:${repoFullName}`;
      await redis.set(cacheKey, JSON.stringify(payload), "EX", 30);
    }

    return NextResponse.json(payload);
  } catch (error) {
    console.error("Analytics API error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch analytics";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
