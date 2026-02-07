import type { Adjuster, Interaction, Claim, InsertAdjuster, InsertClaim, Document, Attachment, InsertAttachment } from '@shared/schema';
import { getAuthHeaders } from '@/lib/auth-headers';

export type AdjusterWithRelations = Adjuster & {
  claims: Claim[];
  interactions: Interaction[];
  documents: Document[];
};

export type AdjusterIntelligence = {
  totalInteractions: number;
  totalClaims: number;
  escalationCount: number;
  reinspectionCount: number;
  avgDaysToResolution: number | null;
  outcomesResolved: number;
  outcomesStalled: number;
  outcomesOpen: number;
  patternTags: string[];
  riskScore: number;
  responsivenessScore: number | null;
  cooperationLevel: 'Low' | 'Moderate' | 'High' | null;
  supplementApprovalRate: number | null;
  avgInteractionsPerClaim: number | null;
};

export type CarrierIntelligence = {
  carrier: string;
  totalAdjusters: number;
  totalClaims: number;
  avgInteractionsPerClaim: number | null;
  avgDaysToResolution: number | null;
  escalationEffectiveness: number | null;
  outcomesResolved: number;
  outcomesStalled: number;
  outcomesOpen: number;
  frictionLevel: 'Low' | 'Normal' | 'High' | null;
  resolutionTendency: 'Fast' | 'Normal' | 'Slow' | null;
  riskScore: number | null;
  supplementSuccessRate: number | null;
  reinspectionWinRate: number | null;
};

export type ClaimWithRelations = Claim & {
  adjusters: Adjuster[];
  interactions: Interaction[];
};

export async function fetchAdjusters(): Promise<Adjuster[]> {
  const response = await fetch('/api/adjusters', { credentials: 'include', headers: getAuthHeaders() });
  if (!response.ok) {
    throw new Error('Failed to fetch adjusters');
  }
  return response.json();
}

export async function fetchAdjuster(id: string): Promise<AdjusterWithRelations> {
  const response = await fetch(`/api/adjusters/${id}`, { credentials: 'include', headers: getAuthHeaders() });
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
      ...getAuthHeaders(),
    },
    body: JSON.stringify(interaction),
    credentials: 'include',
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
      ...getAuthHeaders(),
    },
    body: JSON.stringify(adjuster),
    credentials: 'include',
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
      ...getAuthHeaders(),
    },
    body: JSON.stringify(data),
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Failed to update adjuster');
  }
  
  return response.json();
}

export async function fetchAdjusterIntelligence(id: string): Promise<AdjusterIntelligence> {
  const response = await fetch(`/api/adjusters/${id}/intelligence`, { credentials: 'include', headers: getAuthHeaders() });
  if (!response.ok) {
    throw new Error('Failed to fetch adjuster intelligence');
  }
  return response.json();
}

export async function fetchCarriers(): Promise<string[]> {
  const response = await fetch('/api/carriers', { credentials: 'include', headers: getAuthHeaders() });
  if (!response.ok) {
    throw new Error('Failed to fetch carriers');
  }
  return response.json();
}

export async function fetchCarrierIntelligence(name: string): Promise<CarrierIntelligence> {
  const response = await fetch(`/api/carriers/${encodeURIComponent(name)}/intelligence`, { credentials: 'include', headers: getAuthHeaders() });
  if (!response.ok) {
    throw new Error('Failed to fetch carrier intelligence');
  }
  return response.json();
}

export async function fetchClaims(): Promise<Claim[]> {
  const response = await fetch('/api/claims', { credentials: 'include', headers: getAuthHeaders() });
  if (!response.ok) {
    throw new Error('Failed to fetch claims');
  }
  return response.json();
}

export async function fetchClaim(id: string): Promise<ClaimWithRelations> {
  const response = await fetch(`/api/claims/${id}`, { credentials: 'include', headers: getAuthHeaders() });
  if (!response.ok) {
    throw new Error('Failed to fetch claim');
  }
  return response.json();
}

export async function createClaim(claim: InsertClaim): Promise<Claim> {
  const response = await fetch('/api/claims', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(claim),
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Failed to create claim');
  }
  
  return response.json();
}

export async function updateClaim(
  claimId: string,
  data: Partial<InsertClaim>
): Promise<Claim> {
  const response = await fetch(`/api/claims/${claimId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(data),
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Failed to update claim');
  }
  
  return response.json();
}

export async function linkAdjusterToClaim(
  claimId: string,
  adjusterId: string
): Promise<void> {
  const response = await fetch(`/api/claims/${claimId}/adjusters`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ adjusterId }),
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Failed to link adjuster to claim');
  }
}

export async function fetchAttachments(claimId: string): Promise<Attachment[]> {
  const response = await fetch(`/api/claims/${claimId}/attachments`, { credentials: 'include', headers: getAuthHeaders() });
  if (!response.ok) {
    throw new Error('Failed to fetch attachments');
  }
  return response.json();
}

export async function createAttachment(
  claimId: string,
  attachment: Omit<InsertAttachment, 'claimId'>
): Promise<Attachment> {
  const response = await fetch(`/api/claims/${claimId}/attachments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(attachment),
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Failed to create attachment');
  }
  
  return response.json();
}

export async function deleteAttachment(attachmentId: string): Promise<void> {
  const response = await fetch(`/api/attachments/${attachmentId}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete attachment');
  }
}
