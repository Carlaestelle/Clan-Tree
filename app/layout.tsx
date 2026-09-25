import type { Metadata } from "next";
import "./globals.css";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";

export const metadata: Metadata = {
  title: "The Clan",
  description: "Family tree, history, and stories.",
};

// The root layout wraps EVERY page in the app — it's the one place a
// <html>/<body> tag is allowed to live in the App Router. Anything
// rendered here (the SessionProviderWrapper, eventually a nav bar)
// shows up on every route without us repeating it per-page.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <SessionProviderWrapper>{children}</SessionProviderWrapper>
      </body>
    </html>
  );
}
