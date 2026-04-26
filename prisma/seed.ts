import { PrismaClient, AccountRank, VisitStatus, VisitPurpose, NoteKind, RoutePlanStatus } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";
import Papa from "papaparse";

const prisma = new PrismaClient();

type Row = Record<string, string>;

function readCsv(fileName: string): Row[] {
  const p = path.join(process.cwd(), "demo-data", fileName);
  const text = fs.readFileSync(p, "utf-8");
  const parsed = Papa.parse<Row>(text, { header: true, skipEmptyLines: true });
  if (parsed.errors.length > 0) {
    console.error(`${fileName} parse errors:`, parsed.errors);
  }
  return parsed.data;
}

function parseDate(value?: string): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

function parseNumber(value?: string): number | null {
  if (!value || value === "") return null;
  const n = Number(value);
  return isNaN(n) ? null : n;
}

async function main() {
  console.log("🌱 Seeding database from demo-data/*.csv");

  console.log("→ Clearing existing rows (idempotent reseed)...");
  await prisma.visitNote.deleteMany();
  await prisma.visitAttachment.deleteMany();
  await prisma.visit.deleteMany();
  await prisma.routePlan.deleteMany();
  await prisma.opportunity.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();
  await prisma.geoCache.deleteMany();

  console.log("→ Seeding User");
  const users = readCsv("users.csv");
  for (const u of users) {
    await prisma.user.create({
      data: {
        id: u.user_id,
        email: u.email,
        name: u.name,
        department: u.department || null,
        homeLat: parseNumber(u.home_lat),
        homeLng: parseNumber(u.home_lng),
        homeLabel: u.home_label || null,
      },
    });
  }
  console.log(`  ✓ ${users.length} users`);

  console.log("→ Seeding Account");
  const accounts = readCsv("accounts.csv");
  for (const a of accounts) {
    await prisma.account.create({
      data: {
        id: a.account_id,
        name: a.name,
        nameKana: a.name_kana || null,
        rank: (a.rank || "B") as AccountRank,
        category: a.category || null,
        billingAddress: a.billing_address,
        geoLat: parseNumber(a.geo_lat),
        geoLng: parseNumber(a.geo_lng),
        phone: a.phone || null,
        note: a.note || null,
        lastVisitAt: parseDate(a.last_visit_at),
        ownerId: a.owner_id,
      },
    });
  }
  console.log(`  ✓ ${accounts.length} accounts`);

  console.log("→ Seeding RoutePlan");
  const routePlans = readCsv("route_plans.csv");
  for (const r of routePlans) {
    await prisma.routePlan.create({
      data: {
        id: r.route_plan_id,
        ownerId: r.owner_id,
        planDate: new Date(r.plan_date),
        status: (r.status || "DRAFT") as RoutePlanStatus,
        startLat: Number(r.start_lat),
        startLng: Number(r.start_lng),
        startLabel: r.start_label,
        endLat: Number(r.end_lat),
        endLng: Number(r.end_lng),
        endLabel: r.end_label,
        orderedVisitIds: r.ordered_visit_ids || null,
        totalDistanceM: r.total_distance_m ? Number(r.total_distance_m) : null,
        totalDurationS: r.total_duration_s ? Number(r.total_duration_s) : null,
        optimizedAt: parseDate(r.optimized_at),
      },
    });
  }
  console.log(`  ✓ ${routePlans.length} route plans`);

  console.log("→ Seeding Visit");
  const visits = readCsv("visits.csv");
  for (const v of visits) {
    await prisma.visit.create({
      data: {
        id: v.visit_id,
        accountId: v.account_id,
        ownerId: v.owner_id,
        status: (v.status || "PLANNED") as VisitStatus,
        purpose: v.purpose ? (v.purpose as VisitPurpose) : null,
        scheduledAt: new Date(v.scheduled_at),
        arrivedAt: parseDate(v.arrived_at),
        leftAt: parseDate(v.left_at),
        durationMin: v.duration_min ? Number(v.duration_min) : null,
        arrivedLat: parseNumber(v.arrived_lat),
        arrivedLng: parseNumber(v.arrived_lng),
        routePlanId: v.route_plan_id || null,
      },
    });
  }
  console.log(`  ✓ ${visits.length} visits`);

  console.log("→ Seeding VisitNote");
  const notes = readCsv("visit_notes.csv");
  for (const n of notes) {
    await prisma.visitNote.create({
      data: {
        id: n.note_id,
        visitId: n.visit_id,
        kind: (n.kind || "TEXT_TYPED") as NoteKind,
        body: n.body,
        audioUrl: n.audio_url || null,
        transcribedAt: parseDate(n.transcribed_at),
        extractedNextAction: n.extracted_next_action || null,
        extractedNextActionDate: parseDate(n.extracted_next_action_date),
        promotedToOpportunity: n.promoted_to_opportunity === "TRUE" || n.promoted_to_opportunity === "true",
      },
    });
  }
  console.log(`  ✓ ${notes.length} notes`);

  console.log("✅ Seeding complete");
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
