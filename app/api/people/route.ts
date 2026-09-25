import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);

  // Belt-and-suspenders: middleware.ts already blocks unauthenticated
  // requests to most routes, but API routes can be hit directly (e.g.
  // from a script, or if the matcher config ever changes), so we check
  // again here rather than relying on middleware alone.
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const [people, parentages] = await Promise.all([
    prisma.person.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        birthDate: true,
        deathDate: true,
        photoUrl: true,
      },
    }),
    prisma.parentage.findMany({
      select: { parentId: true, childId: true },
    }),
  ]);

  return NextResponse.json({ people, parentages });
}
