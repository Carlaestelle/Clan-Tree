import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// This one file handles every auth-related URL: /api/auth/signin,
// /api/auth/callback/credentials, /api/auth/signout, /api/auth/session,
// etc. — NextAuth's `[...nextauth]` catch-all route reads the segment
// after /api/auth/ and routes internally, so we never write those
// handlers ourselves.
const handler = NextAuth(authOptions);

// The App Router requires us to export a function per HTTP method we
// support; NextAuth's handler works for both.
export { handler as GET, handler as POST };
