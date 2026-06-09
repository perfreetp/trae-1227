import { TaskStatus } from '@/types/task';
import { MessageType } from '@/types/user';
import { SettlementStatus } from '@/types/settlement';

export const statusMap: Record<TaskStatus, { text: string; color: string; bgColor: string }> = {
  pending: { text: '待接单', color: '#FF7D00', bgColor: '#FFF3E0' },
  accepted: { text: '已接单', color: '#1976D2', bgColor: '#E3F2FD' },
  loading: { text: '装货中', color: '#7B1FA2', bgColor: '#F3E5F5' },
  transporting: { text: '运输中', color: '#165DFF', bgColor: '#E8F0FF' },
  arrived: { text: '已到达', color: '#ED6C02', bgColor: '#FFF3E0' },
  completed: { text: '已完成', color: '#00B42A', bgColor: '#E8FFEA' },
  cancelled: { text: '已取消', color: '#86909C', bgColor: '#F2F3F5' }
};

export const messageTypeMap: Record<MessageType, { text: string; color: string }> = {
  weather: { text: '天气预警', color: '#ED6C02' },
  road: { text: '道路通知', color: '#1976D2' },
  system: { text: '系统通知', color: '#2E7D32' },
  task: { text: '任务提醒', color: '#7B1FA2' }
};

export const settlementStatusMap: Record<SettlementStatus, { text: string; color: string; bgColor: string }> = {
  pending: { text: '待审核', color: '#FF7D00', bgColor: '#FFF3E0' },
  approved: { text: '已审核', color: '#165DFF', bgColor: '#E8F0FF' },
  paid: { text: '已支付', color: '#00B42A', bgColor: '#E8FFEA' },
  rejected: { text: '已驳回', color: '#F53F3F', bgColor: '#FFEBEE' }
};

export const formatFee = (fee: number): string => {
  return `¥${fee.toFixed(0)}`;
};

export const formatWeight = (weight: number): string => {
  if (weight >= 1000) {
    return `${(weight / 1000).toFixed(1)}吨`;
  }
  return `${weight}公斤`;
};

export const formatTime = (timeStr: string): string => {
  const now = new Date();
  const time = new Date(timeStr.replace(/-/g, '/'));
  const diffMs = now.getTime() - time.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 7) return `${diffDays}天前`;
  return timeStr.slice(5);
};

export const roleMap = {
  farmer: '竹农',
  driver: '司机',
  buyer: '收购点'
};
