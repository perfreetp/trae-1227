import { Message } from '@/types/user';

export const mockMessages: Message[] = [
  {
    id: '1',
    type: 'weather',
    title: '暴雨橙色预警',
    content: '彭州市气象台发布暴雨橙色预警信号：预计未来6小时我市龙门山、小鱼洞、白鹿等乡镇降雨量将达50毫米以上，请相关运输司机注意防范山区道路滑坡风险。',
    time: '2026-06-09 07:30',
    isRead: false,
    level: 'urgent'
  },
  {
    id: '2',
    type: 'road',
    title: '道路施工通知',
    content: '彭州市S106省道小鱼洞段（K45+200至K46+800）将于6月10日至6月15日进行路面养护施工，期间单向通行，请运输车辆提前规划绕行路线。',
    time: '2026-06-09 06:00',
    isRead: false,
    level: 'warning'
  },
  {
    id: '3',
    type: 'task',
    title: '新任务提醒',
    content: '王大爷发布了一条从龙门山镇到丽春镇的运输任务，重量约8吨，请及时前往任务大厅接单。',
    time: '2026-06-09 08:30',
    isRead: false,
    level: 'normal'
  },
  {
    id: '4',
    type: 'system',
    title: '结算通知',
    content: '您申请的PZ20260607006号运单费用727元已审核通过，预计3个工作日内到账，请查收。',
    time: '2026-06-09 10:00',
    isRead: true,
    level: 'normal'
  },
  {
    id: '5',
    type: 'weather',
    title: '高温天气提示',
    content: '今日彭州市最高气温将达35°C，建议运输司机做好防暑降温措施，合理安排休息时间，避免疲劳驾驶。',
    time: '2026-06-09 05:00',
    isRead: true,
    level: 'warning'
  },
  {
    id: '6',
    type: 'road',
    title: '限高路段提醒',
    content: '磁桂路K12+300处龙门桥因维修加固设置限高3.5米，请超高车辆提前绕行湔江路。',
    time: '2026-06-08 16:30',
    isRead: true,
    level: 'warning'
  },
  {
    id: '7',
    type: 'task',
    title: '任务完成提醒',
    content: '恭喜！您承运的PZ20260607007号运单已顺利完成，获得5星级好评，继续加油！',
    time: '2026-06-08 12:00',
    isRead: true,
    level: 'normal'
  },
  {
    id: '8',
    type: 'system',
    title: '版本更新通知',
    content: '彭州竹运助手已更新至V1.2.0版本，新增月度明细导出功能和异常上报优化，点击查看更新详情。',
    time: '2026-06-07 14:00',
    isRead: true,
    level: 'normal'
  }
];
