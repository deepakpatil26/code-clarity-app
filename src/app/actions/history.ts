"use server";

import { db, initializeFirebaseAdmin } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

// Ensure Firebase Admin is initialized
initializeFirebaseAdmin();

export type AnalysisRecord = {
  id?: string;
  userId: string;
  fileName: string;
  language: string;
  code: string;
  suggestions: any[];
  timestamp: Date; // Client-side type
};

export async function saveAnalysis(
  userId: string,
  data: {
    fileName: string;
    language: string;
    code: string;
    suggestions: any[];
  }
) {
  if (!userId) {
    throw new Error("User ID is required");
  }

  try {
    const docRef = await db.collection("analyses").add({
      userId,
      fileName: data.fileName,
      language: data.language,
      code: data.code,
      suggestions: data.suggestions,
      timestamp: Timestamp.now(),
    });

    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error saving analysis:", error);
    return { success: false, error: "Failed to save analysis" };
  }
}

export async function getHistory(userId: string): Promise<AnalysisRecord[]> {
  if (!userId) {
    return [];
  }

  try {
    const snapshot = await db
      .collection("analyses")
      .where("userId", "==", userId)
      .orderBy("timestamp", "desc")
      .limit(20)
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        fileName: data.fileName,
        language: data.language,
        code: data.code,
        suggestions: data.suggestions,
        timestamp: data.timestamp.toDate(),
      };
    });
  } catch (error) {
    console.error("Error fetching history:", error);
    return [];
  }
}
