import { Settlement, MonthlyDetail } from '@/types/settlement';

export const mockSettlements: Settlement[] = [
  {
    id: '1',
    settlementNo: 'JS20260608001',
    taskId: '6',
    taskNo: 'PZ20260607006',
    driverName: '赵师傅',
    plateNumber: '川A·33333',
    estimatedWeight: 8500,
    actualWeight: 8650,
    unitPrice: 84,
    estimatedFee: 714,
    actualFee: 727,
    totalFee: 727,
    status: 'paid',
    applyTime: '2026-06-08 12:00',
    approveTime: '2026-06-08 15:00',
    payTime: '2026-06-09 09:00'
  },
  {
    id: '2',
    settlementNo: 'JS20260608002',
    taskId: '7',
    taskNo: 'PZ20260607007',
    driverName: '孙师傅',
    plateNumber: '川A·22222',
    estimatedWeight: 7000,
    actualWeight: 7100,
    unitPrice: 80,
    estimatedFee: 560,
    actualFee: 568,
    bonusFee: 20,
    totalFee: 588,
    status: 'approved',
    applyTime: '2026-06-08 13:00',
    approveTime: '2026-06-09 10:00'
  },
  {
    id: '3',
    settlementNo: 'JS20260609003',
    taskId: '5',
    taskNo: 'PZ20260608005',
    driverName: '李师傅',
    plateNumber: '川A·55555',
    estimatedWeight: 6500,
    actualWeight: 6800,
    unitPrice: 82,
    estimatedFee: 533,
    actualFee: 557,
    totalFee: 557,
    status: 'pending',
    applyTime: '2026-06-09 10:00'
  }
];

export const mockMonthlyDetail: MonthlyDetail = {
  month: '2026-05',
  totalOrders: 28,
  totalWeight: 224.5,
  totalDistance: 1860,
  totalFee: 18650,
  paidFee: 16800,
  pendingFee: 1850,
  details: [
    {
      date: '2026-05-31',
      taskNo: 'PZ20260531001',
      plateNumber: '川A·33333',
      route: '龙门山→丽春',
      weight: 8.5,
      fee: 714,
      status: '已结'
    },
    {
      date: '2026-05-30',
      taskNo: 'PZ20260530002',
      plateNumber: '川A·33333',
      route: '白鹿→致和',
      weight: 7.2,
      fee: 604,
      status: '已结'
    },
    {
      date: '2026-05-29',
      taskNo: 'PZ20260529003',
      plateNumber: '川A·33333',
      route: '新兴→九尺',
      weight: 9.0,
      fee: 756,
      status: '已结'
    },
    {
      date: '2026-05-28',
      taskNo: 'PZ20260528004',
      plateNumber: '川A·33333',
      route: '磁峰→天彭',
      weight: 8.0,
      fee: 672,
      status: '待结'
    },
    {
      date: '2026-05-27',
      taskNo: 'PZ20260527005',
      plateNumber: '川A·33333',
      route: '桂花→濛阳',
      weight: 6.8,
      fee: 571,
      status: '已结'
    }
  ]
};
