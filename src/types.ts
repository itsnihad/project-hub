export type OrderStatus = 'WIP' | 'NRA' | 'Delivered';

export type TaskPriority = 'Low' | 'Medium' | 'High';
export type TaskStatus = 'Pending' | 'In Progress' | 'Completed';

export interface Task {
  id: string;
  title: string;
  description?: string;
  orderId?: string; // Related Order
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  createdAt: string;
  userId: string;
}

export interface Order {
  id: string;
  orderId: string;
  clientName: string;
  amount: number;
  revenue: number;
  value: number;
  finalValue: number;
  collaborationPercent: number;
  siteUrl: string;
  username: string;
  password: string;
  transferredUrl: string;
  specialNote: string;
  status: OrderStatus;
  createdAt: string;
  deliveredDate: string | null;
  userId: string;
}

export interface AppUser {
  id: string;
  username: string;
  role: 'admin' | 'user';
  pin?: string;
  password?: string;
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: 'create' | 'update' | 'delete' | 'list' | 'get' | 'write';
  path: string | null;
  authInfo: {
    userId: string;
    email: string;
    emailVerified: boolean;
    isAnonymous: boolean;
    providerInfo: { providerId: string; displayName: string; email: string; }[];
  }
}
