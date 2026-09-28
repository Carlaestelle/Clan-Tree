// Run with: npm run import -- path/to/family-data-template.xlsx

import { PrismaClient, Era } from "@prisma/client";
import bcrypt from "bcryptjs";
import * as XLSX from "@e965/xlsx";

const prisma = new PrismaClient();
const TEMP_PASSWORD = "aparticularword";

interface PersonRow {
  Key: string;
  FirstName: string;
  LastName: string;
  Gender?: string;
  BirthDate?: string;
  DeathDate?: string;
  Bio?: string;
  Parent1Key?: string;
  Parent2Key?: string;
  SpouseKeys?: string;
}

interface TimelineRow {
  Title: string;
  Description?: string;
  EventDate?: string;
  Era?: string;
  PersonKey?: string;
  SortOrder?: number;
}

function makeUsername(firstName: string, lastName: string, taken: Set<string>): string {
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

function parseDate(value: unknown): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function splitKeys(value?: string): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((k) => k.trim())
    .filter((k) => k.length > 0);
}

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Usage: npm run import -- path/to/family-data-template.xlsx");
    process.exit(1);
  }

  const workbook = XLSX.readFile(filePath);

  const peopleSheet = workbook.Sheets["People"];
  const timelineSheet = workbook.Sheets["Timeline"];
  if (!peopleSheet) {
    console.error('No sheet named "People" found — check the tab name matches exactly.');
    process.exit(1);
  }

  const personRows = XLSX.utils.sheet_to_json<PersonRow>(peopleSheet).filter(
    (row) => row.Key && row.Key !== "amina"
  );

  console.log(`Found ${personRows.length} people to import.`);

  const passwordHash = await bcrypt.hash(TEMP_PASSWORD, 10);
  const usedUsernames = new Set<string>();
  const idByKey = new Map<string, string>();

  for (const row of personRows) {
    if (!row.Key || !row.FirstName || !row.LastName) {
      console.warn(`Skipping a row missing Key/FirstName/LastName:`, row);
      continue;
    }

    const genderRaw = row.Gender?.trim().toUpperCase();
    const gender =
      genderRaw === "M" ? "MALE" : genderRaw === "F" ? "FEMALE" : genderRaw === "O" ? "OTHER" : undefined;

    const username = makeUsername(row.FirstName, row.LastName, usedUsernames);

    const created = await prisma.person.create({
      data: {
        firstName: row.FirstName,
        lastName: row.LastName,
        username,
        passwordHash,
        mustChangePassword: true,
        gender,
        birthDate: parseDate(row.BirthDate),
        deathDate: parseDate(row.DeathDate),
        bio: row.Bio,
      },
    });

    idByKey.set(row.Key, created.id);
    console.log(`  ${row.FirstName} ${row.LastName} -> username "${username}"`);
  }

  for (const row of personRows) {
    if (!row.Key || !idByKey.has(row.Key)) continue;
    const childId = idByKey.get(row.Key)!;

    for (const parentKey of [row.Parent1Key, row.Parent2Key]) {
      if (!parentKey) continue;
      const parentId = idByKey.get(parentKey.trim());
      if (!parentId) {
        console.warn(`  Row "${row.Key}": parent key "${parentKey}" not found — skipping that link.`);
        continue;
      }
      await prisma.parentage.create({ data: { parentId, childId } });
    }
  }

  const createdMarriages = new Set<string>();
  for (const row of personRows) {
    if (!row.Key || !idByKey.has(row.Key)) continue;
    const idA = idByKey.get(row.Key)!;

    for (const spouseKey of splitKeys(row.SpouseKeys)) {
      const idB = idByKey.get(spouseKey);
      if (!idB) {
        console.warn(`  Row "${row.Key}": spouse key "${spouseKey}" not found — skipping.`);
        continue;
      }
      const pairKey = [idA, idB].sort().join(":");
      if (createdMarriages.has(pairKey)) continue;
      createdMarriages.add(pairKey);

      await prisma.marriage.create({ data: { partnerAId: idA, partnerBId: idB } });
    }
  }

  if (timelineSheet) {
    const eventRows = XLSX.utils.sheet_to_json<TimelineRow>(timelineSheet).filter(
      (row) => row.Title && row.Title !== "Family arrives in Dar es Salaam"
    );

    console.log(`Found ${eventRows.length} timeline events to import.`);

    for (const row of eventRows) {
      const eventDate = parseDate(row.EventDate) ?? new Date();
      const era: Era = row.Era?.trim().toUpperCase() === "OLDER" ? "OLDER" : "MODERN";
      const personId = row.PersonKey ? idByKey.get(row.PersonKey.trim()) : undefined;

      await prisma.timelineEvent.create({
        data: {
          title: row.Title,
          description: row.Description ?? "",
          eventDate,
          era,
          personId,
          sortOrder: row.SortOrder ?? 0,
        },
      });
    }
  }

  console.log("\nDone. Everyone's temporary password is:", TEMP_PASSWORD);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });