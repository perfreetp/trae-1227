export type MessageType = 'weather' | 'road' | 'system' | 'task';

export interface Message {
  id: string;
  type: MessageType;
  title: string;
  content: string;
  time: string;
  isRead: boolean;
  level?: 'normal' | 'warning' | 'urgent';
}

export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  role: 'farmer' | 'driver' | 'buyer';
  avatar?: string;
  plateNumber?: string;
  vehicleType?: string;
  idCard?: string;
  address?: string;
  totalOrders: number;
  totalFee: number;
  rating: number;
  joinTime: string;
}

export interface Rating {
  id: string;
  taskId: string;
  fromUserId: string;
  toUserId: string;
  score: number;
  comment: string;
  createTime: string;
}
