import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  UserCredential,
  Unsubscribe,
} from 'firebase/auth';
import { auth } from '../firebase';

/**
 * 新規ユーザー登録
 */
export const signUp = async (
  email: string,
  password: string
): Promise<UserCredential> => {
  return await createUserWithEmailAndPassword(auth, email, password);
};

/**
 * ログイン
 */
export const signIn = async (
  email: string,
  password: string
): Promise<UserCredential> => {
  return await signInWithEmailAndPassword(auth, email, password);
};

/**
 * ログアウト
 */
export const signOut = async (): Promise<void> => {
  return await firebaseSignOut(auth);
};

/**
 * 認証状態の監視
 */
export const onAuthChange = (
  callback: (user: FirebaseUser | null) => void
): Unsubscribe => {
  return onAuthStateChanged(auth, callback);
};

/**
 * 現在のログインユーザー取得
 */
export const getCurrentUser = (): FirebaseUser | null => {
  return auth.currentUser;
};
