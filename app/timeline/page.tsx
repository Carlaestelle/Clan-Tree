import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic'; //to remove error on Vercel deployment:
export default async function TimelinePage() {
  const events = await prisma.timelineEvent.findMany({
    orderBy: [{ eventDate: "asc" }, { sortOrder: "asc" }],
  });

  return (
    <main className="max-w-2xl mx-auto p-8 flex flex-col gap-8">
      <h1 className="text-2xl font-semibold">History</h1>

      {/* This is intentionally a plain list for now — no styling
          split between "older" and "modern" eras yet, and no GSAP
          ScrollTrigger reveal animation yet either. Both of your
          timeline reference images imply per-era visual treatments;
          once the schema and data are confirmed working, this is
          where we'll branch rendering by `event.era` and wire up the
          scroll-triggered reveal. */}
      <ol className="flex flex-col gap-6">
        {events.map((event) => (
          <li key={event.id} className="border-l-2 pl-4">
            <p className="text-sm text-gray-500">
              {event.eventDate.toDateString()} · {event.era}
            </p>
            <h2 className="font-medium">{event.title}</h2>
            <p className="text-sm">{event.description}</p>
          </li>
        ))}
      </ol>
    </main>
  );
}
