import type { Timestamp } from 'firebase/firestore';

export type Player = {
  id: string; // Corresponds to Firebase Auth UID
  name: string;
  instagram?: string;
  groupSize: number;
  createdAt: Timestamp;
};

export type Game = {
  id: string;
  name: string;
  isActive: boolean;
};

export type ScoreStatus = 'pending' | 'approved' | 'rejected';

export type Score = {
  id: string;
  playerId: string;
  gameName: string;
  scoreValue: number;
  imageURL: string;
  status: ScoreStatus;
  timestamp: Timestamp;
  isSuspicious?: boolean;
  suspicionReason?: string;
};
