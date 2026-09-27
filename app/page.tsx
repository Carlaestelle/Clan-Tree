import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import NavHotspots from "@/components/NavHotspots";
import Footer from "@/components/Footer";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  return (
    <main className="min-h-screen bg-vignette flex flex-col items-center justify-center gap-16 px-6 py-16 text-signal">
      <div className="text-center flex flex-col gap-3">
        <h1 className="font-display text-4xl sm:text-5xl">
          Welcome, {session?.user?.name ?? "guest"}
        </h1>
        <p className="text-ash text-sm sm:text-base">
          Every branch leads somewhere.
        </p>
      </div>

      <NavHotspots personId={session?.user?.id ?? ""} />
      <Footer />
    </main>
  );
}