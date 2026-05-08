import { initializeApp } from 'firebase/app';
import { initializeAuth, browserLocalPersistence, browserPopupRedirectResolver } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, enableIndexedDbPersistence } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Enable offline persistence
if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      // Multiple tabs open, persistence can only be enabled
      // in one tab at a a time.
      console.warn('Firestore persistence failed: Multiple tabs open');
    } else if (err.code === 'unimplemented') {
      // The current browser does not support all of the
      // features required to enable persistence
      console.warn('Firestore persistence failed: Browser not supported');
    }
  });
}

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

// Test connection on boot
async function testConnection() {
  try {
    const path = 'test/connection';
    await getDocFromServer(doc(db, path));
    console.log('Firebase connection successful');
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration: Client is offline.");
    } else {
      console.error("Firebase connection test failed:", error);
    }
  }
}
testConnection();
