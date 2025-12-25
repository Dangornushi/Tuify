import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  startAfter as firestoreStartAfter,
  serverTimestamp,
  Timestamp,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from '../firebase';
import { Project } from '../types/models';

const COLLECTION_NAME = 'projects';

/**
 * オブジェクトから再帰的にundefined値を削除する
 * Firestoreはundefined値をサポートしていないため必要
 */
const removeUndefined = <T>(obj: T): T => {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(removeUndefined) as T;
  }
  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        result[key] = removeUndefined(value);
      }
    }
    return result as T;
  }
  return obj;
};

/**
 * プロジェクト新規作成
 * Firestore操作: addDoc(collection(db, 'projects'), projectData)
 */
export const createProject = async (
  data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  const projectsRef = collection(db, COLLECTION_NAME);
  const cleanedData = removeUndefined(data);
  const docRef = await addDoc(projectsRef, {
    ...cleanedData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};

/**
 * プロジェクト詳細取得
 * Firestore操作: getDoc(doc(db, 'projects', {projectId}))
 */
export const getProject = async (projectId: string): Promise<Project | null> => {
  const projectRef = doc(db, COLLECTION_NAME, projectId);
  const snapshot = await getDoc(projectRef);

  if (!snapshot.exists()) {
    return null;
  }

  return { id: snapshot.id, ...snapshot.data() } as Project;
};

/**
 * ユーザーのプロジェクト一覧取得（ページネーション対応）
 * Firestore操作: query(
 *   collection(db, 'projects'),
 *   where('userId', '==', {userId}),
 *   orderBy('updatedAt', 'desc'),
 *   limit({limit}),
 *   startAfter({startAfter})
 * )
 */
export const getProjectsByUser = async (
  userId: string,
  limit: number = 20,
  startAfter?: Timestamp
): Promise<Project[]> => {
  const projectsRef = collection(db, COLLECTION_NAME);

  // クエリ条件を構築
  const queryConstraints: QueryConstraint[] = [
    where('userId', '==', userId),
    orderBy('updatedAt', 'desc'),
    firestoreLimit(limit),
  ];

  // startAfterが指定されている場合はカーソルを追加
  if (startAfter) {
    queryConstraints.push(firestoreStartAfter(startAfter));
  }

  const q = query(projectsRef, ...queryConstraints);

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Project[];
};

/**
 * プロジェクト更新
 * Firestore操作: updateDoc(doc(db, 'projects', {projectId}), data)
 */
export const updateProject = async (
  projectId: string,
  data: Partial<Project>
): Promise<void> => {
  const projectRef = doc(db, COLLECTION_NAME, projectId);
  const cleanedData = removeUndefined(data);
  await updateDoc(projectRef, {
    ...cleanedData,
    updatedAt: serverTimestamp(),
  });
};

/**
 * プロジェクト削除
 * Firestore操作: deleteDoc(doc(db, 'projects', {projectId}))
 */
export const deleteProject = async (projectId: string): Promise<void> => {
  const projectRef = doc(db, COLLECTION_NAME, projectId);
  await deleteDoc(projectRef);
};
