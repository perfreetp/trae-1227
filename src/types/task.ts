export type TaskStatus = 'pending' | 'accepted' | 'loading' | 'transporting' | 'arrived' | 'completed' | 'cancelled';

export type UserRole = 'farmer' | 'driver' | 'buyer';

export interface Task {
  id: string;
  taskNo: string;
  status: TaskStatus;
  farmerName: string;
  farmerPhone: string;
  driverName?: string;
  driverPhone?: string;
  plateNumber: string;
  pickupAddress: string;
  pickupLatitude?: number;
  pickupLongitude?: number;
  deliveryAddress: string;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
  estimatedWeight: number;
  actualWeight?: number;
  bundleCount: number;
  unitPrice: number;
  estimatedFee: number;
  actualFee?: number;
  bambooPhotos?: string[];
  weightReceiptPhoto?: string;
  publishTime: string;
  acceptTime?: string;
  loadingTime?: string;
  departureTime?: string;
  arrivalTime?: string;
  completeTime?: string;
  heightLimit?: number;
  widthLimit?: number;
  remarks?: string;
  exceptionReport?: string;
  rating?: number;
  ratingComment?: string;
}

export interface TaskFilter {
  status?: TaskStatus;
  plateNumber?: string;
  keyword?: string;
}
