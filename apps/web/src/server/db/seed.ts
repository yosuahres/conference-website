/**
 * Development seed: one conference with tracks, pages, tiers and a schedule.
 * Safe to re-run — it deletes the seeded conference first and cascades.
 *
 *   pnpm db:seed
 */
import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

config({ path: ".env" });
config({ path: ".env.local", override: true });

const SLUG = "icrst-demo";

/**
 * All dates are relative to the day you seed, so the demo conference is always
 * mid-cycle: submissions open, deadline a month out, conference next year. A
 * fixed calendar would silently expire and every page would render "closed".
 */
const DAY = 86_400_000;
const seededAt = new Date();

function inDays(days: number, time = "23:59") {
  const date = new Date(seededAt.getTime() + days * DAY);
  const [hours, minutes] = time.split(":").map(Number);
  date.setHours(hours!, minutes!, 0, 0);
  return date;
}

function dateOnly(days: number) {
  return new Date(seededAt.getTime() + days * DAY).toISOString().slice(0, 10);
}

/** Combines a day offset with a wall-clock time, for schedule rows. */
function dayAt(days: number, time: string) {
  return inDays(days, time);
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set.");

  const client = postgres(url, { max: 1 });
  const db = drizzle(client, { schema });

  console.log("Seeding…");

  await db.delete(schema.conferences).where(eq(schema.conferences.slug, SLUG));

  // Only one conference may be active, and the seeded one is about to claim it.
  await db
    .update(schema.conferences)
    .set({ isActive: false })
    .where(eq(schema.conferences.isActive, true));

  const [conference] = await db
    .insert(schema.conferences)
    .values({
      slug: SLUG,
      name: "International Conference on Research, Science and Technology",
      shortName: "ICRST",
      edition: "4th Edition",
      tagline:
        "Bridging research and practice across science, engineering and society.",
      description:
        "ICRST brings together researchers, practitioners and students for " +
        "three days of paper presentations, keynotes and workshops. Accepted " +
        "papers are published in the conference proceedings.",
      startsOn: dateOnly(150),
      endsOn: dateOnly(152),
      venueName: "Universitas Indonesia Convention Hall",
      venueAddress: "Jl. Margonda Raya, Pondok Cina, Beji",
      city: "Depok",
      country: "Indonesia",
      timezone: "Asia/Jakarta",
      submissionOpensAt: inDays(-60, "00:00"),
      submissionDeadline: inDays(30),
      notificationDate: inDays(75, "00:00"),
      cameraReadyDeadline: inDays(100),
      registrationDeadline: inDays(130),
      contactEmail: "secretariat@icrst.example.id",
      isActive: true,
    })
    .returning();

  const conferenceId = conference!.id;

  await db.insert(schema.tracks).values(
    [
      [
        "Artificial Intelligence and Data Science",
        "Machine learning, NLP, computer vision, applied analytics.",
      ],
      [
        "Sustainable Engineering",
        "Renewable energy, materials, green manufacturing.",
      ],
      [
        "Health and Life Sciences",
        "Public health, biomedical engineering, pharmacology.",
      ],
      ["Education and Social Sciences", "Pedagogy, policy, digital society."],
      [
        "Information Systems and Security",
        "Software engineering, networks, cybersecurity.",
      ],
    ].map(([name, description], index) => ({
      conferenceId,
      name: name!,
      description: description!,
      sortOrder: index,
    })),
  );

  await db.insert(schema.pages).values([
    {
      conferenceId,
      slug: "about",
      title: "About the conference",
      navLabel: "About",
      showInNav: true,
      sortOrder: 1,
      isPublished: true,
      body: [
        "## Scope",
        "",
        "ICRST is an annual, peer-reviewed conference. Every submission receives",
        "at least two independent reviews.",
        "",
        "## Proceedings",
        "",
        "Accepted and presented papers are published in the conference",
        "proceedings with an ISBN. Selected papers are invited to an extended",
        "journal special issue.",
      ].join("\n"),
    },
    {
      conferenceId,
      slug: "call-for-papers",
      title: "Author guidelines",
      isPublished: true,
      body: [
        "## Formatting",
        "",
        "- Full papers: 6–10 pages, IEEE two-column template",
        "- Abstracts: 300–500 words",
        "- Posters: one-page extended abstract",
        "",
        "## Review process",
        "",
        "Submissions are double-blind reviewed. Remove author names and",
        "affiliations from the manuscript before uploading.",
        "",
        "## Presentation",
        "",
        "At least one author of every accepted paper must register and present",
        "for the paper to appear in the proceedings.",
      ].join("\n"),
    },
    {
      conferenceId,
      slug: "venue",
      title: "Venue and travel",
      navLabel: "Venue",
      showInNav: true,
      sortOrder: 2,
      isPublished: true,
      body: [
        "The conference is held at the Universitas Indonesia Convention Hall in",
        "Depok, about 45 minutes from Soekarno–Hatta International Airport.",
        "",
        "## Accommodation",
        "",
        "A block of rooms is reserved at partner hotels near campus. Booking",
        "details are emailed to registered attendees.",
      ].join("\n"),
    },
  ]);

  const [keynote] = await db
    .insert(schema.speakers)
    .values([
      {
        conferenceId,
        name: "Prof. Sari Wijayanti",
        title: "Professor of Computer Science",
        affiliation: "Institut Teknologi Bandung",
        country: "Indonesia",
        bio: "Works on multilingual NLP for low-resource languages.",
        isKeynote: true,
        sortOrder: 0,
      },
      {
        conferenceId,
        name: "Dr. Michael Tan",
        title: "Principal Researcher",
        affiliation: "National University of Singapore",
        country: "Singapore",
        bio: "Research lead in sustainable materials and circular manufacturing.",
        isKeynote: true,
        sortOrder: 1,
      },
    ])
    .returning();

  await db.insert(schema.scheduleItems).values([
    {
      conferenceId,
      day: dateOnly(150),
      startsAt: dayAt(150, "08:30"),
      endsAt: dayAt(150, "09:00"),
      title: "Registration and welcome coffee",
      room: "Main Foyer",
    },
    {
      conferenceId,
      day: dateOnly(150),
      startsAt: dayAt(150, "09:00"),
      endsAt: dayAt(150, "10:00"),
      title: "Opening keynote",
      description: "Multilingual NLP beyond the top hundred languages.",
      room: "Grand Hall",
      speakerId: keynote!.id,
    },
    {
      conferenceId,
      day: dateOnly(150),
      startsAt: dayAt(150, "10:30"),
      endsAt: dayAt(150, "12:00"),
      title: "Parallel sessions A1–A4",
      room: "Rooms 201–204",
    },
    {
      conferenceId,
      day: dateOnly(151),
      startsAt: dayAt(151, "09:00"),
      endsAt: dayAt(151, "10:00"),
      title: "Day 2 keynote",
      room: "Grand Hall",
    },
  ]);

  await db.insert(schema.registrationTiers).values([
    {
      conferenceId,
      name: "Early Bird — Presenter",
      category: "presenter",
      mode: "onsite",
      price: 1_500_000,
      description: "On-site presentation, proceedings, lunch and materials.",
      validUntil: inDays(80),
      sortOrder: 0,
    },
    {
      conferenceId,
      name: "Regular — Presenter",
      category: "presenter",
      mode: "onsite",
      price: 1_900_000,
      validFrom: inDays(81, "00:00"),
      sortOrder: 1,
    },
    {
      conferenceId,
      name: "Student Presenter",
      category: "student_presenter",
      mode: "onsite",
      price: 1_000_000,
      description: "Requires a valid student card at the registration desk.",
      sortOrder: 2,
    },
    {
      conferenceId,
      name: "Participant (non-presenting)",
      category: "participant",
      mode: "onsite",
      price: 750_000,
      quota: 200,
      sortOrder: 3,
    },
    {
      conferenceId,
      name: "Online Participant",
      category: "participant",
      mode: "online",
      price: 350_000,
      description: "Live stream access and digital certificate.",
      sortOrder: 4,
    },
  ]);

  console.log(`Seeded "${conference!.name}" (id ${conferenceId}).`);
  console.log(
    "Create an account through the app, then promote it with:\n" +
      `  UPDATE "user" SET role = 'admin' WHERE email = 'you@example.com';`,
  );

  await client.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
