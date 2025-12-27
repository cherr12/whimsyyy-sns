
import { initializeApp, getApp, getApps } from "firebase/app";
// CRITICAL FIX: Use namespaced import for firestore to avoid "no exported member" errors
import * as firestore from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Environment variables are preferred for security and flexibility.
export const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyADuDCD5J5k8TxRVwkpdKKZtIHkODv__tM",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "whimsyyy-sns.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "whimsyyy-sns",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "whimsyyy-sns.firebasestorage.app",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "894638916604",
  appId: process.env.FIREBASE_APP_ID || "1:894638916604:web:6640cb68b9c61718f0a879",
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || "G-MSLJR98FVR"
};

// Check if the config is valid
const isConfigValid = firebaseConfig.projectId && firebaseConfig.projectId !== "YOUR_PROJECT_ID";

if (!isConfigValid) {
  console.error(
    "Firebase Error: You are still using placeholder config. " +
    "Please update firebaseConfig.ts with your actual Firebase project credentials."
  );
}

// Singleton pattern for Firebase initialization
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

/**
 * CRITICAL FIX for "Could not reach Cloud Firestore backend":
 * We use initializeFirestore with experimentalForceLongPolling enabled.
 * This resolves issues where WebSockets are blocked or unstable in certain dev environments.
 */
export const db = (firestore as any).initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

export const auth = getAuth(app);
export { isConfigValid };
