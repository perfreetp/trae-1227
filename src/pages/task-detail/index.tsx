import React, { useState, useMemo } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { mockTasks } from '@/data/tasks';
import { Task } from '@/types/task';
import { statusMap, formatWeight, formatFee } from '@/utils';
import styles from './index.module.scss';

const TaskDetailPage: React.FC = () => {
  const router = useRouter();
  const taskId = router.params.id || '1';
  const task = useMemo<Task>(() => {
    return mockTasks.find(t => t.id === taskId) || mockTasks[0];
  }, [taskId]);

  const statusConfig = statusMap[task.status];

  const timelineSteps = [
    { key: 'publish', label: '运单发布', icon: '📢', time: task.publishTime },
    { key: 'accept', label: '司机接单', icon: '✅', time: task.acceptTime },
    { key: 'loading', label: '装车完成', icon: '📦', time: task.loadingTime },
    { key: 'departure', label: '发车出发', icon: '🚚', time: task.departureTime },
    { key: 'arrival', label: '到达收货', icon: '🏁', time: task.arrivalTime },
    { key: 'complete', label: '运输完成', icon: '🎉', time: task.completeTime }
  ];

  const getStepStatus = (stepKey: string): 'done' | 'active' | 'todo' => {
    const statusOrder = ['publish', 'accept', 'loading', 'departure', 'arrival', 'complete'];
    const currentStepMap: Record<string, string> = {
      pending: 'publish',
      accepted: 'accept',
      loading: 'loading',
      transporting: 'departure',
      arrived: 'arrival',
      completed: 'complete',
      cancelled: 'publish'
    };
    const currentStep = currentStepMap[task.status] || 'publish';
    const stepIdx = statusOrder.indexOf(stepKey);
    const currentIdx = statusOrder.indexOf(currentStep);
    const step = timelineSteps.find(s => s.key === stepKey);
    if (step?.time) return 'done';
    if (stepIdx < currentIdx) return 'done';
    if (stepIdx === currentIdx) return 'active';
    return 'todo';
  };

  const handleAccept = () => {
    Taro.showModal({
      title: '确认接单',
      content: `确认承接运单${task.taskNo}？\n预估运费：¥${task.estimatedFee}`,
      success: (res) => {
        if (res.confirm) {
          Taro.showLoading({ title: '接单中...' });
          setTimeout(() => {
            Taro.hideLoading();
            Taro.showToast({ title: '接单成功', icon: 'success' });
            setTimeout(() => Taro.navigateBack(), 1000);
          }, 1000);
        }
      }
    });
  };

  const handleCall = (phone: string) => {
    Taro.makePhoneCall({
      phoneNumber: '13800138000',
      fail: () => Taro.showToast({ title: '拨号取消', icon: 'none' })
    });
  };

  const handleNavTo = () => {
    Taro.openLocation({
      latitude: task.deliveryLatitude || 30.98,
      longitude: task.deliveryLongitude || 103.85,
      name: task.deliveryAddress,
      address: task.deliveryAddress
    });
  };

  const handleHandover = () => {
    Taro.navigateTo({ url: `/pages/handover/index?id=${task.id}` });
  };

  const renderActionButtons = () => {
    switch (task.status) {
      case 'pending':
        return (
          <>
            <Button className={styles.btnGhost} onClick={() => handleCall(task.farmerPhone)}>
              <Text className={styles.btnGhostText}>📞 联系竹农</Text>
            </Button>
            <Button className={styles.btnPrimary} onClick={handleAccept}>
              <Text className={styles.btnPrimaryText}>✅ 立即接单</Text>
            </Button>
          </>
        );
      case 'accepted':
      case 'loading':
        return (
          <>
            <Button className={styles.btnGhost} onClick={() => handleCall(task.farmerPhone)}>
              <Text className={styles.btnGhostText}>📞 联系竹农</Text>
            </Button>
            <Button className={styles.btnPrimary} onClick={() => Taro.switchTab({ url: '/pages/loading-register/index' })}>
              <Text className={styles.btnPrimaryText}>📝 装车登记</Text>
            </Button>
          </>
        );
      case 'transporting':
        return (
          <>
            <Button className={styles.btnGhost} onClick={handleNavTo}>
              <Text className={styles.btnGhostText}>🧭 导航</Text>
            </Button>
            <Button className={styles.btnPrimary} onClick={() => Taro.switchTab({ url: '/pages/route-nav/index' })}>
              <Text className={styles.btnPrimaryText}>🛣️ 查看路线</Text>
            </Button>
          </>
        );
      case 'arrived':
        return (
          <>
            <Button className={styles.btnGhost} onClick={() => Taro.showToast({ title: '功能开发中', icon: 'none' })}>
              <Text className={styles.btnGhostText}>📸 补传磅单</Text>
            </Button>
            <Button className={styles.btnPrimary} onClick={handleHandover}>
              <Text className={styles.btnPrimaryText}>📱 到场扫码</Text>
            </Button>
          </>
        );
      default:
        return (
          <>
            <Button className={styles.btnGhost} onClick={() => handleCall(task.farmerPhone)}>
              <Text className={styles.btnGhostText}>📞 联系竹农</Text>
            </Button>
            <Button className={styles.btnPrimary} onClick={() => Taro.switchTab({ url: '/pages/task-hall/index' })}>
              <Text className={styles.btnPrimaryText}>🎋 返回大厅</Text>
            </Button>
          </>
        );
    }
  };

  return (
    <View className={styles.page}>
      <View className={styles.statusCard}>
        <View className={styles.statusHeader}>
          <Text className={styles.taskNo}>运单号：{task.taskNo}</Text>
          <View
            className={styles.statusTag}
            style={{ backgroundColor: `${statusConfig.color}30` }}
          >
            {statusConfig.text}
          </View>
        </View>
        <Text className={styles.statusTitle}>{statusConfig.text}</Text>
        <Text className={styles.statusDesc}>
          {task.status === 'pending' && '等待司机接单，请尽快联系竹农确认装车时间'}
          {task.status === 'accepted' && `您已接单，请于约定时间前往${task.pickupAddress.slice(0, 8)}装车`}
          {task.status === 'loading' && '正在装车，请拍照记录竹捆数量和过磅重量'}
          {task.status === 'transporting' && '正在运输途中，请安全驾驶，注意查看路况和限高限宽'}
          {task.status === 'arrived' && '已到达收购点，请扫码确认并完成交接'}
          {task.status === 'completed' && `运输已完成，运费¥${task.actualFee || task.estimatedFee}，感谢您的服务`}
        </Text>
      </View>

      <View className={styles.timelineCard}>
        <Text className={styles.cardTitle}>
          <Text className={styles.cardTitleIcon}>⏱️</Text>
          运输进度
        </Text>
        <View className={styles.timelineList}>
          {timelineSteps.map(step => {
            const stepStatus = getStepStatus(step.key);
            return (
              <View
                key={step.key}
                className={`${styles.timelineItem} ${
                  stepStatus === 'active' ? styles.timelineItemActive :
                  stepStatus === 'done' ? styles.timelineItemDone : ''
                }`}
              >
                <View className={styles.timelineLine} />
                <View className={styles.timelineDot}>
                  <Text>{step.icon}</Text>
                </View>
                <View className={styles.timelineContent}>
                  <Text className={styles.timelineTitle}>{step.label}</Text>
                  <Text className={styles.timelineTime}>
                    {step.time || (stepStatus === 'active' ? '进行中...' : '待开始')}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      <View className={styles.feeCard}>
        <View className={styles.feeRow}>
          <Text className={styles.feeLabel}>预估重量</Text>
          <Text className={styles.feeValue}>{formatWeight(task.estimatedWeight)}</Text>
        </View>
        {task.actualWeight && (
          <View className={styles.feeRow}>
            <Text className={styles.feeLabel}>实际重量</Text>
            <Text className={styles.feeValue}>{formatWeight(task.actualWeight)}</Text>
          </View>
        )}
        <View className={styles.feeRow}>
          <Text className={styles.feeLabel}>运输单价</Text>
          <Text className={styles.feeValue}>¥{task.unitPrice}/吨</Text>
        </View>
        <View className={styles.feeRow}>
          <Text className={styles.feeLabel}>预估运费</Text>
          <Text className={styles.feeTotal}>{formatFee(task.actualFee || task.estimatedFee)}</Text>
        </View>
      </View>

      <View className={styles.infoCard}>
        <Text className={styles.cardTitle}>
          <Text className={styles.cardTitleIcon}>📍</Text>
          路线信息
        </Text>
        <View className={styles.routeBlock}>
          <View className={styles.routePoint}>
            <View className={`${styles.routeIcon} ${styles.routeIconStart}`}>起</View>
            <View className={styles.routeContent}>
              <Text className={styles.routeLabel}>装货点 · 装车时间</Text>
              <Text className={styles.routeAddr}>{task.pickupAddress}</Text>
              <Text className={styles.routeLabel} style={{ marginTop: 8 }}>
                {task.loadingTime || '待确认装车时间'}
              </Text>
            </View>
          </View>
          <View className={styles.routePoint}>
            <View className={`${styles.routeIcon} ${styles.routeIconEnd}`}>终</View>
            <View className={styles.routeContent}>
              <Text className={styles.routeLabel}>收货点 · 预计到达</Text>
              <Text className={styles.routeAddr}>{task.deliveryAddress}</Text>
              <Text className={styles.routeLabel} style={{ marginTop: 8 }}>
                {task.arrivalTime || '预计发车后1.5小时'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View className={styles.infoCard}>
        <Text className={styles.cardTitle}>
          <Text className={styles.cardTitleIcon}>📋</Text>
          运单详情
        </Text>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>竹捆数量</Text>
          <Text className={styles.infoValue}>{task.bundleCount} 捆</Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>车辆限高</Text>
          <Text className={styles.infoValue}>{task.heightLimit || 4.2} 米</Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>车辆限宽</Text>
          <Text className={styles.infoValue}>{task.widthLimit || 2.5} 米</Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>车牌号码</Text>
          <Text className={styles.infoValue}>{task.plateNumber}</Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>发布时间</Text>
          <Text className={styles.infoValue}>{task.publishTime}</Text>
        </View>
        {task.remarks && (
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>备注说明</Text>
            <Text className={styles.infoValue}>{task.remarks}</Text>
          </View>
        )}
      </View>

      <View className={styles.infoCard}>
        <Text className={styles.cardTitle}>
          <Text className={styles.cardTitleIcon}>👥</Text>
          联系人信息
        </Text>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>竹农</Text>
          <Text className={styles.infoValue}>{task.farmerName} · {task.farmerPhone}</Text>
        </View>
        {task.driverName && (
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>承运司机</Text>
            <Text className={styles.infoValue}>{task.driverName} · {task.driverPhone}</Text>
          </View>
        )}
      </View>

      {task.exceptionReport && (
        <View className={styles.infoCard} style={{ borderLeft: '6rpx solid #F53F3F' }}>
          <Text className={styles.cardTitle}>
            <Text className={styles.cardTitleIcon}>⚠️</Text>
            异常上报
          </Text>
          <Text style={{ fontSize: '28rpx', color: '#4E5969', lineHeight: 1.6 }}>
            {task.exceptionReport}
          </Text>
        </View>
      )}

      {task.ratingComment && (
        <View className={styles.infoCard} style={{ borderLeft: '6rpx solid #ED6C02' }}>
          <Text className={styles.cardTitle}>
            <Text className={styles.cardTitleIcon}>⭐</Text>
            客户评价 · {task.rating}星
          </Text>
          <Text style={{ fontSize: '28rpx', color: '#4E5969', lineHeight: 1.6 }}>
            {task.ratingComment}
          </Text>
        </View>
      )}

      <View className={styles.bottomBar}>
        {renderActionButtons()}
      </View>
    </View>
  );
};

export default TaskDetailPage;
