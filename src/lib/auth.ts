import { NextAuthOptions } from "next-auth";
import { FirestoreAdapter } from "@auth/firebase-adapter";
import { cert } from "firebase-admin/app";
import { Adapter } from "next-auth/adapters";
import { getFirestore } from "firebase-admin/firestore";
import { initializeFirebaseAdmin } from "./firebase-admin";
import { getApp } from "firebase-admin/app";

// Initialize Firebase Admin if not already initialized
try {
  getApp();
} catch (e) {
  initializeFirebaseAdmin();
}

export const authOptions: NextAuthOptions = {
  providers: [
    {
      id: "github",
      name: "GitHub",
      type: "oauth",
      authorization: {
        url: "https://github.com/login/oauth/authorize",
        params: {
          scope: "repo, user:email",
        },
      },
      token: "https://github.com/login/oauth/access_token",
      userinfo: {
        url: "https://api.github.com/user",
        async request({ client, tokens }): Promise<any> {
          const profile = await client.userinfo(tokens.access_token!);
          if (!profile.email) {
            // If the user does not have a public email, get their primary email from GitHub
            const emails = await (
              await fetch("https://api.github.com/user/emails", {
                headers: { Authorization: `token ${tokens.access_token}` },
              })
            ).json();
            if (emails?.length > 0) {
              // Find the primary email
              const primaryEmail =
                emails.find((e: any) => e.primary)?.email || emails[0].email;
              return { ...profile, email: primaryEmail };
            }
          }
          return profile;
        },
      },
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
      profile(profile: any) {
        return {
          id: profile.id.toString(),
          name: profile.name || profile.login,
          email: profile.email,
          image: profile.avatar_url,
          login: profile.login,
        };
      },
    },
  ],
  callbacks: {
    async jwt({ token, account, profile }: any) {
      // Initial sign in
      if (account && profile) {
        token.accessToken = account.access_token;
        token.id = profile.id;
        token.login = profile.login;
      }
      return token;
    },
    async session({ session, token }: any) {
      // Send properties to the client, like an access_token from a provider.
      session.accessToken = token.accessToken as string;
      session.user.id = token.id as string;
      session.user.login = token.login as string;
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  adapter: FirestoreAdapter(getFirestore()) as unknown as Adapter,
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      login?: string;
    };
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    login?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    id?: string;
    login?: string;
  }
}
