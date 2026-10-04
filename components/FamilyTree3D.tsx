"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Html, Sky } from "@react-three/drei";
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
  z: number;
}

function hashToUnitFloat(id: string, salt: string): number {
  let hash = 0;
  const combined = id + salt;
  for (let i = 0; i < combined.length; i++) {
    hash = (hash * 31 + combined.charCodeAt(i)) >>> 0;
  }
  return (hash % 1000) / 1000;
}

function layoutFamilyTree(people: Person[], parentages: Parentage[]): LaidOutPerson[] {
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
      if (remaining === 0) queue.push(childId);
    }
  }

  const byGeneration = new Map<number, Person[]>();
  for (const p of people) {
    const g = generation.get(p.id) ?? 0;
    if (!byGeneration.has(g)) byGeneration.set(g, []);
    byGeneration.get(g)!.push(p);
  }

  const VERTICAL_SPACING = 2.4;
  const RADIAL_SPACING = 3.2;
  const laidOut: LaidOutPerson[] = [];

  for (const [g, peopleInGeneration] of byGeneration) {
    if (g === 0) {
      const rowWidth = (peopleInGeneration.length - 1) * 1.2;
      peopleInGeneration.forEach((p, index) => {
        laidOut.push({ ...p, generation: g, x: index * 1.2 - rowWidth / 2, y: 0, z: 0 });
      });
      continue;
    }

    const arcDegrees = Math.min(40 + g * 25, 160);
    const arcRadians = (arcDegrees * Math.PI) / 180;
    const radius = g * RADIAL_SPACING;

    peopleInGeneration.forEach((p, index) => {
      const t = peopleInGeneration.length > 1 ? index / (peopleInGeneration.length - 1) - 0.5 : 0;
      const angle = t * arcRadians;

      const jitterX = (hashToUnitFloat(p.id, "x") - 0.5) * 0.6;
      const jitterY = (hashToUnitFloat(p.id, "y") - 0.5) * 0.4;

      laidOut.push({
        ...p,
        generation: g,
        x: radius * Math.sin(angle) + jitterX,
        y: g * VERTICAL_SPACING + jitterY,
        z: -radius * Math.cos(angle),
      });
    });
  }

  return laidOut;
}

function Branch({
  from,
  to,
  radius,
}: {
  from: [number, number, number];
  to: [number, number, number];
  radius: number;
}) {
  const curve = useMemo(() => {
    const start = new THREE.Vector3(...from);
    const end = new THREE.Vector3(...to);
    const mid = start.clone().lerp(end, 0.5);
    mid.y += Math.abs(end.y - start.y) * 0.2 + 0.2;
    return new THREE.QuadraticBezierCurve3(start, mid, end);
  }, [from, to]);

  return (
    <mesh>
      <tubeGeometry args={[curve, 12, radius, 6, false]} />
      <meshStandardMaterial color="#5c4632" />
    </mesh>
  );
}

function PersonMarker({
  person,
  position,
  onSelect,
}: {
  person: LaidOutPerson;
  position: [number, number, number];
  onSelect: (id: string) => void;
}) {
  return (
    <group position={position} onClick={() => onSelect(person.id)}>
      <mesh position={[0, 0.58, 0]}>
        <sphereGeometry args={[0.2, 12, 12]} />
        <meshStandardMaterial color="#f5f5f3" />
      </mesh>
      <mesh position={[0, 0.2, 0]}>
        <capsuleGeometry args={[0.16, 0.45, 4, 8]} />
        <meshStandardMaterial color="#f5f5f3" />
      </mesh>
      <Html center distanceFactor={12} position={[0, 1.0, 0]}>
        <span className="text-xs whitespace-nowrap text-white bg-black/60 px-1.5 py-0.5 rounded">
          {fullName(person)}
        </span>
      </Html>
    </group>
  );
}

