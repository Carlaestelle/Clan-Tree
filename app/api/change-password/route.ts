import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  // getServerSession reads the session cookie on the server side — we
  // never trust a "which user is this" id sent from the client body,
  // because that could be tampered with. The only person this request
  // can ever update is whoever is actually logged in.
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { newPassword } = await request.json();

  if (typeof newPassword !== "string" || newPassword.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 }
    );
  }

  // The "10" here is bcrypt's cost factor — how many times it re-hashes
  // internally. Higher = slower to compute but harder to brute-force.
  // 10 is a solid, widely-used default for a project at this scale.
  const passwordHash = await bcrypt.hash(newPassword, 10);

  await prisma.person.update({
    where: { id: session.user.id },
    data: {
      passwordHash,
      mustChangePassword: false,
    },
  });

  return NextResponse.json({ success: true });
}
