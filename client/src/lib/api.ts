import type { Adjuster, Interaction, Claim, InsertAdjuster, Document } from '@shared/schema';

export type AdjusterWithRelations = Adjuster & {
  claims: Claim[];
  interactions: Interaction[];
  documents: Document[];
};

export async function fetchAdjusters(): Promise<Adjuster[]> {
  const response = await fetch('/api/adjusters');
  if (!response.ok) {
    throw new Error('Failed to fetch adjusters');
  }
  return response.json();
}

export async function fetchAdjuster(id: string): Promise<AdjusterWithRelations> {
  const response = await fetch(`/api/adjusters/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch adjuster');
  }
  return response.json();
}

export async function createInteraction(
  adjusterId: string,
  interaction: {
    date: string;
    type: string;
    description: string;
    outcome?: string;
    claimId?: string;
  }
): Promise<Interaction> {
  const response = await fetch(`/api/adjusters/${adjusterId}/interactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(interaction),
  });
  
  if (!response.ok) {
    throw new Error('Failed to create interaction');
  }
  
  return response.json();
}

export async function createAdjuster(adjuster: InsertAdjuster): Promise<Adjuster> {
  const response = await fetch('/api/adjusters', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(adjuster),
  });
  
  if (!response.ok) {
    throw new Error('Failed to create adjuster');
  }
  
  return response.json();
}

export async function updateAdjuster(
  adjusterId: string,
  data: Partial<InsertAdjuster>
): Promise<Adjuster> {
  const response = await fetch(`/api/adjusters/${adjusterId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update adjuster');
  }
  
  return response.json();
}
