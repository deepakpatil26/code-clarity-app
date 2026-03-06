import { NextRequest, NextResponse } from "next/server";
import { githubAppService } from "@/services/github-app";
import { queuePRAnalysis } from "@/services/queue/analysis.queue";
import { collections } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get("x-hub-signature-256");
    const payload = await req.text();

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }

    // 1. Verify Webhook Signature
    const isValid = await githubAppService.verifyWebhookSignature(payload, signature);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = req.headers.get("x-github-event");
    const body = JSON.parse(payload);

    // 2. Log Webhook Event for Debugging
    await collections.webhookEvents().add({
      eventType: event,
      repoFullName: body.repository?.full_name || "unknown",
      payload: body,
      receivedAt: new Date().toISOString(),
    });

    // 3. Handle Pull Request Events
    if (event === "pull_request") {
      const action = body.action;
      const pr = body.pull_request;

      // Trigger analysis on opened, synchronize (new commits), or reopened
      if (["opened", "synchronize", "reopened"].includes(action)) {
        await queuePRAnalysis({
          repoFullName: body.repository.full_name,
          prNumber: pr.number,
          installationId: body.installation.id,
          commitSha: pr.head.sha,
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
