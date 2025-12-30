import type { FirestoreUser } from "../models/user";
import { getDoc, doc } from 'firebase/firestore'
import { db } from '../firebase'

export const getUserKey = "getUser";

export const getUserFetcher = async ([, uid]: [string, string]) => {
  if (!uid) {
    return null;
  }

  const snap = await getDoc(doc(db, 'users', uid));
  const data = snap.data();

  console.log(data);

  if (data) {
    const user: FirestoreUser = {
      docId: uid,
      approved: data.approved ?? false,
      approvedAt: data.approvedAt?.toDate(),
      displayName: data.displayName ?? '',
      photoURL: data.photoURL ?? '',
      roles: data.roles ?? [],
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
    };

    console.log(user);

    return user;
  }

  return null;
};
