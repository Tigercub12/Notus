import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifyPassword } from "@/lib/auth/password";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && !process.env.GOOGLE_CLIENT_ID.includes('dummy') 
      ? [GoogleProvider({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        })] 
      : []),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const db = getDb();
        const user = await db.select().from(users).where(eq(users.email, credentials.email as string)).get();

        if (user && user.password_hash) {
          const isValid = await verifyPassword(credentials.password as string, user.password_hash);
          if (isValid) {
            return {
              id: user.id,
              name: user.full_name,
              email: user.email,
            };
          }
        }
        
        return null;
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google' && user.email) {
        try {
          const db = getDb();
          const existing = await db.select().from(users).where(eq(users.email, user.email)).get();
          if (!existing) {
            const newId = crypto.randomUUID();
            await db.insert(users).values({
              id: newId,
              email: user.email,
              full_name: user.name || null,
              avatar_url: user.image || null,
            });
            user.id = newId;
          } else {
            user.id = existing.id;
            // Optionally update avatar/name if changed
            if (user.image && user.image !== existing.avatar_url) {
              await db.update(users).set({ avatar_url: user.image }).where(eq(users.id, existing.id)).run();
            }
          }
        } catch (error) {
          console.error("Error creating OAuth user:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        session.user.email = token.email as string;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.AUTH_SECRET,
  trustHost: true,
});
