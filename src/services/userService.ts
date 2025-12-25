import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { User } from '../types/models';

const COLLECTION_NAME = 'users';

/**
 * ユーザードキュメント作成
 * Firestore操作: setDoc(doc(db, 'users', {uid}), userData)
 */
export const createUser = async (userData: Partial<User>): Promise<void> => {
  const userRef = doc(db, COLLECTION_NAME, userData.uid!);
  await setDoc(userRef, {
    ...userData,
    createdAt: serverTimestamp(),
  });
};

/**
 * ユーザー情報取得
 * Firestore操作: getDoc(doc(db, 'users', {uid}))
 */
export const getUser = async (uid: string): Promise<User | null> => {
  const userRef = doc(db, COLLECTION_NAME, uid);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    return null;
  }

  return { uid: snapshot.id, ...snapshot.data() } as User;
};

/**
 * ユーザー情報更新
 * Firestore操作: updateDoc(doc(db, 'users', {uid}), data)
 */
export const updateUser = async (
  uid: string,
  data: Partial<User>
): Promise<void> => {
  const userRef = doc(db, COLLECTION_NAME, uid);
  await updateDoc(userRef, data);
};
