"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

interface MenuItem {
  label: string;
  href?: string;
  action?: () => void;
}

// A persistent menu shown on every page (see app/layout.tsx — it's
// rendered once, outside any specific page, right alongside
// SessionProviderWrapper). Visually: a small button in the corner that,
// when clicked, grows a vertical "spine" downward with each menu item
// branching off it — a smaller, sitewide echo of the home page's
// branching hero nav, but built without hand-plotted SVG curves this
// time (see the comment above the grid trick below for why).
export default function SiteMenu() {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);

  // Nothing useful to link to on /login or /change-password (no one's
  // signed in yet), and "loading" is the brief moment NextAuth is still
  // checking — so in both cases we render nothing at all.
  if (status !== "authenticated" || !session?.user?.id) {
    return null;
  }

  const items: MenuItem[] = [
    { label: "Family tree", href: "/tree" },
    { label: "Timeline", href: "/timeline" },
    { label: "Your page", href: `/person/${session.user.id}` },
    { label: "Sign out", action: () => signOut() },
  ];

  return (
    <div className="fixed top-6 left-6 z-50 font-sans">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-label={isOpen ? "Close menu" : "Open menu"}
        className="h-10 w-10 rounded-full bg-ink/90 backdrop-blur flex items-center justify-center text-signal hover:bg-charcoal transition-colors"
      >
        {/* A trunk splitting into two branches — a small stand-in for a
            hamburger icon that still fits the site's visual language. */}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <line x1="8" y1="14" x2="8" y2="9" />
          <line x1="8" y1="9" x2="3" y2="4" />
          <line x1="8" y1="9" x2="13" y2="4" />
        </svg>
      </button>

      {/* THE "GROW TO FIT CONTENT" TRICK: a grid container whose single
          row track is 0fr when closed and 1fr when open. Percentages
          and "auto" can't be smoothly animated with CSS transitions —
          but `fr` units CAN — so this grows/shrinks to fit however much
          content is inside with no JavaScript measuring of pixel
          heights required. The inner div needs overflow-hidden so
          content doesn't visibly poke out while mid-animation. */}
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-out"
        style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          {/* border-l here IS the vertical "spine" each item branches
              off of — just an ordinary CSS border, not SVG. */}
          <nav className="mt-3 flex flex-col gap-1 border-l border-charcoal pl-4">
            {items.map((item, i) => {
              const row = (
                <span className="relative flex items-center py-1 text-sm text-ash hover:text-signal transition-colors">
                  {/* The short horizontal stub connecting this label
                      back to the spine — poking left out of the row to
                      meet the border-l above. */}
                  <span className="absolute -left-4 top-1/2 h-px w-3 bg-charcoal" />
                  {item.label}
                </span>
              );

              return (
                <div
                  key={item.label}
                  // Staggering each row's fade/slide-in by a few ms per
                  // index (via transitionDelay below) is what creates
                  // the "branches growing one after another" feel,
                  // rather than every item popping in at once.
                  className={`transition-all duration-300 ${
                    isOpen ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"
                  }`}
                  style={{ transitionDelay: isOpen ? `${i * 60}ms` : "0ms" }}
                >
                  {item.action ? (
                    <button type="button" onClick={item.action} className="w-full text-left">
                      {row}
                    </button>
                  ) : (
                    <Link href={item.href!} onClick={() => setIsOpen(false)}>
                      {row}
                    </Link>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}