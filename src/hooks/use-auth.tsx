"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  PropsWithChildren,
  useCallback,
  useRef,
} from "react";
import {
  onAuthStateChanged,
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  GithubAuthProvider,
  setPersistence,
  browserSessionPersistence,
  Auth,
  getAuth,
  signInWithPopup,
  fetchSignInMethodsForEmail,
  linkWithCredential,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updateProfile,
  updatePassword,
} from "firebase/auth";
import { getFirebaseApp } from "@/lib/firebase";
import { useToast } from "./use-toast";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithEmail: (email: string, pass: string) => Promise<boolean>;
  signUpWithEmail: (email: string, pass: string) => Promise<boolean>;
  signInWithGitHub: () => Promise<boolean>;
  linkGitHubAccount: (password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  getGitHubToken: () => Promise<string | null>;
  pendingCredentialForLinking: React.MutableRefObject<any>;
  updateUserProfile: (name: string) => Promise<boolean>;
  updateUserPassword: (password: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const authRef = useRef<Auth | null>(null);
  const pendingCredentialForLinking = useRef<any>(null);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const app = getFirebaseApp();
    const auth = getAuth(app);
    authRef.current = auth;

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getAuthInstance = () => {
    const auth = authRef.current;
    if (!auth) {
      throw new Error("Auth not initialized");
    }
    return auth;
  };

  const signInWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    const auth = getAuthInstance();
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      toast({
        title: "Success",
        description: "Successfully signed in.",
      });
      setLoading(false);
      return true;
    } catch (error: any) {
      console.error("Sign-in error:", error);
      toast({
        variant: "destructive",
        title: "Authentication Failed",
        description:
          error.message || "Could not sign you in. Please try again.",
      });
      setLoading(false);
      return false;
    }
  };

  const signUpWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    const auth = getAuthInstance();
    try {
      await createUserWithEmailAndPassword(auth, email, pass);
      toast({
        title: "Success",
        description: "Account created successfully. Welcome!",
      });
      setLoading(false);
      return true;
    } catch (error: any) {
      console.error("Sign-up error:", error);
      toast({
        variant: "destructive",
        title: "Sign-up Failed",
        description:
          error.message || "Could not create your account. Please try again.",
      });
      setLoading(false);
      return false;
    }
  };

  const signInWithGitHub = async () => {
    const auth = getAuthInstance();
    setLoading(true);

    const provider = new GithubAuthProvider();
    provider.addScope("repo");
    provider.addScope("user:email");

    try {
      await setPersistence(auth, browserSessionPersistence);
      const result = await signInWithPopup(auth, provider);
      const credential = GithubAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        sessionStorage.setItem("github-token", credential.accessToken);
      }
      toast({
        title: "Success",
        description: "Successfully signed in with GitHub!",
      });
      setUser(result.user);
      router.push("/repositories");
      return true;
    } catch (error: any) {
      console.error("GitHub sign-in error:", error);
      const credential = GithubAuthProvider.credentialFromError(error);

      if (
        error.code === "auth/account-exists-with-different-credential" &&
        credential
      ) {
        pendingCredentialForLinking.current = credential;
        const email = error.customData.email;
        const methods = await fetchSignInMethodsForEmail(auth, email);

        if (methods.includes(EmailAuthProvider.EMAIL_PASSWORD_SIGN_IN_METHOD)) {
          toast({
            variant: "destructive",
            title: "Account Exists",
            description: `You already have an account with ${email}. Please sign in with your password to link your GitHub account.`,
          });
          // The UI will now prompt for password
          return false; // Indicate that the flow is not complete
        }
      }

      let errorMessage = "Could not sign in with GitHub. Please try again.";
      if (error.code === "auth/popup-closed-by-user") {
        errorMessage = "Sign-in was cancelled. Please try again.";
      }
      toast({
        variant: "destructive",
        title: "Authentication Failed",
        description: errorMessage,
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const linkGitHubAccount = async (password: string): Promise<boolean> => {
    const auth = getAuthInstance();
    if (
      !auth.currentUser ||
      !auth.currentUser.email ||
      !pendingCredentialForLinking.current
    ) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          "Could not link accounts. User not signed in or pending credential missing.",
      });
      return false;
    }
    setLoading(true);
    try {
      const emailCredential = EmailAuthProvider.credential(
        auth.currentUser.email,
        password
      );
      await reauthenticateWithCredential(auth.currentUser, emailCredential);
      await linkWithCredential(
        auth.currentUser,
        pendingCredentialForLinking.current
      );

      const tokenCredential = GithubAuthProvider.credentialFromResult({
        user: auth.currentUser,
        providerId: null,
        operationType: "link",
      });
      if (tokenCredential?.accessToken) {
        sessionStorage.setItem("github-token", tokenCredential.accessToken);
      } else {
        const ghProvider = new GithubAuthProvider();
        const result = await signInWithPopup(auth, ghProvider);
        const freshCredential = GithubAuthProvider.credentialFromResult(result);
        if (freshCredential?.accessToken) {
          sessionStorage.setItem("github-token", freshCredential.accessToken);
        }
      }

      toast({
        title: "Success",
        description: "GitHub account linked successfully.",
      });
      pendingCredentialForLinking.current = null;
      router.push("/repositories");
      return true;
    } catch (error: any) {
      console.error("Error linking github account", error);
      toast({
        variant: "destructive",
        title: "Linking Failed",
        description:
          "Could not link GitHub account. Please check your password and try again.",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getGitHubToken = useCallback(async (): Promise<string | null> => {
    return sessionStorage.getItem("github-token");
  }, []);

  const signOut = async () => {
    const auth = getAuthInstance();
    try {
      await firebaseSignOut(auth);
      sessionStorage.removeItem("github-token");
      router.push("/login");
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
      });
    } catch (error) {
      console.error("Sign-out error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to sign out. Please try again.",
      });
    }
  };

  const updateUserProfile = async (name: string) => {
    const auth = getAuthInstance();
    if (!auth.currentUser) return false;
    setLoading(true);
    try {
      await updateProfile(auth.currentUser, { displayName: name });
      setUser({ ...auth.currentUser }); // Trigger a re-render with updated user info
      toast({
        title: "Success",
        description: "Your profile has been updated.",
      });
      return true;
    } catch (error: any) {
      console.error("Update profile error", error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || "Could not update your profile.",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateUserPassword = async (password: string) => {
    const auth = getAuthInstance();
    if (!auth.currentUser) return false;
    setLoading(true);
    try {
      await updatePassword(auth.currentUser, password);
      toast({
        title: "Success",
        description: "Your password has been changed.",
      });
      return true;
    } catch (error: any) {
      console.error("Update password error", error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description:
          error.message ||
          "Could not change your password. You may need to sign in again.",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        signInWithGitHub,
        linkGitHubAccount,
        getGitHubToken,
        pendingCredentialForLinking,
        updateUserProfile,
        updateUserPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
