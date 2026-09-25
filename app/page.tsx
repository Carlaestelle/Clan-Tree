import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";

// A Server Component (no "use client" needed) — it renders entirely on
// the server, so we can call getServerSession directly without any
// loading spinner or extra client-side fetch.
export default async function HomePage() {
  const session = await getServerSession(authOptions);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-8">
      {/* Placeholder styling — this whole page gets redesigned once we
          bring in your reference images. For now it just proves auth,
          routing, and data are wired up correctly. */}
      <h1 className="text-2xl font-semibold">
        Welcome, {session?.user?.name ?? "guest"}
      </h1>

      <div className="flex gap-4">
        <Link href="/tree" className="underline">
          View family tree
        </Link>
        <Link href="/timeline" className="underline">
          View timeline
        </Link>
      </div>
    </main>
  );
}
