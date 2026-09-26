"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import PasswordInput from "@/components/PasswordInput";

export default function ChangePasswordPage() {
  const router = useRouter();
  const { update } = useSession();
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (newPassword !== confirm) {
      setError("Those two passwords don't match.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newPassword }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const body = await res.json();
      setError(body.error ?? "Something went wrong.");
      return;
    }

    await update({ mustChangePassword: false });
    router.push("/");
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 w-full max-w-sm"
      >
        <h1 className="text-xl font-semibold mb-2">Choose a new password</h1>
        <p className="text-sm text-gray-600">
          This is a shared/temporary password's first use — set something
          only you know.
        </p>

        <label className="flex flex-col gap-1">
          <span className="text-sm">New password</span>
          <PasswordInput
            value={newPassword}
            onChange={setNewPassword}
            minLength={8}
            required
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm">Confirm new password</span>
          <PasswordInput
            value={confirm}
            onChange={setConfirm}
            minLength={8}
            required
          />
        </label>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="border rounded px-3 py-2 font-medium disabled:opacity-50"
        >
          {submitting ? "Saving..." : "Save password"}
        </button>
      </form>
    </main>
  );
}