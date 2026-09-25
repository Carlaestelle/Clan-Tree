// By default, NextAuth's TypeScript types only know about
// session.user.name/email/image. We added `id`, `username`, and
// `mustChangePassword` in lib/auth.ts's callbacks, so we "merge" our own
// extra fields into NextAuth's types here — this is what makes
// `session.user.username` autocomplete and type-check correctly
// everywhere else in the app, instead of TypeScript flagging it as an
// error or silently treating it as `any`.
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      mustChangePassword: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    username: string;
    mustChangePassword: boolean;
  }
}
