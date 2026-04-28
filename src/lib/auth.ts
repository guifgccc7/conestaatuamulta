import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  checkLoginAllowed,
  recordLoginFailure,
  recordLoginSuccess,
} from "@/lib/rate-limit";
import { logger, AUDIT } from "@/lib/logger";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as never,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Email e Palavra-passe",
      credentials: {
        email:    { label: "Email", type: "email" },
        password: { label: "Palavra-passe", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const identifier = credentials.email.toLowerCase().trim();

        // ── Brute-force protection ───────────────────────────────────────────
        if (!checkLoginAllowed(identifier)) {
          logger.audit("auth", AUDIT.AUTH.LOGIN_LOCKED, { detail: "Account locked after repeated failures" });
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: identifier },
        });

        if (!user?.password) {
          recordLoginFailure(identifier);
          logger.warn("auth", AUDIT.AUTH.LOGIN_FAILURE, { detail: "User not found or no password" });
          return null;
        }

        const passwordMatch = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!passwordMatch) {
          const { locked, attemptsLeft } = recordLoginFailure(identifier);
          logger.warn("auth", AUDIT.AUTH.LOGIN_FAILURE, {
            userId: user.id,
            detail: locked ? "Account locked" : `${attemptsLeft} attempts remaining`,
          });
          return null;
        }

        recordLoginSuccess(identifier);
        logger.audit("auth", AUDIT.AUTH.LOGIN_SUCCESS, { userId: user.id });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as { id?: string }).id = token.id as string;
      }
      return session;
    },
  },
};
