"use client";

import { SessionProvider } from "next-auth/react";

// Why this tiny file needs to exist:
//
// Next.js's App Router renders everything as a Server Component by
// default. NextAuth's <SessionProvider> uses React context, and React
// context requires a Client Component. Rather than marking our whole
// root layout "use client" (which would turn the ENTIRE app into
// client-rendered code — expensive, and unnecessary), we isolate the
// "use client" boundary to just this one wrapper, and use it once in
// app/layout.tsx around {children}.
export default function SessionProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SessionProvider>{children}</SessionProvider>;
}
