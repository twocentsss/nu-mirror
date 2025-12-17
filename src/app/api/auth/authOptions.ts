import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { verifyPassword, verifyTwoPart } from "@/lib/auth/userStore";
import { initAccountSpreadsheet } from "@/lib/google/accountSpreadsheet";

type JwtToken = {
  user?: any;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  error?: string;
};

async function refreshGoogleAccessToken(token: JwtToken): Promise<JwtToken> {
  try {
    if (!token.refreshToken) {
      return { ...token, error: "NO_REFRESH_TOKEN" };
    }

    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        grant_type: "refresh_token",
        refresh_token: token.refreshToken,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(JSON.stringify(data));
    }

    return {
      ...token,
      accessToken: data.access_token,
      refreshToken: token.refreshToken,
      expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
      error: undefined,
    };
  } catch (error) {
    console.warn("refreshGoogleAccessToken error", error);
    return { ...token, error: "REFRESH_ACCESS_TOKEN_ERROR" };
  }
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          access_type: "offline",
          prompt: "consent select_account",
          scope: "openid email profile https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/spreadsheets",
        },
      },
    }),
    CredentialsProvider({
      name: "Streamforge Login",
      credentials: {
        mode: { label: "Mode", type: "text" },
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
        keyId: { label: "Key ID", type: "text" },
        pin: { label: "PIN", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials) return null;
        const mode = credentials.mode ?? "password";

        if (mode === "password") {
          const user = verifyPassword(credentials.email ?? "", credentials.password ?? "");
          return user ? { id: user.id, email: user.email, name: user.username } : null;
        }

        if (mode === "twopart") {
          const user = verifyTwoPart(credentials.keyId ?? "", credentials.pin ?? "");
          return user ? { id: user.id, email: user.email, name: user.username } : null;
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      const nextToken = token as JwtToken;

      if (user) {
        nextToken.user = user;
      }

      if (account?.provider === "google") {
        nextToken.accessToken = account.access_token;
        nextToken.refreshToken = account.refresh_token;
        nextToken.expiresAt = account.expires_at ? account.expires_at * 1000 : Date.now() + 3600 * 1000;
        return nextToken;
      }

      const isExpired =
        typeof nextToken.expiresAt === "number" && Date.now() > nextToken.expiresAt - 60_000;
      if (nextToken.refreshToken && (isExpired || !nextToken.accessToken)) {
        return refreshGoogleAccessToken(nextToken);
      }

      return nextToken;
    },
    async session({ session, token }) {
      const t = token as JwtToken;
      if (t.user && typeof t.user === "object") {
        session.user = t.user;
      }
      (session as any).accessToken = t.accessToken;
      (session as any).refreshToken = t.refreshToken;
      (session as any).authError = t.error;
      return session;
    },
  },
  events: {
    async signIn({ account, user }) {
      if (account?.provider !== "google") return true;

      const accessToken = account.access_token as string | undefined;
      const refreshToken = account.refresh_token as string | undefined;
      if (!user?.email) return true;

      try {
        await initAccountSpreadsheet({
          accessToken,
          refreshToken,
          userEmail: user.email,
        });
      } catch (error) {
        console.error("initAccountSpreadsheet failed during sign in", error);
        // We don't want to block the login flow, so return true regardless.
      }

      return true;
    },
  },
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET!,
};
