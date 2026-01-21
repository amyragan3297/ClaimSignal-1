import { db } from '../db';
import { adjusters, claims, interactions, claimAdjusters } from '@shared/schema';

const SEED_DATA = {
  adjusters: [
    {
      name: 'Michael Sterling',
      carrier: 'State Farm',
      region: 'Southeast',
      phone: '(555) 123-4567',
      email: 'msterling@statefarm.com',
      internalNotes: 'Generally reasonable to work with. Prefers email communication.',
      riskImpression: 'Low risk - cooperative and fair',
      whatWorked: 'Solid documentation and professional communication. Responds well to policy language references.',
    },
    {
      name: 'Sarah Jenkins',
      carrier: 'Allstate',
      region: 'National',
      phone: '(555) 987-6543',
      email: 'sjenkins@allstate.com',
      internalNotes: 'Extremely difficult. Document everything. Will ignore emails for weeks.',
      riskImpression: 'High risk - expect delays and lowball offers',
      whatWorked: 'Filed DOI complaint and threatened bad faith suit. Had to escalate to get any movement.',
    },
    {
      name: 'David Thorne',
      carrier: 'Geico',
      region: 'Texas',
      phone: '(555) 555-5555',
      email: 'dthorne@geico.com',
      internalNotes: 'By the book, but often misinterprets the book. Stick to facts.',
      riskImpression: 'Medium risk - can be reasoned with',
      whatWorked: 'Walking him through policy language step-by-step. Be patient and methodical.',
    }
  ],
  claims: [
    {
      maskedId: 'CLM-0004219',
      carrier: 'State Farm',
      dateOfLoss: '2023-01-15',
      status: 'closed',
      homeownerName: 'John Smith',
      propertyAddress: '123 Main St, Atlanta, GA',
      notes: 'Water damage from burst pipe',
      outcomeNotes: 'Settled within 10% of initial demand. Closed 2023-03-20.',
      adjusterIndex: 0,
    },
    {
      maskedId: 'CLM-0004255',
      carrier: 'State Farm',
      dateOfLoss: '2024-01-10',
      status: 'open',
      homeownerName: 'Jane Doe',
      propertyAddress: '456 Oak Ave, Savannah, GA',
      notes: 'Roof damage from storm',
      adjusterIndex: 0,
    },
    {
      maskedId: 'CLM-0001052',
      carrier: 'Allstate',
      dateOfLoss: '2021-02-10',
      status: 'closed',
      homeownerName: 'Robert Johnson',
      propertyAddress: '789 Elm St, Dallas, TX',
      notes: 'Fire damage to kitchen',
      outcomeNotes: 'Full policy limits achieved after 2 years, 9 months. Settled 2023-11-05.',
      adjusterIndex: 1,
    },
    {
      maskedId: 'CLM-0003921',
      carrier: 'Allstate',
      dateOfLoss: '2023-06-15',
      status: 'litigation',
      homeownerName: 'Maria Garcia',
      propertyAddress: '321 Pine Rd, Houston, TX',
      notes: 'Hail damage - adjuster unresponsive',
      adjusterIndex: 1,
    }
  ],
  interactions: [
    {
      adjusterIndex: 0,
      date: '2024-01-20',
      type: 'Email',
      description: 'Sent initial demand package for CLM-0004255.',
      outcome: 'Acknowledged same day',
      claimMaskedId: 'CLM-0004255'
    },
    {
      adjusterIndex: 1,
      date: '2023-08-10',
      type: 'Phone',
      description: 'Attempted to discuss property damage for CLM-0003921.',
      outcome: 'Hung up when pressed on timeline',
      claimMaskedId: 'CLM-0003921'
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

    // Insert claims and link to adjusters
    const claimIdMap: Record<string, string> = {};
    for (const claimData of SEED_DATA.claims) {
      const { adjusterIndex, ...claimFields } = claimData;
      const [inserted] = await db.insert(claims).values(claimFields).returning();
      claimIdMap[claimData.maskedId] = inserted.id;
      
      // Link adjuster to claim via junction table
      await db.insert(claimAdjusters).values({
        claimId: inserted.id,
        adjusterId: adjusterIds[adjusterIndex],
      });
      
      console.log(`  ✓ Created claim: ${claimData.maskedId}`);
    }

    // Insert interactions
    for (const interactionData of SEED_DATA.interactions) {
      const { adjusterIndex, claimMaskedId, ...interactionFields } = interactionData;
      await db.insert(interactions).values({
        ...interactionFields,
        adjusterId: adjusterIds[adjusterIndex],
        claimId: claimMaskedId || null,
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
