import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import rawFirebaseConfig from '../../firebase-applet-config.json';

const firebaseConfig = rawFirebaseConfig || {
  projectId: "gen-lang-client-0855953567",
  appId: "1:887416194426:web:48e8f83334f54919fc02c3",
  apiKey: "AIzaSyCzpQjoSmYN8KOb8AvaBJrosgcDN7O7gI0",
  authDomain: "gen-lang-client-0855953567.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-77747c41-2076-41d9-bac3-d3ca8a1ac458",
  storageBucket: "gen-lang-client-0855953567.firebasestorage.app",
  messagingSenderId: "887416194426",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
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
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate connection safely
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'shipments', 'connection-test'));
  } catch (_err) {
    // Silent catch so test check never interrupts page initialization
  }
}
testConnection();
