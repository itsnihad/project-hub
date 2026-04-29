import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  Timestamp,
  addDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Order, OrderStatus } from '../types';
import { calculateValues } from '../lib/utils';
import { handleFirestoreError, OperationType } from '../lib/errorUtils';

const ORDERS_COLLECTION = 'orders';

export const orderService = {
  async getAllOrders(userId: string): Promise<Order[]> {
    try {
      const q = query(
        collection(db, ORDERS_COLLECTION), 
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, ORDERS_COLLECTION);
      return [];
    }
  },

  async addOrder(data: Partial<Order>, userId: string): Promise<string> {
    const amount = Number(data.amount || 0);
    const collab = Number(data.collaborationPercent || 0);
    const calcs = calculateValues(amount, collab);
    
    // Auto-generate a readable Order ID if not provided
    const shortId = Math.random().toString(36).substring(2, 9).toUpperCase();
    
    const newOrder: Omit<Order, 'id'> = {
      orderId: data.orderId || `ORD-${shortId}`,
      clientName: data.clientName || '',
      amount: amount,
      revenue: calcs.revenue,
      value: calcs.value,
      finalValue: calcs.finalValue,
      collaborationPercent: collab,
      siteUrl: data.siteUrl || '',
      username: data.username || '',
      password: data.password || '',
      transferredUrl: data.transferredUrl || '',
      specialNote: data.specialNote || '',
      status: (data.status as OrderStatus) || 'WIP',
      createdAt: new Date().toISOString(),
      deliveredDate: data.status === 'Delivered' ? new Date().toISOString() : null,
      userId: userId
    };

    try {
      const docRef = await addDoc(collection(db, ORDERS_COLLECTION), newOrder);
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, ORDERS_COLLECTION);
      return '';
    }
  },

  async updateOrder(id: string, data: Partial<Order>): Promise<void> {
    const updateData: any = { ...data };
    
    try {
      if (data.amount !== undefined || data.collaborationPercent !== undefined) {
        const currentDoc = await getDoc(doc(db, ORDERS_COLLECTION, id));
        const currentData = currentDoc.data() as Order;
        
        const amount = data.amount !== undefined ? Number(data.amount) : currentData.amount;
        const collab = data.collaborationPercent !== undefined ? Number(data.collaborationPercent) : currentData.collaborationPercent;
        
        const calcs = calculateValues(amount, collab);
        updateData.revenue = calcs.revenue;
        updateData.value = calcs.value;
        updateData.finalValue = calcs.finalValue;
      }

      if (data.status === 'Delivered') {
        updateData.deliveredDate = new Date().toISOString();
      } else if (data.status) {
        // If status is provided and isn't Delivered, it must be WIP or NRA
        updateData.deliveredDate = null;
      }

      await updateDoc(doc(db, ORDERS_COLLECTION, id), updateData);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${ORDERS_COLLECTION}/${id}`);
    }
  },

  async deleteOrder(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, ORDERS_COLLECTION, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${ORDERS_COLLECTION}/${id}`);
    }
  }
};
