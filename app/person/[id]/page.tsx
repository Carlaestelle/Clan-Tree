import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { describeRelationship } from "@/lib/relationship";

export default async function PersonPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  const person = await prisma.person.findUnique({
    where: { id: params.id },
  });

  // Next.js's notFound() renders the nearest not-found.tsx (or a
  // built-in 404 if we haven't added one yet) instead of crashing with
  // a raw error if someone visits a bad/old profile URL.
  if (!person) {
    notFound();
  }

  // session is guaranteed non-null here because middleware.ts already
  // requires auth for every route except /login — but TypeScript
  // doesn't know that, so we still guard for it defensively.
  const relationship = session?.user?.id
    ? await describeRelationship(session.user.id, person.id)
    : null;

  return (
    <main className="max-w-xl mx-auto p-8 flex flex-col gap-4">
      {/* Placeholder layout — this is the page your "about me" /
          "biography" reference images are for. Once we lock in that
          design, the photo, name, and bio below get the real
          collage/editorial treatment instead of plain stacked text. */}
      <h1 className="text-2xl font-semibold">
        {person.firstName} {person.lastName}
      </h1>

      {relationship && (
        <p className="text-sm text-gray-500 italic">
          Relationship to you: {relationship}
        </p>
      )}

      {person.photoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={person.photoUrl}
          alt={`${person.firstName} ${person.lastName}`}
          className="w-48 h-48 object-cover rounded"
        />
      )}

      <p>{person.bio ?? "No biography written yet."}</p>
    </main>
  );
}
