import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import FamilyTree3D from "@/components/FamilyTree3D";

export const dynamic = "force-dynamic";

export default async function TreePage() {
  const session = await getServerSession(authOptions);

  const [people, parentages] = await Promise.all([
    prisma.person.findMany({
      select: { id: true, firstName: true, lastName: true },
    }),
    prisma.parentage.findMany({
      select: { parentId: true, childId: true },
    }),
  ]);

  return (
    <FamilyTree3D
      people={people}
      parentages={parentages}
      viewerPersonId={session?.user?.id}
    />
  );
}