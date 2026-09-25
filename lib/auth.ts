import { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// This object is the whole NextAuth setup. We import it in two places:
//   - app/api/auth/[...nextauth]/route.ts, so NextAuth can handle
//     sign-in/sign-out HTTP requests.
//   - anywhere on the server that needs to read "who is logged in?"
//     (via getServerSession(authOptions)).
export const authOptions: NextAuthOptions = {
  // We deliberately do NOT set an `adapter` here (e.g. a Prisma
  // adapter). Adapters make NextAuth store sessions/accounts in their
  // own database tables — that's needed for OAuth providers (Google,
  // GitHub, etc.), but we're doing plain username/password, so we use
  // the simpler JWT session strategy instead: the session data is
  // encoded straight into a signed cookie, no extra tables needed.
  session: {
    strategy: "jwt",
  },

  providers: [
    CredentialsProvider({
      name: "Username and password",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      // `authorize` is called every time someone submits the login
      // form. Return the person object to log them in, or `null` to
      // reject the attempt (NextAuth turns `null` into a generic
      // "invalid credentials" error for us — good, because a specific
      // "that username doesn't exist" message would let someone probe
      // the whitelist of valid usernames).
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        const person = await prisma.person.findUnique({
          where: { username: credentials.username.toLowerCase() },
        });

        if (!person) {
          return null;
        }

        // bcrypt.compare re-hashes the submitted password with the same
        // salt that's embedded in the stored hash, then checks for a
        // match — the plaintext password is never stored or compared
        // directly.
        const passwordMatches = await bcrypt.compare(
          credentials.password,
          person.passwordHash
        );

        if (!passwordMatches) {
          return null;
        }

        // Whatever we return here becomes `user` in the `jwt` callback
        // below. Keep it small — this data gets embedded in the session
        // token that round-trips with every request.
        return {
          id: person.id,
          name: `${person.firstName} ${person.lastName}`,
          username: person.username,
          mustChangePassword: person.mustChangePassword,
        };
      },
    }),
  ],

  callbacks: {
    // Runs whenever a JWT is created or read. We copy the extra fields
    // from `user` (only present right after login) onto the token
    // itself, so they persist across requests without hitting the
    // database again on every page load.
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.username = (user as any).username;
        token.mustChangePassword = (user as any).mustChangePassword;
      }

      // `trigger === "update"` fires when the client calls the
      // `update()` function from useSession() (see
      // app/change-password/page.tsx). Without this, the JWT would
      // keep saying mustChangePassword: true — cached from sign-in
      // time — until the person logged out and back in again, even
      // though the database was already updated.
      if (trigger === "update" && session?.mustChangePassword !== undefined) {
        token.mustChangePassword = session.mustChangePassword;
      }

      return token;
    },
    // Runs whenever a component/server calls useSession()/getServerSession().
    // We copy fields from the token onto `session.user` so the rest of
    // the app has a nicely-typed place to read them from.
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.mustChangePassword = token.mustChangePassword as boolean;
      }
      return session;
    },
  },

  pages: {
    // Tells NextAuth to use our own login page instead of its built-in
    // default one, so we can style it to match the rest of the app.
    signIn: "/login",
  },
};
