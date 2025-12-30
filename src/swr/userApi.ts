import { getUser } from "../firebase.ts";
import type {FirestoreUser} from "../models/user.ts";

export const getUserKey = "getUser";

export const getUserFetcher = async () => {
  const res = await getUser();

  console.log(res.data);

  return res.data as FirestoreUser;
};
