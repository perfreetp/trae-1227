import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { mockTasks } from '@/data/tasks';
import { mockSettlements } from '@/data/orders';
import { Task } from '@/types/task';
import { Settlement } from '@/types/settlement';
import { statusMap, settlementStatusMap, formatWeight, formatFee } from '@/utils';
import styles from './index.module.scss';

const RECENT_VIEW_KEY = 'task_hall_recent_view_v1';

interface OperationTrail {
  key: string;
  icon: string;
  title: string;
  time: string;
  result?: string;
  detail?: string;
}

const saveRecentView = (taskId: string, taskNo: string, taskTitle: string) => {
  try {
    const raw = Taro.getStorageSync(RECENT_VIEW_KEY);
    let list: Array<{ id: string; taskNo: string; title: string; viewAt: string }> = [];
    if (raw && Array.isArray(raw)) list = raw;
    list = list.filter(x => x.id !== taskId);
    list.unshift({
      id: taskId,
      taskNo,
      title: taskTitle,
      viewAt: new Date().toLocaleString('zh-CN', {
        month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
      }).replace(/\//g, '-')
    });
    Taro.setStorageSync(RECENT_VIEW_KEY, list.slice(0, 5));
  } catch (_) {}
};

const TaskDetailPage: React.FC = () => {
  const router = useRouter();
  const paramId = router.params.id;
  const paramTaskNo = router.params.taskNo;

  const task = useMemo<Task | null>(() => {
    if (paramId) {
      const found = mockTasks.find(t => t.id === paramId);
      if (found) return found;
    }
    if (paramTaskNo) {
      const found = mockTasks.find(t => t.taskNo === paramTaskNo);
      if (found) return found;
    }
    return mockTasks[0] || null;
  }, [paramId, paramTaskNo]);

  useEffect(() => {
    if (task) {
      saveRecentView(
        task.id,
        task.taskNo,
        `${task.pickupAddress.slice(0, 8)}→${task.deliveryAddress.slice(0, 8)}`
      );
    }
  }, [task?.id]);

  if (!task) {
    return (
      <View className={styles.page}>
        <View style={{ padding: '100rpx 32rpx', textAlign: 'center' }}>
          <Text style={{ fontSize: '48rpx', marginBottom: '24rpx' }}>📦</Text>
          <Text style={{ color: '#86909C' }}>未找到对应运单</Text>
        </View>
      </View>
    );
  }

  const statusConfig = statusMap[task.status];

  const linkedSettlement = useMemo<Settlement | undefined>(() => {
    return mockSettlements.find(
      s => s.taskId === task.id || s.taskNo === task.taskNo
    );
  }, [task.id, task.taskNo]);

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

  const operationTrail = useMemo<OperationTrail[]>(() => {
    const trails: OperationTrail[] = [];
    trails.push({
      key: 'loading-reg',
      icon: '📝',
      title: '装车登记',
      time: task.loadingTime || '--',
      result: task.loadingTime ? '已完成' : '待操作',
      detail: task.bundleCount
        ? `竹捆 ${task.bundleCount} 捆 · ${formatWeight(task.estimatedWeight)}`
        : '待录入装车信息'
    });
    if (task.bambooPhotos && task.bambooPhotos.length > 0) {
      trails.push({
        key: 'bamboo-photo',
        icon: '📸',
        title: '竹子拍照',
        time: task.loadingTime || task.acceptTime || '--',
        result: '已上传',
        detail: `已上传 ${task.bambooPhotos.length} 张竹子照片`
      });
    }
    if (task.weightReceiptPhoto) {
      trails.push({
        key: 'weight-receipt',
        icon: '🧾',
        title: '过磅单上传',
        time: task.arrivalTime || task.departureTime || '--',
        result: '已上传',
        detail: `实际重量 ${formatWeight(task.actualWeight || task.estimatedWeight)}`
      });
    } else if (task.actualWeight) {
      trails.push({
        key: 'weight-confirm',
        icon: '⚖️',
        title: '过磅确认',
        time: task.departureTime || '--',
        result: '已确认',
        detail: `实际重量 ${formatWeight(task.actualWeight)}`
      });
    }
    if (task.exceptionReport) {
      trails.push({
        key: 'exception',
        icon: '⚠️',
        title: '异常上报',
        time: task.departureTime || task.loadingTime || '--',
        result: '已处理',
        detail: task.exceptionReport
      });
    }
    if (task.status === 'arrived' || task.arrivalTime) {
      trails.push({
        key: 'handover',
        icon: '📱',
        title: '扫码交接',
        time: task.arrivalTime || '--',
        result: task.status === 'completed' ? '已完成交接' : '待扫码确认',
        detail: task.status === 'completed' ? '收购点已确认收货' : '请出示运单二维码扫描'
      });
    }
    if (linkedSettlement) {
      const sConfig = settlementStatusMap[linkedSettlement.status];
      trails.push({
        key: 'settlement',
        icon: '💰',
        title: '结算申请',
        time: linkedSettlement.applyTime,
        result: sConfig.text,
        detail: `${linkedSettlement.settlementNo} · ${formatFee(linkedSettlement.totalFee)}${
          linkedSettlement.status === 'paid' && linkedSettlement.payTime
            ? ` · 到账时间 ${linkedSettlement.payTime}`
            : ''
        }`
      });
    } else if (task.status === 'completed' || task.status === 'arrived') {
      trails.push({
        key: 'settlement-pending',
        icon: '💰',
        title: '结算申请',
        time: '--',
        result: '待申请',
        detail: `${task.status === 'completed' ? '运输已完成' : '已到达收购点'}，可以申请结算`
      });
    }
    if (task.rating || task.ratingComment) {
      trails.push({
        key: 'rating',
        icon: '⭐',
        title: '客户评价',
        time: task.completeTime || '--',
        result: `${task.rating || 5}.0 星`,
        detail: task.ratingComment || '用户已提交评价'
      });
    }
    return trails;
  }, [task, linkedSettlement]);

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

  const handleGoSettlement = () => {
    Taro.navigateTo({ url: `/pages/settlement/index?taskId=${task.id}` });
  };

  const handleGoRating = () => {
    Taro.navigateTo({ url: `/pages/rating/index?taskId=${task.id}` });
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
      case 'completed':
        return (
          <>
            {!linkedSettlement ? (
              <Button className={styles.btnGhost} onClick={handleGoSettlement}>
                <Text className={styles.btnGhostText}>💰 申请结算</Text>
              </Button>
            ) : (
              <Button className={styles.btnGhost} onClick={handleGoSettlement}>
                <Text className={styles.btnGhostText}>💳 查看结算</Text>
              </Button>
            )}
            {!task.rating ? (
              <Button className={styles.btnPrimary} onClick={handleGoRating}>
                <Text className={styles.btnPrimaryText}>⭐ 评价合作方</Text>
              </Button>
            ) : (
              <Button className={styles.btnPrimary} onClick={() => Taro.switchTab({ url: '/pages/task-hall/index' })}>
                <Text className={styles.btnPrimaryText}>🎋 返回大厅</Text>
              </Button>
            )}
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
          {task.status === 'completed' && `运输已完成，运费${formatFee(task.actualFee || task.estimatedFee)}，感谢您的服务`}
        </Text>
      </View>

      {linkedSettlement && (
        <View
          className={styles.infoCard}
          style={{
            borderLeft: `6rpx solid ${settlementStatusMap[linkedSettlement.status].color}`,
            background: `${settlementStatusMap[linkedSettlement.status].bgColor}50`
          }}
        >
          <Text className={styles.cardTitle}>
            <Text className={styles.cardTitleIcon}>💳</Text>
            结算状态 · {settlementStatusMap[linkedSettlement.status].text}
          </Text>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>结算单号</Text>
            <Text
              className={styles.infoValue}
              style={{ color: settlementStatusMap[linkedSettlement.status].color, fontWeight: 600 }}
            >
              {linkedSettlement.settlementNo}
            </Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>结算金额</Text>
            <Text className={styles.infoValue}>
              {formatFee(linkedSettlement.totalFee)}
              {linkedSettlement.status === 'paid' && linkedSettlement.payTime
                ? ` · 已到账 ${linkedSettlement.payTime}`
                : linkedSettlement.status === 'approved'
                  ? ' · 待平台打款'
                  : linkedSettlement.status === 'pending'
                    ? ' · 平台审核中'
                    : ''}
            </Text>
          </View>
          <Button
            className={styles.btnPrimary}
            style={{ marginTop: '20rpx', height: '72rpx', boxShadow: 'none' }}
            onClick={handleGoSettlement}
          >
            <Text className={styles.btnPrimaryText}>查看完整结算单 →</Text>
          </Button>
        </View>
      )}

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

      <View className={styles.timelineCard}>
        <Text className={styles.cardTitle}>
          <Text className={styles.cardTitleIcon}>📜</Text>
          操作轨迹
        </Text>
        <View className={styles.timelineList}>
          {operationTrail.map((trail, idx) => (
            <View
              key={trail.key}
              className={`${styles.timelineItem} ${
                idx === operationTrail.length - 1
                  ? styles.timelineItemActive
                  : styles.timelineItemDone
              }`}
            >
              <View className={styles.timelineLine} />
              <View className={styles.timelineDot}>
                <Text>{trail.icon}</Text>
              </View>
              <View className={styles.timelineContent}>
                <View style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text className={styles.timelineTitle}>{trail.title}</Text>
                  <Text style={{
                    fontSize: '22rpx',
                    color: idx === operationTrail.length - 1 ? '#2E7D32' : '#4E5969',
                    fontWeight: 600,
                    flexShrink: 0,
                    marginLeft: '16rpx'
                  }}>
                    {trail.result}
                  </Text>
                </View>
                <Text className={styles.timelineTime}>{trail.time}</Text>
                {trail.detail && (
                  <Text style={{
                    fontSize: '24rpx',
                    color: '#86909C',
                    marginTop: '8rpx',
                    lineHeight: 1.5
                  }}>
                    {trail.detail}
                  </Text>
                )}
              </View>
            </View>
          ))}
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
          <Text className={styles.feeLabel}>
            {task.status === 'completed' ? '实际运费' : '预估运费'}
          </Text>
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
              <Text className={styles.routeLabel}>收货点 · 到达时间</Text>
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

      <View className={styles.bottomBar}>
        {renderActionButtons()}
      </View>
    </View>
  );
};

export default TaskDetailPage;
