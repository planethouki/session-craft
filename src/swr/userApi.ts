import { getUser } from "../firebase.ts";
import type { FirestoreUser, UserRequest } from "../models/user";
import { timestampToDate } from "../utils/dateUtils";

export const getUserKey = "getUser";

export const getUserFetcher = async () => {
  const res = await getUser();

  const userRequest: UserRequest = res.data;
  const firestoreUser: FirestoreUser = {
    docId: userRequest.docId,
    approved: userRequest.approved,
    approvedAt: timestampToDate(userRequest.approvedAt),
    displayName: userRequest.displayName,
    photoURL: userRequest.photoURL,
    roles: userRequest.roles,
    createdAt: timestampToDate(userRequest.createdAt),
    updatedAt: timestampToDate(userRequest.updatedAt),
  };

  console.log(res.data, firestoreUser)

  return firestoreUser;
};
