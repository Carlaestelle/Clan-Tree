// Run with: npm run seed
//
// This script is a TEMPLATE, not your real family data — it seeds a
// small 5-person example (two grandparents, their child, and two
// grandchildren) so you can confirm the whole pipeline works: usernames
// get generated correctly, passwords get hashed, and parent/child edges
// connect up. Once you're happy with how it behaves, replace the
// `people` array below with your real ~100 people.

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Every family member gets the SAME starting password (you asked for
// this explicitly). It's hashed below, never stored in plain text, and
// `mustChangePassword: true` forces each person to replace it with
// their own on first login (see app/change-password/page.tsx) — so
// this shared word only works for a one-time first sign-in.
const TEMP_PASSWORD = "aparticularword";

// `key` is a short local label that only exists inside THIS script —
// it's how we point at "someone's parent" in plain text below, before
// that person has a real database id yet. It never gets saved to the
// database itself.
interface SeedPerson {
  key: string;
  firstName: string;
  lastName: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  birthDate?: string; // "YYYY-MM-DD"
  deathDate?: string;
  bio?: string;
  parentKeys?: string[]; // 0, 1, or 2 entries, referencing other people's `key`
  spouseKeys?: string[]; // people this person married
}

const people: SeedPerson[] = [
  {
    key: "grandma",
    firstName: "Amina",
    lastName: "Mchome",
    gender: "FEMALE",
    birthDate: "1945-03-12",
    bio: "The clan's matriarch.",
    spouseKeys: ["grandpa"],
  },
  {
    key: "grandpa",
    firstName: "Joseph",
    lastName: "Mchome",
    gender: "MALE",
    birthDate: "1943-07-02",
    deathDate: "2015-01-20",
    spouseKeys: ["grandma"],
  },
  {
    key: "parent",
    firstName: "Grace",
    lastName: "Mchome",
    gender: "FEMALE",
    birthDate: "1970-05-30",
    parentKeys: ["grandma", "grandpa"],
  },
  {
    key: "child1",
    firstName: "Grace",
    lastName: "Achebe", // took a different last name, e.g. via marriage
    gender: "FEMALE",
    birthDate: "1995-09-14",
    parentKeys: ["parent"],
  },
  {
    key: "child2",
    firstName: "Kwame",
    lastName: "Achebe",
    gender: "MALE",
    birthDate: "1998-02-08",
    parentKeys: ["parent"],
  },
];

// Turns "Grace" + "Achebe" into "gracea", then resolves collisions by
// appending 2, 3, 4... — e.g. a second "Grace Achebe" would become
// "gracea2". We saw this exact collision above on purpose (two people
// named "Grace" in the example) so the collision logic actually gets
// exercised when you run this.
function makeUsername(firstName: string, lastName: string, taken: Set<string>): string {
  // firstName in full + lastName's first letter, per what we agreed on.
  const fullBase = firstName.toLowerCase() + lastName[0].toLowerCase();

  let candidate = fullBase;
  let suffix = 2;
  while (taken.has(candidate)) {
    candidate = `${fullBase}${suffix}`;
    suffix += 1;
  }
  taken.add(candidate);
  return candidate;
}

async function main() {
  console.log("Hashing the shared temporary password...");
  const passwordHash = await bcrypt.hash(TEMP_PASSWORD, 10);

  const usedUsernames = new Set<string>();
  const idByKey = new Map<string, string>();

  // --- Pass 1: create every Person row first, with no relations yet.
  // We do relations in a second pass because a child's row references
  // their parent's REAL database id, which doesn't exist until that
  // parent has already been inserted — processing in two passes avoids
  // having to carefully order the array by generation.
  for (const p of people) {
    const username = makeUsername(p.firstName, p.lastName, usedUsernames);

    const created = await prisma.person.create({
      data: {
        firstName: p.firstName,
        lastName: p.lastName,
        username,
        passwordHash,
        mustChangePassword: true,
        gender: p.gender,
        birthDate: p.birthDate ? new Date(p.birthDate) : undefined,
        deathDate: p.deathDate ? new Date(p.deathDate) : undefined,
        bio: p.bio,
      },
    });

    idByKey.set(p.key, created.id);
    console.log(`Created ${p.firstName} ${p.lastName} -> username "${username}"`);
  }

  // --- Pass 2: parent/child edges.
  for (const p of people) {
    for (const parentKey of p.parentKeys ?? []) {
      await prisma.parentage.create({
        data: {
          parentId: idByKey.get(parentKey)!,
          childId: idByKey.get(p.key)!,
        },
      });
    }
  }

  // --- Pass 3: marriages. Each marriage is really one row shared by
  // two people, so we track which pairs we've already inserted (as a
  // sorted, joined string key) to avoid creating the same marriage
  // twice — once from each partner's `spouseKeys` entry.
  const createdMarriages = new Set<string>();
  for (const p of people) {
    for (const spouseKey of p.spouseKeys ?? []) {
      const idA = idByKey.get(p.key)!;
      const idB = idByKey.get(spouseKey)!;
      const pairKey = [idA, idB].sort().join(":");

      if (createdMarriages.has(pairKey)) continue;
      createdMarriages.add(pairKey);

      await prisma.marriage.create({
        data: { partnerAId: idA, partnerBId: idB },
      });
    }
  }

  console.log("\nDone. Everyone's temporary password is:", TEMP_PASSWORD);
  console.log("They'll be forced to change it on first login.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
