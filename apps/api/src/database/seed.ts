import { config } from 'dotenv';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import * as schema from './schemas';

config({ path: '.env' });
config({ path: '.env.local', override: true });

const SLUG = 'isphoa-2026';

function wib(date: string, time = '23:59') {
  return new Date(`${date}T${time}:00+07:00`);
}

const SUBMISSION_OPENS = wib('2026-06-01', '00:00');
const SUBMISSION_DEADLINE = wib('2026-09-15');
const NOTIFICATION = wib('2026-10-15', '00:00');
const EARLY_BIRD_DEADLINE = wib('2026-11-01');
const CAMERA_READY = wib('2026-11-20');
const STARTS_ON = '2026-12-02';
const ENDS_ON = '2026-12-03';

const REGULAR_FROM = wib('2026-11-02', '00:00');

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set.');

  const client = new Pool({ connectionString: url });
  const db = drizzle(client, { schema });

  console.log('Seeding…');

  await db.delete(schema.conferences).where(eq(schema.conferences.slug, SLUG));

  await db
    .update(schema.conferences)
    .set({ isActive: false })
    .where(eq(schema.conferences.isActive, true));

  const [conference] = await db
    .insert(schema.conferences)
    .values({
      slug: SLUG,
      name: 'International Seminar on Photonics, Optics, and its Applications',
      shortName: 'ISPhOA',
      edition: '2026',
      tagline: 'AI-driven Light-based Technology Innovations',
      description: null,
      startsOn: STARTS_ON,
      endsOn: ENDS_ON,
      venueName: 'UIN Mahmud Yunus Batusangkar',
      venueAddress: [
        'Jl. Jenderal Sudirman No. 137',
        'Nagari Lima Kaum, Kec. Lima Kaum',
        'Batusangkar, Kab. Tanah Datar',
        'Sumatera Barat 27216',
      ].join('\n'),
      city: 'Batusangkar',
      country: 'Indonesia',
      timezone: 'Asia/Jakarta',
      submissionOpensAt: SUBMISSION_OPENS,
      submissionDeadline: SUBMISSION_DEADLINE,
      notificationDate: NOTIFICATION,
      cameraReadyDeadline: CAMERA_READY,
      registrationDeadline: EARLY_BIRD_DEADLINE,
      contactEmail: 'secretariat@isphoa2026.org',
      websiteUrl: 'https://isphoa2026.org',
      isActive: true,
    })
    .returning();

  const conferenceId = conference!.id;

  await db.insert(schema.tracks).values(
    [
      [
        'Halal Authentication Technologies',
        'Optical and photonic methods for non-destructive halal verification, food authentication, and material purity testing.',
      ],
      [
        'Life-sciences & Medical Related Technologies',
        'Light-based innovations applied to biomedical diagnostics, therapy, imaging, and life science research.',
      ],
      [
        'Agriculture, Livestock, and Fisheries',
        'Optical sensing and photonic systems for precision agriculture, aquaculture monitoring, and livestock management.',
      ],
      [
        'Manufacturing and Industries',
        'Laser processing, optical inspection, photonic quality control, and smart manufacturing applications.',
      ],
      [
        'Communication & Multimedia',
        'Optical fiber communications, Li-Fi, photonic networks, and light-based multimedia transmission systems.',
      ],
      [
        'Energy-related Sectors',
        'Solar energy harvesting, photovoltaics, optical energy storage, and light-driven energy conversion technologies.',
      ],
      [
        'Transportation-related Technologies',
        'LiDAR for autonomous vehicles, optical traffic sensing, aerospace photonics, and navigation systems.',
      ],
      [
        'Other Light-based Related Innovations',
        'All other original research on light-based technology innovations are also welcome.',
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
      slug: 'call-for-papers',
      title: 'Author guidelines',
      isPublished: true,
      body: [
        '## Formatting',
        '',
        '- Full paper: 4 to 6 pages maximum, SPIE proceedings template',
        '- Original and unpublished work only',
        '',
        '## Review process',
        '',
        'All submitted full papers undergo double-blind peer review by our',
        'reviewers committee. Remove author names and affiliations from the',
        'manuscript before uploading.',
        '',
        '## Publication',
        '',
        'All accepted and presented papers are published in the Proceedings of',
        'SPIE (Scopus indexed), and every accepted and presented paper receives',
        'a permanent DOI.',
        '',
        '## Presentation',
        '',
        'At least one author of every accepted paper must register and present',
        'for the paper to appear in the proceedings.',
      ].join('\n'),
    },
    {
      conferenceId,
      slug: 'venue',
      title: 'Venue and travel',
      navLabel: 'Venue',
      showInNav: true,
      sortOrder: 1,
      isPublished: true,
      body: [
        'The seminar is held at UIN Mahmud Yunus Batusangkar in Tanah Datar',
        'Regency, West Sumatra, the historic seat of the Minangkabau Kingdom.',
        '',
        'The nearest airport is Minangkabau International Airport (PDG) in',
        'Padang, about three hours away by road.',
        '',
        '## Attending online',
        '',
        'ISPhOA 2026 is hybrid. Online participants join over Zoom and receive',
        'live-stream access, e-proceedings and an e-certificate.',
      ].join('\n'),
    },
  ]);

  await db.insert(schema.speakers).values([
    {
      conferenceId,
      name: 'Prof. A.M. Hatta',
      title: 'Vice Rector IV, ITS · President of InOS',
      affiliation: 'Institut Teknologi Sepuluh Nopember',
      country: 'Indonesia',
      bio: 'Photonic Innovations in Industrial Applications',
      isKeynote: true,
      sortOrder: 0,
    },
    {
      conferenceId,
      name: 'Prof. S. M. Ganapathy',
      affiliation: 'University of Southampton',
      country: 'United Kingdom',
      bio: 'Advanced Optical Sensing Technologies',
      isKeynote: true,
      sortOrder: 1,
    },
    {
      conferenceId,
      name: 'A/P Dr. Ing Azhar Zam',
      affiliation: 'NYU Abu Dhabi',
      country: 'United Arab Emirates',
      bio: 'Biomedical Photonics & Laser-Tissue Interaction',
      isKeynote: true,
      sortOrder: 2,
    },
    {
      conferenceId,
      name: 'Dr. Ing R. Kanawade',
      affiliation: 'CSIR-NCL, Pune',
      country: 'India',
      bio: 'Light-based Diagnostics & Spectroscopy',
      isKeynote: true,
      sortOrder: 3,
    },
    {
      conferenceId,
      name: 'A/P Dr. P. Chaompluk',
      affiliation: 'Chulalongkorn University',
      country: 'Thailand',
      bio: 'Photonic Systems for Smart Agriculture',
      isKeynote: true,
      sortOrder: 4,
    },
  ]);

  const fees = [
    {
      category: 'International Presenter',
      attendee: 'presenter' as const,
      mode: 'onsite' as const,
      currency: 'USD',
      earlyBird: 175,
      regular: 220,
      includes:
        'Oral / poster slot, full 2-day access, seminar kit, print proceedings and certificate.',
    },
    {
      category: 'International Participant',
      attendee: 'participant' as const,
      mode: 'onsite' as const,
      currency: 'USD',
      earlyBird: 240,
      regular: 300,
      includes:
        'Full 2-day access, seminar kit, proceedings, networking dinner and cultural tour.',
    },
    {
      category: 'National Presenter',
      attendee: 'presenter' as const,
      mode: 'onsite' as const,
      currency: 'IDR',
      earlyBird: 1_400_000,
      regular: 1_750_000,
      includes:
        'Oral / poster slot, full access, proceedings, certificate and DOI assignment.',
    },
    {
      category: 'National Participant',
      attendee: 'participant' as const,
      mode: 'onsite' as const,
      currency: 'IDR',
      earlyBird: 800_000,
      regular: 1_000_000,
      includes: 'Full 2-day access, seminar kit, proceedings and certificate.',
    },
    {
      category: 'Student (National)',
      attendee: 'student_participant' as const,
      mode: 'onsite' as const,
      currency: 'IDR',
      earlyBird: 500_000,
      regular: 650_000,
      includes:
        'Full 2-day access, proceedings and student certificate. Requires a valid student card at the registration desk.',
    },
    {
      category: 'Online Participant',
      attendee: 'participant' as const,
      mode: 'online' as const,
      currency: 'USD',
      earlyBird: 60,
      regular: 80,
      includes:
        'Live-stream access, e-proceedings, e-certificate, virtual Q&A and recorded sessions.',
    },
  ];

  await db.insert(schema.registrationTiers).values(
    fees.flatMap((fee, index) => [
      {
        conferenceId,
        name: `Early Bird: ${fee.category}`,
        category: fee.attendee,
        mode: fee.mode,
        price: fee.earlyBird,
        currency: fee.currency,
        description: fee.includes,
        validUntil: EARLY_BIRD_DEADLINE,
        sortOrder: index,
      },
      {
        conferenceId,
        name: `Regular: ${fee.category}`,
        category: fee.attendee,
        mode: fee.mode,
        price: fee.regular,
        currency: fee.currency,
        description: fee.includes,
        validFrom: REGULAR_FROM,
        sortOrder: index,
      },
    ]),
  );

  console.log(`Seeded "${conference!.name}" (id ${conferenceId}).`);
  console.log(
    'Create an account through the app, then promote it with:\n' +
      `  UPDATE users SET role = 'admin' WHERE email = 'you@example.com';`,
  );

  await client.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
