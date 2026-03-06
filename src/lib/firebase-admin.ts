import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let adminApp: App | null = null;
let firestoreDb: Firestore | null = null;

export const initializeFirebaseAdmin = () => {
  if (getApps().length > 0) {
    adminApp = getApps()[0];
    return;
  }

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  
  if (!serviceAccountKey) {
    // During build or if missing, don't throw yet.
    return;
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountKey);
    adminApp = initializeApp({
      credential: cert(serviceAccount as any),
      databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`,
    });
    console.log("Firebase Admin initialized successfully");
  } catch (error) {
    console.error("Firebase admin initialization error:", error);
  }
};

export const getDb = (): Firestore => {
  if (!firestoreDb) {
    initializeFirebaseAdmin();
    firestoreDb = getFirestore();
  }
  return firestoreDb;
};

// Helper to get collections with types
// These are now functions that call getDb() to ensure lazy initialization
export const collections = {
  prReviews: () => getDb().collection("pr_reviews"),
  reviewFindings: () => getDb().collection("review_findings"),
  repositoryConfigs: () => getDb().collection("repository_configs"),
  webhookEvents: () => getDb().collection("webhook_events"),
};
