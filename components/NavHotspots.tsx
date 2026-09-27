"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";

interface Branch {
  label: string;
  href?: string;
  action?: () => void;
  tipX: number;
  tipY: number;
  path: string;
}

export default function NavHotspots({ personId }: { personId: string }) {
  const [litIndex, setLitIndex] = useState<number | null>(null);

  const branches: Branch[] = [
    { label: "Family tree", href: "/tree", tipX: 16, tipY: 20, path: "M 100 60 Q 56 45 32 20" },
    { label: "Timeline", href: "/timeline", tipX: 38, tipY: 6, path: "M 100 60 Q 80 35 76 6" },
    { label: "Your page", href: `/person/${personId}`, tipX: 64, tipY: 6, path: "M 100 60 Q 120 35 128 6" },
    { label: "Sign out", action: () => signOut(), tipX: 86, tipY: 20, path: "M 100 60 Q 144 45 172 20" },
  ];

  return (
    <div className="relative w-full max-w-2xl aspect-[2/1] mx-auto">
      <svg
        viewBox="0 0 200 100"
        aria-hidden="true"
        className="absolute inset-0 w-full h-full"
      >
        <path
          d="M 100 100 L 100 60"
          fill="none"
          stroke="rgb(var(--color-charcoal))"
          strokeWidth={0.6}
          vectorEffect="non-scaling-stroke"
        />

        {branches.map((branch, i) => (
          <path
            key={branch.label}
            d={branch.path}
            fill="none"
            stroke={litIndex === i ? "rgb(var(--color-signal))" : "rgb(var(--color-ash))"}
            strokeWidth={0.6}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            className="transition-[stroke] duration-300"
          />
        ))}

        <circle cx={100} cy={100} r={2.8} fill="rgb(var(--color-charcoal))" />
      </svg>

      {branches.map((branch, i) => {
        const isLit = litIndex === i;
        const commonProps = {
          onMouseEnter: () => setLitIndex(i),
          onMouseLeave: () => setLitIndex(null),
          onFocus: () => setLitIndex(i),
          onBlur: () => setLitIndex(null),
          className: `absolute -translate-x-1/2 -translate-y-full flex flex-col items-center gap-2 font-sans text-sm transition-colors duration-300 ${
            isLit ? "text-signal" : "text-ash"
          }`,
          style: { left: `${branch.tipX}%`, top: `${branch.tipY}%` },
        };

        const node = (
          <span
            className={`block h-2 w-2 rounded-full transition-colors duration-300 ${
              isLit ? "bg-signal" : "bg-ash"
            }`}
          />
        );

        if (branch.action) {
          return (
            <button key={branch.label} type="button" onClick={branch.action} {...commonProps}>
              <span className="order-2">{node}</span>
              <span className="order-1">{branch.label}</span>
            </button>
          );
        }

        return (
          <Link key={branch.label} href={branch.href!} {...commonProps}>
            <span className="order-2">{node}</span>
            <span className="order-1">{branch.label}</span>
          </Link>
        );
      })}
    </div>
  );
}