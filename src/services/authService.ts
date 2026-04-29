import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  deleteDoc,
  query, 
  where,
  addDoc 
} from 'firebase/firestore';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updatePassword
} from 'firebase/auth';
import { db, auth } from '../lib/firebase';
import { AppUser } from '../types';

const USERS_COLLECTION = 'users';

const getEmail = (username: string) => `${username.toLowerCase()}@orderdash.com`;

export const authService = {
  async login(username: string, password: string): Promise<AppUser | null> {
    try {
      const cleanUsername = username.trim().toLowerCase();
      const q = query(collection(db, USERS_COLLECTION), where('username', '==', cleanUsername));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        // Bootstrap 'nihad' if he doesn't exist
        if (cleanUsername === 'nihad' && password === 'Nihad90#') {
          const newUser: AppUser = {
            id: 'admin-nihad',
            username: 'nihad',
            role: 'admin',
            password: 'Nihad90#'
          };
          await setDoc(doc(db, USERS_COLLECTION, newUser.id), {
            username: newUser.username,
            role: newUser.role,
            password: newUser.password
          });
          return newUser;
        }
        return null;
      }

      const userData = snapshot.docs[0].data();
      const user = { ...userData, id: snapshot.docs[0].id } as AppUser;

      if (user.password === password) {
        return user;
      }
      
      return null;
    } catch (err: any) {
      console.error(err);
      throw new Error('SYSTEM ERROR: Could not verify identity. Check Firestore connection.');
    }
  },

  async loginWithPin(username: string, pin: string): Promise<AppUser | null> {
    try {
      if (!username) return null;
      const cleanUsername = username.trim().toLowerCase();
      const q = query(collection(db, USERS_COLLECTION), where('username', '==', cleanUsername));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) return null;

      const userData = snapshot.docs[0].data();
      // Convert both to string to ensure matching works regardless of storage type
      if (String(userData.pin) === String(pin)) {
        return { ...userData, id: snapshot.docs[0].id } as AppUser;
      }
    } catch (err) {
      console.error('PIN Auth Error:', err);
    }
    return null;
  },

  async setPin(userId: string, pin: string): Promise<void> {
    await setDoc(doc(db, USERS_COLLECTION, userId), { pin }, { merge: true });
  },

  async createUser(data: Omit<AppUser, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, USERS_COLLECTION), {
        username: data.username,
        role: data.role,
        password: data.password
      });
      return docRef.id;
    } catch (err: any) {
      console.error(err);
      throw new Error('SYSTEM ERROR: Failed to provision entity registry.');
    }
  },

  async getUsers(): Promise<AppUser[]> {
    const snapshot = await getDocs(collection(db, USERS_COLLECTION));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppUser));
  },

  async deleteUser(userId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, USERS_COLLECTION, userId));
    } catch (err) {
      console.error('Delete user error:', err);
      throw err;
    }
  },

  async checkUser(username: string): Promise<{ exists: boolean; hasPin: boolean } | null> {
    try {
      const cleanUsername = username.trim().toLowerCase();
      const q = query(collection(db, USERS_COLLECTION), where('username', '==', cleanUsername));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) return null;
      
      const userData = snapshot.docs[0].data();
      return {
        exists: true,
        hasPin: !!userData.pin
      };
    } catch (err) {
      console.error(err);
      return null;
    }
  }
};
