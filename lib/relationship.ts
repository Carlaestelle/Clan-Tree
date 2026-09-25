import { prisma } from "@/lib/prisma";

// -----------------------------------------------------------------------
// WHAT THIS FILE DOES, IN PLAIN LANGUAGE
// -----------------------------------------------------------------------
// Given "viewer" (the logged-in person) and "target" (whoever's profile
// they're looking at), this figures out a human label like "your
// grandmother" or "your first cousin, once removed".
//
// The trick genealogists use, and the one we use here, is: find the
// closest ANCESTOR that both people share (their "most recent common
// ancestor"), then describe the relationship purely from two numbers:
//   m = how many generations UP from the viewer to that shared ancestor
//   n = how many generations DOWN from that shared ancestor to the target
//
// Once you have (m, n), every family relationship term is just a
// lookup table on those two numbers — that's what classify() below is.
//
// LIMITATION WORTH KNOWING: this only walks blood (parent/child) edges
// to find the common ancestor. It correctly reports direct spouses, but
// it does NOT yet chase "in-law" relationships (e.g. your spouse's
// sibling = your brother/sister-in-law). That's a natural follow-up
// once the core tree is working — flagging it now so it's not a
// surprise later.
// -----------------------------------------------------------------------

type Gender = "MALE" | "FEMALE" | "OTHER" | null;

interface Graph {
  parentsOf: Map<string, string[]>; // personId -> that person's parent ids
  childrenOf: Map<string, string[]>; // personId -> that person's children ids
  spousesOf: Map<string, Set<string>>; // personId -> ids of people they married
  genderOf: Map<string, Gender>;
}

// Pulls every relevant row out of the database ONCE and builds plain
// in-memory lookup maps. At ~100 people this whole graph is tiny (a few
// hundred edges), so we don't need anything fancier than JS Maps and a
// breadth-first search — no need for a graph database here.
export async function buildFamilyGraph(): Promise<Graph> {
  const [people, parentages, marriages] = await Promise.all([
    prisma.person.findMany({ select: { id: true, gender: true } }),
    prisma.parentage.findMany({ select: { parentId: true, childId: true } }),
    prisma.marriage.findMany({ select: { partnerAId: true, partnerBId: true } }),
  ]);

  const parentsOf = new Map<string, string[]>();
  const childrenOf = new Map<string, string[]>();
  const spousesOf = new Map<string, Set<string>>();
  const genderOf = new Map<string, Gender>();

  for (const p of people) {
    parentsOf.set(p.id, []);
    childrenOf.set(p.id, []);
    spousesOf.set(p.id, new Set());
    genderOf.set(p.id, p.gender as Gender);
  }

  for (const edge of parentages) {
    parentsOf.get(edge.childId)?.push(edge.parentId);
    childrenOf.get(edge.parentId)?.push(edge.childId);
  }

  for (const m of marriages) {
    spousesOf.get(m.partnerAId)?.add(m.partnerBId);
    spousesOf.get(m.partnerBId)?.add(m.partnerAId);
  }

  return { parentsOf, childrenOf, spousesOf, genderOf };
}

// Breadth-first search UPWARD from `startId` through the parent edges.
// Returns a map of ancestorId -> generations-above-startId (0 = self,
// 1 = a parent, 2 = a grandparent, ...). We use BFS (not depth-first)
// specifically so that if two different paths reach the same ancestor
// (which happens whenever cousins marry, for instance), we keep the
// SHORTEST distance automatically — BFS visits closer nodes first and
// we skip anything we've already recorded.
function ancestorDistances(startId: string, graph: Graph): Map<string, number> {
  const distances = new Map<string, number>([[startId, 0]]);
  const queue: string[] = [startId];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const currentDistance = distances.get(currentId)!;

    for (const parentId of graph.parentsOf.get(currentId) ?? []) {
      if (!distances.has(parentId)) {
        distances.set(parentId, currentDistance + 1);
        queue.push(parentId);
      }
    }
  }

  return distances;
}

