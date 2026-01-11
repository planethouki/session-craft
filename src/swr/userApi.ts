import { getUser } from "../firebase.ts";
import type { FirestoreUser, UserResponse } from "../models/user";
import { timestampToDate } from "../utils/dateUtils";

export const getUserKey = "getUser";

export const getUserFetcher = async () => {
  const res = await getUser();

  const userResponse: UserResponse = res.data;
  const firestoreUser: FirestoreUser = {
    docId: userResponse.docId,
    approved: userResponse.approved,
    approvedAt: timestampToDate(userResponse.approvedAt),
    displayName: userResponse.displayName,
    photoURL: userResponse.photoURL,
    myPart: userResponse.myPart,
    roles: userResponse.roles,
    leaderParts: userResponse.leaderParts ?? [],
    createdAt: timestampToDate(userResponse.createdAt),
    updatedAt: timestampToDate(userResponse.updatedAt),
  };

  console.log(res.data, firestoreUser)

  return firestoreUser;
};
