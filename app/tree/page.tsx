import { prisma } from "@/lib/prisma";
import FamilyTree3D from "@/components/FamilyTree3D";

// Same reasoning as app/timeline/page.tsx: this page's data is live and
// per-request (the whole family tree, fetched fresh), not something
// that should ever be baked in once at build time.
export const dynamic = "force-dynamic";

// Fetching directly with Prisma here (instead of calling our own
// /api/people route over HTTP) because this is a Server Component — it
// already runs on the server, so going through prisma directly is one
// fewer network hop. /api/people still exists separately for any
// future client-side fetching (e.g. a search box that refetches without
// a full page reload).
export default async function TreePage() {
  const [people, parentages] = await Promise.all([
    prisma.person.findMany({
      select: { id: true, firstName: true, lastName: true },
    }),
    prisma.parentage.findMany({
      select: { parentId: true, childId: true },
    }),
  ]);

  return <FamilyTree3D people={people} parentages={parentages} />;
}