// Turns (m, n, targetGender) into an English label.
//   m = generations from viewer UP to the shared ancestor
//   n = generations from the shared ancestor DOWN to target
function classify(m: number, n: number, targetGender: Gender): string {
  const ordinal = (num: number) => {
    const suffixes = ["th", "st", "nd", "rd"];
    const v = num % 100;
    return num + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
  };

  // Same person.
  if (m === 0 && n === 0) return "you";

  // Direct line: target is an ancestor of viewer (m > 0, n === 0).
  if (n === 0) {
    if (m === 1) return targetGender === "MALE" ? "your father" : targetGender === "FEMALE" ? "your mother" : "your parent";
    if (m === 2) return targetGender === "MALE" ? "your grandfather" : targetGender === "FEMALE" ? "your grandmother" : "your grandparent";
    const greats = "great-".repeat(m - 2);
    return `your ${greats}grand${targetGender === "MALE" ? "father" : targetGender === "FEMALE" ? "mother" : "parent"}`;
  }

  // Direct line: target is a descendant of viewer (m === 0, n > 0).
  if (m === 0) {
    if (n === 1) return targetGender === "MALE" ? "your son" : targetGender === "FEMALE" ? "your daughter" : "your child";
    if (n === 2) return targetGender === "MALE" ? "your grandson" : targetGender === "FEMALE" ? "your granddaughter" : "your grandchild";
    const greats = "great-".repeat(n - 2);
    return `your ${greats}grand${targetGender === "MALE" ? "son" : targetGender === "FEMALE" ? "daughter" : "child"}`;
  }

  // Siblings share a parent directly (m === 1, n === 1).
  if (m === 1 && n === 1) {
    return targetGender === "MALE" ? "your brother" : targetGender === "FEMALE" ? "your sister" : "your sibling";
  }

  // Aunt/uncle: target is m generations up but only 1 generation "over"
  // from a shared ancestor that's a PARENT of the viewer's line, i.e.
  // target is a sibling of one of the viewer's ancestors (n === 1, m > 1).
  if (n === 1 && m > 1) {
    if (m === 2) return targetGender === "MALE" ? "your uncle" : targetGender === "FEMALE" ? "your aunt" : "your aunt/uncle";
    const greats = "great-".repeat(m - 2);
    return `your ${greats}aunt/uncle`;
  }

  // Niece/nephew: mirror image of the above (m === 1, n > 1).
  if (m === 1 && n > 1) {
    if (n === 2) return targetGender === "MALE" ? "your nephew" : targetGender === "FEMALE" ? "your niece" : "your niece/nephew";
    const greats = "great-".repeat(n - 2);
    return `your ${greats}niece/nephew`;
  }

  // Everything else (m > 1 and n > 1) is some flavor of cousin.
  // Degree = how many "greats" back the shared ancestor is beyond
  // grandparent level, on the closer side. Removal = the difference in
  // generation depth between the two sides.
  const degree = Math.min(m, n) - 1; // 1 = first cousin, 2 = second cousin, ...
  const removal = Math.abs(m - n);
  const removedSuffix = removal === 0 ? "" : removal === 1 ? ", once removed" : `, ${removal} times removed`;
  return `your ${ordinal(degree)} cousin${removedSuffix}`;
}

// Public entry point: call this with a viewer id and a target id and get
// back a readable label. Used from the person profile page so it can
// show "your grandmother" instead of the target's raw name-only bio.
export async function describeRelationship(
  viewerId: string,
  targetId: string
): Promise<string> {
  if (viewerId === targetId) return "you";

  const graph = await buildFamilyGraph();

  // Direct marriage check first — it's not a blood relationship, so
  // the ancestor-based math below wouldn't find it on its own.
  if (graph.spousesOf.get(viewerId)?.has(targetId)) {
    return "your spouse";
  }

  const viewerAncestors = ancestorDistances(viewerId, graph);
  const targetAncestors = ancestorDistances(targetId, graph);

  // Find the shared ancestor that minimizes the TOTAL distance
  // (m + n) — that's the "most recent" (closest) common ancestor, which
  // is what genealogical relationship terms are always defined from.
  let best: { ancestorId: string; m: number; n: number } | null = null;

  for (const [ancestorId, m] of viewerAncestors) {
    const n = targetAncestors.get(ancestorId);
    if (n === undefined) continue;
    if (best === null || m + n < best.m + best.n) {
      best = { ancestorId, m, n };
    }
  }

  if (best === null) {
    // No shared blood ancestor found within the recorded tree, and no
    // direct marriage either — most likely someone connected only by
    // marriage further out (e.g. a cousin's spouse), which this first
    // version doesn't attempt to label yet.
    return "related by marriage or not directly connected in the tree";
  }

  const targetGender = graph.genderOf.get(targetId) ?? null;
  return classify(best.m, best.n, targetGender);
}
