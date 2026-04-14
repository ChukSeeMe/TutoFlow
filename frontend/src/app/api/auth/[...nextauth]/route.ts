import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import AzureADProvider from "next-auth/providers/azure-ad";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID || "common",
    }),
  ],

  secret: process.env.NEXTAUTH_SECRET,

  callbacks: {
    /**
     * Called on first sign-in (account is set).
     * We call the Teach Harbour backend server-side to get a JWT, then stash it in the token.
     */
    async jwt({ token, account }) {
      if (account) {
        try {
          const backendUrl =
            process.env.BACKEND_INTERNAL_URL || "http://localhost:8000";

          console.log(`[NextAuth] Calling backend at ${backendUrl}/auth/oauth/callback`);

          const res = await fetch(`${backendUrl}/auth/oauth/callback`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: token.email,
              name: token.name,
              provider: account.provider,
              provider_id: account.providerAccountId,
            }),
            signal: AbortSignal.timeout(10_000), // 10 s timeout
          });

          if (res.ok) {
            const data = await res.json();
            token.teachHarbourToken = data.access_token;
            token.teachHarbourRole = data.role;
            console.log(`[NextAuth] Backend sync OK — role: ${data.role}`);
          } else {
            const body = await res.text();
            console.error(`[NextAuth] Backend sync failed ${res.status}: ${body}`);
          }
        } catch (err) {
          console.error("[NextAuth] OAuth backend sync error:", err);
        }
      }
      return token;
    },

    async session({ session, token }) {
      session.teachHarbourToken = token.teachHarbourToken as string | undefined;
      session.teachHarbourRole = token.teachHarbourRole as string | undefined;
      return session;
    },
  },

  pages: {
    signIn: "/login",
  },
});

export { handler as GET, handler as POST };
