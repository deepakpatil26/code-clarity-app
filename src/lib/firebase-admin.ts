import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

export const initializeFirebaseAdmin = () => {
  if (getApps().length === 0) {
    const serviceAccount = JSON.parse(
      process.env.FIREBASE_SERVICE_ACCOUNT_KEY || "{}"
    );

    if (!serviceAccount.project_id) {
      console.warn(
        "Warning: FIREBASE_SERVICE_ACCOUNT_KEY is not set. Authentication may not work properly."
      );
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
