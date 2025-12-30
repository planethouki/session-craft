export type Role = 'admin' | 'partLeader' | 'member'

export type FirestoreUser = {
  docId: string;
  approved: boolean;
  approvedAt?: Date;
  displayName: string;
  photoURL: string;
  roles: Role[];
  createdAt: Date;
  updatedAt: Date;
};

export type UserRequest = {
  docId: string;
  approved: boolean;
  approvedAt?: Date;
  displayName: string;
  photoURL: string;
  roles: Role[];
  createdAt: Date;
  updatedAt: Date;
};
