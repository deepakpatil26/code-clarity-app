import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

export const initializeFirebaseAdmin = () => {
  if (getApps().length === 0) {
    const serviceAccount = JSON.parse(
      process.env.FIREBASE_SERVICE_ACCOUNT_KEY || "{}"
    );

    if (!serviceAccount.project_id) {
      throw new Error(
        "FIREBASE_SERVICE_ACCOUNT_KEY is missing or invalid in .env.local. Please generate a new private key from Firebase Console -> Project Settings -> Service accounts, and add it to your .env.local file."
      );
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

initializeFirebaseAdmin();

// Initialize Firestore
export const db = getFirestore();

// Helper to get collections with types
export const collections = {
  prReviews: () => db.collection("pr_reviews"),
  reviewFindings: () => db.collection("review_findings"),
  repositoryConfigs: () => db.collection("repository_configs"),
  webhookEvents: () => db.collection("webhook_events"),
};
