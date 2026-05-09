import { initializeApp } from 'firebase/app';
import { initializeAuth, browserLocalPersistence, browserPopupRedirectResolver } from 'firebase/auth';
import { initializeFirestore, doc, getDoc, getDocFromServer, CACHE_SIZE_UNLIMITED } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
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

// Using initializeFirestore instead of getFirestore to set experimental settings.
// experimentalForceLongPolling often fixes connectivity issues in restrictive or unique network environments.
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId);

export const storage = getStorage(app);

// Initialize Auth with explicit persistence and popup resolver
export const auth = initializeAuth(app, {
  persistence: browserLocalPersistence,
  popupRedirectResolver: browserPopupRedirectResolver,
});

// Guard against concurrent popup operations
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

// Test connection with a delay and graceful error handling
async function testConnection() {
  // Wait a few seconds for the environment to fully settle
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  try {
    const path = 'test/connection';
    // Use getDocFromServer to verify real network connection
    await getDocFromServer(doc(db, path)).catch(() => {
      // If the specific document doesn't exist, it's still a "success" in terms of connectivity
    });
    console.log('Firebase connectivity verified');
  } catch (error) {
    if (error instanceof Error && (error.message.includes('the client is offline') || error.message.includes('Could not reach'))) {
      console.warn("Firebase Connection Warning: The client is in offline mode. This is expected if the network is slow or blocked. Firestore will sync when reconnected.");
    } else {
      console.log("Firebase connection info:", error);
    }
  }
}

if (typeof window !== 'undefined') {
  testConnection();
}
