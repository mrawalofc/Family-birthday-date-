import { initializeApp } from 'firebase/app';
import { initializeAuth, browserLocalPersistence, browserPopupRedirectResolver } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, enableIndexedDbPersistence } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

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

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Persistence can sometimes cause "offline" loops if not handled carefully in certain environments.
// We'll disable it for now or ensure it's handled.
/* 
if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db).catch((err) => {
    ...
  });
}
*/

// Initialize Auth with explicit persistence and popup resolver
export const auth = initializeAuth(app, {
  persistence: browserLocalPersistence,
  popupRedirectResolver: browserPopupRedirectResolver,
});

// Guard against concurrent popup operations which cause assertion failures
let activePopup: Promise<any> | null = null;
export async function runWithPopupGuard<T>(fn: () => Promise<T>): Promise<T> {
  if (activePopup) {
    console.warn('Another auth popup is already active. Waiting...');
    return activePopup;
  }
  
  activePopup = (async () => {
    try {
      return await fn();
    } finally {
      activePopup = null;
    }
  })();
  
  return activePopup;
}

// Test connection on boot with more grace
async function testConnection() {
  try {
    const path = 'test/connection';
    // We use a simple getDoc first to see if it responds.
    const { getDoc } = await import('firebase/firestore');
    await getDoc(doc(db, path));
    console.log('Firebase connection successful');
  } catch (error) {
    if (error instanceof Error && (error.message.includes('the client is offline') || error.message.includes('Could not reach'))) {
      console.error("Firebase Connection Error: The client appears to be offline or cannot reach the backend. Check your network or Firebase project status.");
      // We don't throw here to allow the app to boot in "offline-first" mode if possible.
    } else {
      console.warn("Firebase connection test warning (optional):", error);
    }
  }
}
testConnection();
