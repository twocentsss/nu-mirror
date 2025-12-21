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
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope: "https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/spreadsheets"
        }
      }
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
        console.log("[Auth] Google callback scope:", account.scope);
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
      if (account?.provider !== "google") return;

      const accessToken = account.access_token as string | undefined;
      const refreshToken = account.refresh_token as string | undefined;
      if (!user?.email) return;

      if (!user?.email) return;

      // BACKGROUND INITIALIZATION
      // We do not await this to prevent blocking the sign-in flow if external APIs (Google/DB) are slow or failing.
      // This ensures the user gets into the app immediately. Resources will hydrate in parallel.
      (async () => {
        try {
          await initAccountSpreadsheet({
            accessToken,
            refreshToken,
            userEmail: user.email!,
          });
        } catch (error) {
          console.warn("Spreadsheet Init Warning (Async):", error);
        }

        // Initialize Postgres Trial Schema on SSO (Self-healing DB)
        try {
          const storageUrl = process.env.DATABASE_URL;
          if (storageUrl) {
            const { getSqlClient, getTenantSchema, ensureTenantSchema, ensureGlobalSchema } = await import("@/lib/events/client");
            const sql = getSqlClient(storageUrl);

            // 1. Ensure Global Protocol Tables (Goals, Projects)
            await ensureGlobalSchema(sql);

            // 2. Ensure Tenant Schema (Event Log, Goals, Projects)
            const schema = getTenantSchema(user.email!);
            await ensureTenantSchema(sql, schema);

            // 3. Seed Default Goals & Projects (Quarterly/Monthly)
            const { seedDefaultsForUser } = await import("@/lib/cogos/seed");
            await seedDefaultsForUser(user.email!);
          }
        } catch (error) {
          console.error("Postgres Schema/Seed Critical Error (Async):", error);
        }
      })();

      return;
    },
  },
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET!,
};
