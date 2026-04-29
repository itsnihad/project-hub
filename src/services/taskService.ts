import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  addDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Task } from '../types';
import { handleFirestoreError, OperationType } from '../lib/errorUtils';

const TASKS_COLLECTION = 'tasks';

export const taskService = {
  async getTasks(userId: string): Promise<Task[]> {
    try {
      const q = query(
        collection(db, TASKS_COLLECTION), 
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, TASKS_COLLECTION);
      return [];
    }
  },

  async addTask(data: Omit<Task, 'id' | 'createdAt'>): Promise<string> {
    const newTask = {
      ...data,
      createdAt: new Date().toISOString()
    };

    try {
      const docRef = await addDoc(collection(db, TASKS_COLLECTION), newTask);
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, TASKS_COLLECTION);
      return '';
    }
  },

  async updateTask(id: string, data: Partial<Task>): Promise<void> {
    try {
      await updateDoc(doc(db, TASKS_COLLECTION, id), data);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${TASKS_COLLECTION}/${id}`);
    }
  },

  async deleteTask(id: string): Promise<void> {
    console.log(`Attempting to delete task: ${id}`);
    try {
      await deleteDoc(doc(db, TASKS_COLLECTION, id));
      console.log(`Successfully deleted task: ${id}`);
    } catch (error) {
      console.error(`Failed to delete task: ${id}`, error);
      handleFirestoreError(error, OperationType.DELETE, `${TASKS_COLLECTION}/${id}`);
    }
  }
};
