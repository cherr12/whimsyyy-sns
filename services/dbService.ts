
import { Post, Comment } from '../types';
// CRITICAL FIX: Use namespaced import for firestore to avoid "no exported member" errors in some environments
import * as firestore from "firebase/firestore";
import { db, isConfigValid } from "../firebaseConfig";

// Destructure from the firestore namespace to maintain the rest of the code's syntax.
// Use 'as any' casting on the namespace to satisfy the compiler when named exports are not detected in the type definitions.
const { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  onSnapshot,
  getDocs,
  arrayUnion,
  increment 
} = firestore as any;

const POSTS_COLLECTION = 'posts';

const ensureConfig = () => {
  if (!isConfigValid) {
    throw new Error("Firebase project is not configured. Please check your project settings.");
  }
};

export const dbService = {
  addPost: async (postData: Omit<Post, 'id' | 'createdAt' | 'likes' | 'comments'>): Promise<string> => {
    ensureConfig();
    try {
      const docRef = await addDoc(collection(db, POSTS_COLLECTION), {
        ...postData,
        createdAt: Date.now(),
        likes: 0,
        comments: 0,
        likedByMe: false,
        commentsList: []
      });
      return docRef.id;
    } catch (error) {
      console.error("Firestore addPost error:", error);
      throw error;
    }
  },

  subscribeToPosts: (callback: (posts: Post[]) => void) => {
    if (!isConfigValid) {
      console.warn("Firestore subscription skipped: Invalid config.");
      return () => {};
    }
    const q = query(collection(db, POSTS_COLLECTION), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot: any) => {
      const posts = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      })) as Post[];
      callback(posts);
    }, (error: any) => {
      console.error("Firestore subscription error:", error);
    });
  },

  toggleLike: async (postId: string, currentLikes: number, isLiking: boolean): Promise<void> => {
    ensureConfig();
    const postRef = doc(db, POSTS_COLLECTION, postId);
    await updateDoc(postRef, {
      likes: increment(isLiking ? 1 : -1)
    });
  },

  addComment: async (postId: string, comment: Comment): Promise<void> => {
    ensureConfig();
    const postRef = doc(db, POSTS_COLLECTION, postId);
    await updateDoc(postRef, {
      commentsList: arrayUnion(comment),
      comments: increment(1)
    });
  },

  deletePost: async (postId: string): Promise<void> => {
    ensureConfig();
    await deleteDoc(doc(db, POSTS_COLLECTION, postId));
  },

  importFromJSON: async (json: string): Promise<void> => {
    ensureConfig();
    const data = JSON.parse(json);
    if (!data.posts || !Array.isArray(data.posts)) throw new Error("Invalid backup format");
    
    for (const post of data.posts) {
      const { id, ...postData } = post;
      await addDoc(collection(db, POSTS_COLLECTION), postData);
    }
  },

  clearDatabase: async (): Promise<void> => {
    ensureConfig();
    const q = query(collection(db, POSTS_COLLECTION));
    const querySnapshot = await getDocs(q);
    const deletePromises = querySnapshot.docs.map((docSnapshot: any) => deleteDoc(docSnapshot.ref));
    await Promise.all(deletePromises);
  },

  exportToJSON: async (): Promise<string> => {
    ensureConfig();
    const q = query(collection(db, POSTS_COLLECTION), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    const posts = querySnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    return JSON.stringify({ posts, exportDate: new Date().toISOString() }, null, 2);
  }
};
