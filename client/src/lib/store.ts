import { create } from 'zustand';

export interface Interaction {
  id: string;
  date: string;
  type: 'Email' | 'Phone' | 'In-Person' | 'Letter' | 'Settlement Offer';
  description: string;
  outcome?: string;
  claimId?: string; // Public ID
}

export interface Claim {
  publicId: string; // CLM-0000001
  privateId: string; // Real claim number (hidden)
  status: 'Open' | 'Closed' | 'Litigation';
  dateOpened: string;
  dateClosed?: string;
  duration?: string; // e.g. "2 years, 3 months"
  outcome?: string; // "Full Limits", "Denied", "Partial"
  whatWorked?: string; // For the long-running claims section
}

export interface Adjuster {
  id: string;
  name: string;
  carrier: string;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Severe';
  behaviorScore: number; // 0-100
  metrics: {
    aggressiveness: number;
    responsiveness: number;
    fairness: number;
    knowledge: number;
    negotiation: number;
  };
  commonDenialStyles: string[];
  responsivenessRating: string; // "24-48 Hours", "Weeks", "Immediate"
  narrative: string;
  claims: Claim[];
  interactions: Interaction[];
}

interface StoreState {
  adjusters: Adjuster[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  addInteraction: (adjusterId: string, interaction: Omit<Interaction, 'id'>) => void;
}

// Initial Mock Data
const MOCK_ADJUSTERS: Adjuster[] = [
  {
    id: '1',
    name: 'Sarah Jenkins',
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
    claims: [
      {
        publicId: 'CLM-0004219',
        privateId: 'SF-992-221',
        status: 'Closed',
        dateOpened: '2023-01-15',
        dateClosed: '2023-03-20',
        outcome: 'Settled within 10%',
      },
      {
        publicId: 'CLM-0004255',
        privateId: 'SF-992-999',
        status: 'Open',
        dateOpened: '2024-01-10',
      },
    ],
    interactions: [
      {
        id: 'i1',
        date: '2024-01-20',
        type: 'Email',
        description: 'Sent initial demand package.',
        outcome: 'Acknowledged same day',
        claimId: 'CLM-0004255'
      }
    ]
  },
  {
    id: '2',
    name: 'Michael "The Wall" Vance',
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
    claims: [
      {
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
        publicId: 'CLM-0003921',
        privateId: 'AS-221-002',
        status: 'Litigation',
        dateOpened: '2023-06-15',
      }
    ],
    interactions: [
      {
        id: 'i2',
        date: '2023-08-10',
        type: 'Phone',
        description: 'Attempted to discuss property damage.',
        outcome: 'Hung up when pressed on timeline',
        claimId: 'CLM-0003921'
      }
    ]
  },
  {
    id: '3',
    name: 'David Chen',
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
    claims: [],
    interactions: []
  }
];

export const useStore = create<StoreState>((set) => ({
  adjusters: MOCK_ADJUSTERS,
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
  addInteraction: (adjusterId, interaction) => set((state) => ({
    adjusters: state.adjusters.map((adj) => {
      if (adj.id === adjusterId) {
        return {
          ...adj,
          interactions: [
            { ...interaction, id: Math.random().toString(36).substr(2, 9) },
            ...adj.interactions
          ]
        };
      }
      return adj;
    })
  }))
}));
