export type SettlementStatus = 'pending' | 'approved' | 'paid' | 'rejected';

export interface Settlement {
  id: string;
  settlementNo: string;
  taskId: string;
  taskNo: string;
  driverName: string;
  plateNumber: string;
  estimatedWeight: number;
  actualWeight: number;
  unitPrice: number;
  estimatedFee: number;
  actualFee: number;
  bonusFee?: number;
  deductionFee?: number;
  deductionReason?: string;
  totalFee: number;
  status: SettlementStatus;
  applyTime: string;
  approveTime?: string;
  payTime?: string;
  remarks?: string;
}

export interface MonthlyDetail {
  month: string;
  totalOrders: number;
  totalWeight: number;
  totalDistance: number;
  totalFee: number;
  paidFee: number;
  pendingFee: number;
  details: MonthlyDetailItem[];
}

export interface MonthlyDetailItem {
  date: string;
  taskNo: string;
  plateNumber: string;
  route: string;
  weight: number;
  fee: number;
  status: string;
}
