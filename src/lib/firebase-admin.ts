import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

export const initializeFirebaseAdmin = () => {
  if (getApps().length === 0) {
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    
    if (!serviceAccountKey) {
      // During build, we might not have this. Don't throw here.
      // Throw only if we actually try to use the DB and it's missing.
      return;
    }

    const serviceAccount = JSON.parse(serviceAccountKey);

    if (!serviceAccount.project_id) {
      return;
    }

    try {
      initializeApp({
        credential: cert(serviceAccount as any),
        databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`,
      });
      console.log("Firebase Admin initialized successfully");
    } catch (error) {
      console.error("Firebase admin initialization error:", error);
    }
  }
};

// Initialize Firestore
export const db = getFirestore();

// Helper to get collections with types
export const collections = {
  prReviews: () => db.collection("pr_reviews"),
  reviewFindings: () => db.collection("review_findings"),
  repositoryConfigs: () => db.collection("repository_configs"),
  webhookEvents: () => db.collection("webhook_events"),
};
