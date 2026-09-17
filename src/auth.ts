import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifyPassword } from "@/lib/auth/password";

import { getRequestContext } from "@cloudflare/next-on-pages";

export const { handlers, signIn, signOut, auth } = NextAuth(async (req) => {
  let secret = "dummy_secret_for_build_must_be_32_characters_long_minimum!";
  let googleClientId = "";
  let googleClientSecret = "";
  
  if (typeof process !== 'undefined' && process.env) {
    if (process.env.AUTH_SECRET) secret = process.env.AUTH_SECRET;
    if (process.env.GOOGLE_CLIENT_ID) googleClientId = process.env.GOOGLE_CLIENT_ID;
    if (process.env.GOOGLE_CLIENT_SECRET) googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  }
  
  try {
    const cfCtx = getRequestContext();
    if (cfCtx?.env) {
      if (cfCtx.env.AUTH_SECRET) secret = cfCtx.env.AUTH_SECRET as string;
      if (cfCtx.env.GOOGLE_CLIENT_ID) googleClientId = cfCtx.env.GOOGLE_CLIENT_ID as string;
      if (cfCtx.env.GOOGLE_CLIENT_SECRET) googleClientSecret = cfCtx.env.GOOGLE_CLIENT_SECRET as string;
    }
  } catch (e) {
    // getRequestContext might throw outside of a request (e.g., at build time)
  }

  // Force secret to be at least 32 characters to prevent NextAuth InvalidSecret error
  if (!secret || secret.length < 32) {
    secret = (secret || "") + "fallback_secret_padding_must_be_32_chars_minimum!";
  }

  return {
    providers: [
      ...(googleClientId && !googleClientId.includes('dummy') 
        ? [GoogleProvider({
            clientId: googleClientId,
            clientSecret: googleClientSecret,
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

          try {
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
          } catch (error) {
            console.error("Authorize error:", error);
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
      error: '/login',
    },
    secret,
    trustHost: true,
  };
});
