import { db } from '../db';
import { adjusters, claims, interactions } from '@shared/schema';

const SEED_DATA = {
  adjusters: [
    {
      name: 'Michael Sterling',
      carrier: 'State Farm',
      riskLevel: 'Low',
      behaviorScore: 85,
      metrics: {
        aggressiveness: 30,
        responsiveness: 90,
        fairness: 80,
        knowledge: 75,
        negotiation: 60,
      },
      commonDenialStyles: ['Pre-existing condition (rare)', 'Policy limits'],
      responsivenessRating: '24-48 Hours',
      narrative: 'Generally reasonable to work with. Prefers email communication. Will pay fair value if documentation is solid, but pushes back on "soft" damages without hard proof.',
    },
    {
      name: 'Sarah Jenkins',
      carrier: 'Allstate',
      riskLevel: 'Severe',
      behaviorScore: 22,
      metrics: {
        aggressiveness: 95,
        responsiveness: 20,
        fairness: 15,
        knowledge: 80,
        negotiation: 10,
      },
      commonDenialStyles: ['Delay tactics', 'Lowball initial offers', 'Coverage disputes', 'Biased medical review'],
      responsivenessRating: 'Weeks / Unresponsive',
      narrative: 'Extremely difficult. Document everything. Will ignore emails for weeks. Known for "losing" paperwork. Do not expect fair initial offers. Prepare for litigation early.',
    },
    {
      name: 'David Thorne',
      carrier: 'Geico',
      riskLevel: 'Medium',
      behaviorScore: 55,
      metrics: {
        aggressiveness: 60,
        responsiveness: 50,
        fairness: 50,
        knowledge: 40,
        negotiation: 40,
      },
      commonDenialStyles: ['Comparative negligence', 'Minor impact defense'],
      responsivenessRating: '3-5 Days',
      narrative: 'By the book, but often misinterprets the book. Stick to facts. Can be reasoned with if you walk him through the policy language step-by-step.',
    }
  ],
  claims: [
    {
      adjusterIndex: 0, // Michael Sterling
      publicId: 'CLM-0004219',
      privateId: 'SF-992-221',
      status: 'Closed',
      dateOpened: '2023-01-15',
      dateClosed: '2023-03-20',
      outcome: 'Settled within 10%',
    },
    {
      adjusterIndex: 0,
      publicId: 'CLM-0004255',
      privateId: 'SF-992-999',
      status: 'Open',
      dateOpened: '2024-01-10',
    },
    {
      adjusterIndex: 1, // Sarah Jenkins
      publicId: 'CLM-0001052',
      privateId: 'AS-882-111',
      status: 'Closed',
      dateOpened: '2021-02-10',
      dateClosed: '2023-11-05',
      duration: '2 years, 9 months',
      outcome: 'Full Policy Limits',
      whatWorked: 'Filed DOI complaint and threatened bad faith suit after 6 months of silence. Had to depose him to get movement.',
    },
    {
      adjusterIndex: 1,
      publicId: 'CLM-0003921',
      privateId: 'AS-221-002',
      status: 'Litigation',
      dateOpened: '2023-06-15',
    }
  ],
  interactions: [
    {
      adjusterIndex: 0,
      date: '2024-01-20',
      type: 'Email',
      description: 'Sent initial demand package.',
      outcome: 'Acknowledged same day',
      claimId: 'CLM-0004255'
    },
    {
      adjusterIndex: 1,
      date: '2023-08-10',
      type: 'Phone',
      description: 'Attempted to discuss property damage.',
      outcome: 'Hung up when pressed on timeline',
      claimId: 'CLM-0003921'
    }
  ]
};

async function seed() {
  console.log('🌱 Seeding database...');

  try {
    // Check if already seeded
    const existingAdjusters = await db.select().from(adjusters);
    if (existingAdjusters.length > 0) {
      console.log('✅ Database already seeded, skipping...');
      return;
    }

    // Insert adjusters and store their IDs
    const adjusterIds: string[] = [];
    for (const adjusterData of SEED_DATA.adjusters) {
      const [inserted] = await db.insert(adjusters).values(adjusterData).returning();
      adjusterIds.push(inserted.id);
      console.log(`  ✓ Created adjuster: ${adjusterData.name}`);
    }

    // Insert claims
    for (const claimData of SEED_DATA.claims) {
      const { adjusterIndex, ...claimFields } = claimData;
      await db.insert(claims).values({
        ...claimFields,
        adjusterId: adjusterIds[adjusterIndex],
      });
      console.log(`  ✓ Created claim: ${claimData.publicId}`);
    }

    // Insert interactions
    for (const interactionData of SEED_DATA.interactions) {
      const { adjusterIndex, ...interactionFields } = interactionData;
      await db.insert(interactions).values({
        ...interactionFields,
        adjusterId: adjusterIds[adjusterIndex],
      });
      console.log(`  ✓ Created interaction for adjuster index ${adjusterIndex}`);
    }

    console.log('✅ Database seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

seed()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
