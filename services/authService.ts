
import { 
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged, 
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "firebase/auth";
import { auth, firebaseConfig } from "../firebaseConfig";
import { User } from "../types";

const googleProvider = new GoogleAuthProvider();

export const authService = {
  /**
   * Primary Login: Uses Redirect instead of Popup to solve 'auth/popup-blocked' errors.
   * This will navigate the user away from the app to Google's login page.
   */
  loginWithGoogle: async () => {
    try {
      return await signInWithRedirect(auth, googleProvider);
    } catch (error: any) {
      console.error("Firebase Redirect Login Error:", error.code, error.message);
      throw error;
    }
  },

  /**
   * Processes the result of a redirect-based login.
   * Should be called when the app mounts.
   */
  handleRedirectResult: async (): Promise<FirebaseUser | null> => {
    try {
      const result = await getRedirectResult(auth);
      if (result) {
          console.log("Login successful via redirect:", result.user.email);
          return result.user;
      }
      return null;
    } catch (error: any) {
      if (error.code === 'auth/unauthorized-domain') {
          console.group("%c🔥 Firebase Domain Auth Required", "color: white; background: #e11d48; padding: 4px 8px; border-radius: 4px; font-weight: bold;");
          console.log("1. Go to: https://console.firebase.google.com/project/" + firebaseConfig.projectId + "/authentication/settings");
          console.log("2. Add this domain to 'Authorized domains':", window.location.hostname);
          console.groupEnd();
      }
      console.error("Redirect Result Error:", error);
      // Re-throw to allow App.tsx to catch and show the help UI
      throw error;
    }
  },

  loginWithEmail: async (email: string, pass: string) => {
    return await signInWithEmailAndPassword(auth, email, pass);
  },

  registerWithEmail: async (email: string, pass: string) => {
    return await createUserWithEmailAndPassword(auth, email, pass);
  },

  logout: async () => {
    return signOut(auth);
  },

  onAuthStateChange: (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        const user: User = {
          id: fbUser.uid,
          name: fbUser.displayName || 'Anonymous User',
          handle: fbUser.email?.split('@')[0] || 'user',
          avatarUrl: fbUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${fbUser.uid}`,
          defaultTheme: 'dark'
        };
        callback(user);
      } else {
        callback(null);
      }
    });
  },

  isAuthenticated: (): boolean => {
    return !!auth.currentUser;
  }
};
