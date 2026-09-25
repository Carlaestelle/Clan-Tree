"use client";

import { useState, FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

// This has to be a Client Component ("use client" above) because it
// uses useState (to track the form fields and any error) and calls
// signIn(), a browser-side function that talks to the
// /api/auth/... routes NextAuth set up for us.
export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    // redirect: false means signIn() returns a result object instead
    // of immediately navigating — that lets US decide what happens
    // next (show an error vs. redirect), rather than NextAuth doing an
    // automatic redirect to a generic error page.
    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    setSubmitting(false);

    if (result?.error) {
      setError("That username or password isn't right. Try again.");
      return;
    }

    // Successful login. Send them home — middleware.ts will
    // automatically bounce them to /change-password first if their
    // account still has mustChangePassword set.
    router.push("/");
    router.refresh(); // makes sure server components re-read the new session
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 w-full max-w-sm"
      >
        <h1 className="text-xl font-semibold mb-2">Sign in</h1>

        <label className="flex flex-col gap-1">
          <span className="text-sm">Username</span>
          <input
            className="border rounded px-3 py-2"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm">Password</span>
          <input
            type="password"
            className="border rounded px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="border rounded px-3 py-2 font-medium disabled:opacity-50"
        >
          {submitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </main>
  );
}
