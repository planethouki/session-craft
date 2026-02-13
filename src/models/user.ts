import type {InstrumentalPart} from "./instrumentalPart";

export type Role = 'admin' | 'partLeader' | 'member'

export type FirestoreUser = {
  docId: string;
  approved: boolean;
  approvedAt?: Date;
  displayName: string;
  photoURL: string;
  myPart: InstrumentalPart;
  roles: Role[];
  leaderParts: InstrumentalPart[];
  createdAt: Date;
  updatedAt: Date;
};

export type UserResponse = {
  docId: string;
  approved: boolean;
  approvedAt?: number;
  displayName: string;
  photoURL: string;
  myPart: InstrumentalPart;
  roles: Role[];
  leaderParts?: InstrumentalPart[];
  createdAt: number;
  updatedAt: number;
};
