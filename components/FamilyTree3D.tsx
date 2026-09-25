"use client";

import { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Html, Line } from "@react-three/drei";
import { useRouter } from "next/navigation";

interface Person {
  id: string;
  firstName: string;
  lastName: string;
}

interface Parentage {
  parentId: string;
  childId: string;
}

interface LaidOutPerson extends Person {
  generation: number;
  x: number;
  y: number;
}

// -----------------------------------------------------------------------
// LAYOUT ALGORITHM
// -----------------------------------------------------------------------
// A family tree, mathematically, is a directed acyclic graph (a "DAG") —
// edges only ever point from parent to child, never in a loop. To draw
// it, we need two things for every person: which GENERATION (row) they
// belong to, and where in that row to place them horizontally.
//
// Generation: we use a classic technique for DAGs called Kahn's
// algorithm (topological sort). The idea: a person's generation is
// always exactly one more than the DEEPEST (max) generation of their
// parents. People with no recorded parents are generation 0 (the
// tree's roots). We process people in an order where we only compute
// someone's generation once all of THEIR parents' generations are
// already known — that's what the "in-degree" queue below achieves.
//
// Horizontal position: within a generation, we just place people
// left-to-right in the order we encounter them, evenly spaced. This is
// intentionally simple for a first version — it does NOT try to keep
// each nuclear family visually clustered together, which is the #1
// thing worth improving once ~100 real people are loaded and we can
// see where it looks cluttered.
function layoutFamilyTree(
  people: Person[],
  parentages: Parentage[]
): LaidOutPerson[] {
  const parentsOf = new Map<string, string[]>();
  const childrenOf = new Map<string, string[]>();

  for (const p of people) {
    parentsOf.set(p.id, []);
    childrenOf.set(p.id, []);
  }
  for (const edge of parentages) {
    parentsOf.get(edge.childId)?.push(edge.parentId);
    childrenOf.get(edge.parentId)?.push(edge.childId);
  }

  const generation = new Map<string, number>();
  const inDegreeRemaining = new Map<string, number>();
  const queue: string[] = [];

  for (const p of people) {
    const parentCount = parentsOf.get(p.id)?.length ?? 0;
    inDegreeRemaining.set(p.id, parentCount);
    if (parentCount === 0) {
      generation.set(p.id, 0);
      queue.push(p.id);
    }
  }

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const currentGeneration = generation.get(currentId)!;

    for (const childId of childrenOf.get(currentId) ?? []) {
      // A child's generation is 1 + the MAX of all its parents'
      // generations, so we only finalize it once we've seen all
      // parents — that's what this countdown tracks.
      const proposed = currentGeneration + 1;
      generation.set(childId, Math.max(generation.get(childId) ?? 0, proposed));

      const remaining = (inDegreeRemaining.get(childId) ?? 1) - 1;
      inDegreeRemaining.set(childId, remaining);
      if (remaining === 0) {
        queue.push(childId);
      }
    }
  }

  // Group people by their now-known generation so we can space each
  // row out horizontally.
  const byGeneration = new Map<number, Person[]>();
  for (const p of people) {
    const g = generation.get(p.id) ?? 0;
    if (!byGeneration.has(g)) byGeneration.set(g, []);
    byGeneration.get(g)!.push(p);
  }

  const HORIZONTAL_SPACING = 2.5;
  const VERTICAL_SPACING = 3;
  const laidOut: LaidOutPerson[] = [];

  for (const [g, peopleInGeneration] of byGeneration) {
    const rowWidth = (peopleInGeneration.length - 1) * HORIZONTAL_SPACING;
    peopleInGeneration.forEach((p, index) => {
      laidOut.push({
        ...p,
        generation: g,
        x: index * HORIZONTAL_SPACING - rowWidth / 2,
        // Negative so generation 0 (oldest) renders at the top and
        // later generations descend, matching how family trees are
        // conventionally read.
        y: -g * VERTICAL_SPACING,
      });
    });
  }

  return laidOut;
}

export default function FamilyTree3D({
  people,
  parentages,
}: {
  people: Person[];
  parentages: Parentage[];
}) {
  const router = useRouter();

  // useMemo so we only re-run the layout math when the underlying data
  // changes, not on every re-render (e.g. every camera drag).
  const laidOut = useMemo(() => layoutFamilyTree(people, parentages), [people, parentages]);
  const positionById = useMemo(
    () => new Map(laidOut.map((p) => [p.id, p])),
    [laidOut]
  );

  return (
    <Canvas camera={{ position: [0, 0, 20], fov: 50 }} className="h-screen w-screen">
      {/* Basic lighting — without at least one light, standard Three.js
          materials render pure black. This is placeholder lighting;
          the real design pass will art-direct this properly. */}
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 10, 10]} />

      {/* OrbitControls gives free mouse-drag rotate / scroll zoom for
          free — essential for exploring a 3D tree instead of being
          stuck with one fixed camera angle. */}
      <OrbitControls enablePan enableZoom enableRotate />

      {/* One line per parent -> child edge, drawn AFTER computing
          layout so we know both endpoints' coordinates. */}
      {parentages.map((edge) => {
        const from = positionById.get(edge.parentId);
        const to = positionById.get(edge.childId);
        if (!from || !to) return null;
        return (
          <Line
            key={`${edge.parentId}-${edge.childId}`}
            points={[
              [from.x, from.y, 0],
              [to.x, to.y, 0],
            ]}
            color="gray"
            lineWidth={1}
          />
        );
      })}

      {/* One node per person. A simple sphere for now — swap this mesh
          out for a photo-textured card once we bring in the real
          per-person design. Html lets us drop ordinary DOM (styled
          with Tailwind) INSIDE the 3D scene, positioned to follow the
          3D coordinates — much easier than drawing text with Three.js
          primitives. */}
      {laidOut.map((p) => (
        <group key={p.id} position={[p.x, p.y, 0]}>
          <mesh
            onClick={() => router.push(`/person/${p.id}`)}
          >
            <sphereGeometry args={[0.4, 16, 16]} />
            <meshStandardMaterial color="#4b6fa8" />
          </mesh>
          <Html center distanceFactor={10}>
            <span className="text-xs whitespace-nowrap text-white bg-black/70 px-1 rounded">
              {p.firstName} {p.lastName}
            </span>
          </Html>
        </group>
      ))}
    </Canvas>
  );
}
