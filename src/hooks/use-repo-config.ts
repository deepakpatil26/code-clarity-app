"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export function useRepoConfig(repoFullName: string | undefined) {
  const { user } = useAuth();

  useEffect(() => {
    if (user && repoFullName) {
      // Register this repo to the user for Pro features
      const saveConfig = async () => {
        try {
          await setDoc(doc(db, "repository_configs", repoFullName.replace(/\//g, "_")), {
            repoFullName,
            userId: user.uid,
            updatedAt: serverTimestamp(),
          }, { merge: true });
        } catch (error) {
          console.error("Error saving repo config:", error);
        }
      };
      saveConfig();
    }
  }, [user, repoFullName]);
}
