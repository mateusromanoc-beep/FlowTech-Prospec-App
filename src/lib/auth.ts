import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "./db";
import { users } from "./schema";
import { eq } from "drizzle-orm";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) return null;

        // Note: Em produção, usar bcrypt para comparar senhas
        const [user] = await db.select().from(users).where(eq(users.email, credentials.email as string));

        if (user && user.password === credentials.password) {
          return { id: user.id.toString(), name: user.name, email: user.email, role: user.role };
        }

        return null;
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname === "/";
      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false; // Redireciona para login
      } else if (isLoggedIn) {
        return Response.redirect(new URL("/", nextUrl));
      }
      return true;
    },
  },
});
