import http from "node:http";
import crypto from "node:crypto";
import * as queueModule from "../../src/services/queue/analysis.queue";
import * as firebaseAdmin from "../../src/lib/firebase-admin";

const queuePRAnalysis =
  (queueModule as any).queuePRAnalysis || (queueModule as any).default?.queuePRAnalysis;

if (!queuePRAnalysis) {
  throw new Error("queuePRAnalysis export not found from analysis.queue");
}

const PORT = Number(process.env.BACKEND_PORT || 9100);
const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET || "";

function verifySignature(payload: string, signatureHeader: string | null) {
  if (!WEBHOOK_SECRET || !signatureHeader) return false;
  const digest =
    "sha256=" +
    crypto.createHmac("sha256", WEBHOOK_SECRET).update(payload).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signatureHeader));
}

function sendJson(res: http.ServerResponse, status: number, data: any) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

const server = http.createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/health") {
    return sendJson(res, 200, { ok: true });
  }

  if (req.method === "POST" && req.url === "/webhooks/github") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      try {
        firebaseAdmin.initializeFirebaseAdmin();
        const signature = req.headers["x-hub-signature-256"] as string | undefined;
        if (!verifySignature(body, signature ?? null)) {
          return sendJson(res, 401, { error: "Invalid signature" });
        }

        const event = req.headers["x-github-event"] as string | undefined;
        const payload = JSON.parse(body);

        await firebaseAdmin.collections.webhookEvents().add({
          eventType: event,
          repoFullName: payload.repository?.full_name || "unknown",
          payload,
          receivedAt: new Date().toISOString(),
        });

        if (event === "pull_request") {
          const action = payload.action;
          if (["opened", "synchronize", "reopened"].includes(action)) {
            await queuePRAnalysis({
              repoFullName: payload.repository.full_name,
              prNumber: payload.pull_request.number,
              installationId: payload.installation.id,
              commitSha: payload.pull_request.head.sha,
            });
          }
        }

        return sendJson(res, 200, { received: true });
      } catch (error) {
        console.error("Webhook error:", error);
        return sendJson(res, 500, { error: "Webhook processing failed" });
      }
    });
    return;
  }

  sendJson(res, 404, { error: "Not found" });
});

server.listen(PORT, () => {
  console.log(`CodeClarity backend listening on :${PORT}`);
});
