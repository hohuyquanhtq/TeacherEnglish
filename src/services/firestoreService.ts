import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
  type DocumentData,
} from 'firebase/firestore';
import { auth, db } from '@/src/config/firebase';

export const COLLECTIONS = {
  USERS: 'users',
  ADMIN_AUDIT_LOGS: 'adminAuditLogs',
  SUBJECTS: 'subjects',
  LESSONS: 'lessons',
  CLASSROOM_ENGLISH: 'classroomEnglish',
  QUIZZES: 'quizzes',
  USER_LIBRARY: 'userLibrary',
  AI_SESSIONS: 'aiSessions',
  LEARNING_RECORDS: 'learningRecords',
  SYSTEM_SETTINGS: 'systemSettings',
} as const;

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid ?? null,
      email: auth.currentUser?.email ?? null,
      emailVerified: auth.currentUser?.emailVerified ?? null,
      isAnonymous: auth.currentUser?.isAnonymous ?? null,
      tenantId: auth.currentUser?.tenantId ?? null,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) ?? [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const firestoreService = {
  async getDocument<T = DocumentData>(collectionName: string, docId: string): Promise<T | null> {
    const path = `${collectionName}/${docId}`;
    try {
      const snap = await getDoc(doc(db, collectionName, docId));
      return snap.exists() ? (snap.data() as T) : null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    }
  },

  async listCollection<T = DocumentData>(collectionName: string): Promise<T[]> {
    try {
      const snap = await getDocs(collection(db, collectionName));
      return snap.docs.map((item) => item.data() as T);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, collectionName);
    }
  },

  async createDocument(
    collectionName: string,
    docId: string,
    payload: Record<string, unknown>
  ): Promise<void> {
    const path = `${collectionName}/${docId}`;
    try {
      await setDoc(doc(db, collectionName, docId), {
        ...payload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  async upsertDocument(
    collectionName: string,
    docId: string,
    payload: Record<string, unknown>
  ): Promise<void> {
    const path = `${collectionName}/${docId}`;
    try {
      await setDoc(
        doc(db, collectionName, docId),
        {
          ...payload,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async updateDocument(
    collectionName: string,
    docId: string,
    payload: Record<string, unknown>
  ): Promise<void> {
    const path = `${collectionName}/${docId}`;
    try {
      await updateDoc(doc(db, collectionName, docId), {
        ...payload,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async deleteDocument(collectionName: string, docId: string): Promise<void> {
    const path = `${collectionName}/${docId}`;
    try {
      await deleteDoc(doc(db, collectionName, docId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },
};
