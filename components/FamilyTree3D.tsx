"use client";

import { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Html, Line } from "@react-three/drei";
import { useRouter } from "next/navigation";
import { fullName } from "@/lib/formatName";

interface Person {
  id: string;
  firstName: string;
  lastName?: string | null;
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
      const proposed = currentGeneration + 1;
      generation.set(childId, Math.max(generation.get(childId) ?? 0, proposed));

      const remaining = (inDegreeRemaining.get(childId) ?? 1) - 1;
      inDegreeRemaining.set(childId, remaining);
      if (remaining === 0) {
        queue.push(childId);
      }
    }
  }

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

  const laidOut = useMemo(() => layoutFamilyTree(people, parentages), [people, parentages]);
  const positionById = useMemo(
    () => new Map(laidOut.map((p) => [p.id, p])),
    [laidOut]
  );

  return (
    <div className="h-screen w-screen">
      <Canvas camera={{ position: [0, 0, 20], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <pointLight position={[10, 10, 10]} />

        <OrbitControls enablePan enableZoom enableRotate />

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

        {laidOut.map((p) => (
          <group key={p.id} position={[p.x, p.y, 0]}>
            <mesh onClick={() => router.push(`/person/${p.id}`)}>
              <sphereGeometry args={[0.4, 16, 16]} />
              <meshStandardMaterial color="#4b6fa8" />
            </mesh>
            <Html center distanceFactor={10}>
              <span className="text-xs whitespace-nowrap text-white bg-black/70 px-1 rounded">
                {fullName(p)}
              </span>
            </Html>
          </group>
        ))}
      </Canvas>
    </div>
  );
}