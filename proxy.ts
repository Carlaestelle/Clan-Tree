import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Middleware runs BEFORE a page renders, on the edge, for every request
// matched by `config.matcher` below. `withAuth` wraps our logic with
// NextAuth's session check, so `req.nextauth.token` is already
// populated (or null) by the time our callback runs.
export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isChangePasswordPage = req.nextUrl.pathname === "/change-password";

    // If someone must change their password, don't let them wander off
    // to the tree/timeline/etc. first — bounce them straight to the
    // change-password page until it's done. (We still let them reach
    // the change-password page itself, or this would be an infinite
    // redirect loop.)
    if (token?.mustChangePassword && !isChangePasswordPage) {
      return NextResponse.redirect(new URL("/change-password", req.url));
    }

    return NextResponse.next();
  },
  {
    pages: {
      signIn: "/login",
    },
  }
);

// Only run this middleware on the routes that actually need
// protecting. Everything under /login, /api/auth/*, and Next.js's own
// static assets is intentionally excluded — otherwise the login page
// itself would redirect you to... the login page.
export const config = {
  matcher: [
    "/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