function Kilimanjaro() {
  const mountainShape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-90, 0);
    s.lineTo(-70, 6);
    s.lineTo(-45, 10);
    s.lineTo(-25, 9);
    s.lineTo(-15, 15);
    s.lineTo(-5, 22);
    s.lineTo(5, 16);
    s.lineTo(15, 14);
    s.lineTo(30, 20);
    s.lineTo(45, 26);
    s.lineTo(60, 27);
    s.lineTo(75, 27);
    s.lineTo(85, 20);
    s.lineTo(95, 6);
    s.lineTo(95, 0);
    s.closePath();
    return s;
  }, []);

  const snowCapShape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(55, 25);
    s.lineTo(62, 28);
    s.lineTo(72, 28);
    s.lineTo(80, 24);
    s.lineTo(70, 26);
    s.lineTo(60, 26);
    s.closePath();
    return s;
  }, []);

  const foothillShape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-140, 0);
    s.lineTo(-100, 4);
    s.lineTo(-60, 2);
    s.lineTo(-20, 6);
    s.lineTo(20, 3);
    s.lineTo(60, 7);
    s.lineTo(100, 2);
    s.lineTo(140, 0);
    s.closePath();
    return s;
  }, []);

  return (
    <group>
      <mesh position={[0, 0, -260]} scale={[4.5, 4.5, 1]}>
        <shapeGeometry args={[mountainShape]} />
        <meshBasicMaterial color="#8697a8" fog />
      </mesh>
      <mesh position={[0, 0, -259.9]} scale={[4.5, 4.5, 1]}>
        <shapeGeometry args={[snowCapShape]} />
        <meshBasicMaterial color="#f3f6f8" fog />
      </mesh>
      <mesh position={[0, 0, -120]} scale={[3, 3, 1]}>
        <shapeGeometry args={[foothillShape]} />
        <meshBasicMaterial color="#aebfc9" transparent opacity={0.6} fog />
      </mesh>
    </group>
  );
}

function Trunk({ rootPositions }: { rootPositions: [number, number, number][] }) {
  if (rootPositions.length === 0) return null;

  const centroidX = rootPositions.reduce((sum, p) => sum + p[0], 0) / rootPositions.length;
  const centroidZ = rootPositions.reduce((sum, p) => sum + p[2], 0) / rootPositions.length;
  const trunkTop: [number, number, number] = [centroidX, 0.15, centroidZ];

  return (
    <group>
      <mesh position={[centroidX, -0.85, centroidZ]}>
        <cylinderGeometry args={[0.22, 0.4, 2, 10]} />
        <meshStandardMaterial color="#4a3826" />
      </mesh>
      {rootPositions.map((pos, i) => {
        const distance = Math.hypot(pos[0] - centroidX, pos[2] - centroidZ);
        if (distance < 0.05) return null;
        return <Branch key={i} from={trunkTop} to={pos} radius={0.22} />;
      })}
    </group>
  );
}

export default function FamilyTree3D({
  people,
  parentages,
  viewerPersonId,
}: {
  people: Person[];
  parentages: Parentage[];
  viewerPersonId?: string;
}) {
  const router = useRouter();

  const laidOut = useMemo(() => layoutFamilyTree(people, parentages), [people, parentages]);
  const positionById = useMemo(() => new Map(laidOut.map((p) => [p.id, p])), [laidOut]);
  const rootPositions = useMemo(
    () =>
      laidOut
        .filter((p) => p.generation === 0)
        .map((p): [number, number, number] => [p.x, p.y, p.z]),
    [laidOut]
  );

  const viewerNode = viewerPersonId ? positionById.get(viewerPersonId) : undefined;
  const cameraPosition: [number, number, number] = viewerNode
    ? [viewerNode.x, viewerNode.y + 1.6, viewerNode.z + 6]
    : [0, 8, 20];
  const cameraTarget: [number, number, number] = viewerNode
    ? [viewerNode.x, viewerNode.y + 0.6, viewerNode.z]
    : [0, 4, 0];

  return (
    <div className="h-screen w-screen">
      <Canvas camera={{ position: cameraPosition, fov: 55 }}>
        <fog attach="fog" args={["#bcd4e6", 60, 320]} />
        <Sky sunPosition={[50, 35, -80]} turbidity={2} rayleigh={0.6} mieCoefficient={0.01} mieDirectionalG={0.9} />

        <ambientLight intensity={0.55} />
        <directionalLight position={[50, 40, -30]} intensity={1.1} />

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
          <planeGeometry args={[3000, 3000]} />
          <meshStandardMaterial color="#3f6b35" />
        </mesh>

        <Kilimanjaro />
        <Trunk rootPositions={rootPositions} />

        <OrbitControls target={cameraTarget} enablePan enableZoom enableRotate />

        {parentages.map((edge) => {
          const from = positionById.get(edge.parentId);
          const to = positionById.get(edge.childId);
          if (!from || !to) return null;
          const radius = Math.max(0.18 - from.generation * 0.025, 0.04);
          return (
            <Branch
              key={`${edge.parentId}-${edge.childId}`}
              from={[from.x, from.y, from.z]}
              to={[to.x, to.y, to.z]}
              radius={radius}
            />
          );
        })}

        {laidOut.map((p) => (
          <PersonMarker
            key={p.id}
            person={p}
            position={[p.x, p.y, p.z]}
            onSelect={(id) => router.push(`/person/${id}`)}
          />
        ))}
      </Canvas>
    </div>
  );
}