import React, { useState, useMemo } from 'react';
import { View, Text, Button, Input } from '@tarojs/components';
import Taro, { usePullDownRefresh } from '@tarojs/taro';
import { mockTasks } from '@/data/tasks';
import { Task, TaskStatus } from '@/types/task';
import { statusMap, formatFee, formatWeight, formatTime } from '@/utils';
import EmptyState from '@/components/EmptyState';
import styles from './index.module.scss';

const getOrderTime = (order: Task): string => {
  if (order.status === 'completed') {
    return order.completeTime || order.arrivalTime || order.publishTime;
  }
  return order.publishTime;
};

const getOrderTimeLabel = (order: Task): string => {
  if (order.status === 'completed') return '完成于';
  if (order.status === 'arrived') return '到达于';
  if (order.status === 'transporting') return '运输中 · 发布于';
  if (order.status === 'loading') return '装车中 · 发布于';
  if (order.status === 'accepted') return '已接单 · 发布于';
  if (order.status === 'cancelled') return '已取消 · 发布于';
  return '发布于';
};

const HistoryOrdersPage: React.FC = () => {
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [orders, setOrders] = useState<Task[]>(mockTasks);

  usePullDownRefresh(() => {
    setTimeout(() => {
      Taro.stopPullDownRefresh();
      Taro.showToast({ title: '刷新成功', icon: 'success' });
    }, 800);
  });

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      if (statusFilter !== 'all' && order.status !== statusFilter) return false;
      if (keyword) {
        const kw = keyword.toLowerCase();
        const matchNo = order.taskNo.toLowerCase().includes(kw);
        const matchPlate = order.plateNumber.toLowerCase().includes(kw);
        const matchPickup = order.pickupAddress.includes(kw);
        const matchDelivery = order.deliveryAddress.includes(kw);
        if (!matchNo && !matchPlate && !matchPickup && !matchDelivery) return false;
      }
      return true;
    });
  }, [orders, statusFilter, keyword]);

  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const completedOrders = orders.filter(o => o.status === 'completed').length;
    const totalWeight = orders.reduce((sum, o) => sum + (o.actualWeight || o.estimatedWeight || 0), 0);
    const totalFee = orders.reduce((sum, o) => sum + (o.actualFee || o.estimatedFee || 0), 0);
    return { totalOrders, completedOrders, totalWeight, totalFee };
  }, [orders]);

  const handleViewDetail = (order: Task) => {
    Taro.navigateTo({ url: `/pages/task-detail/index?id=${order.id}` });
  };

  const handleSettlement = (order: Task) => {
    Taro.navigateTo({ url: `/pages/settlement/index?taskId=${order.id}` });
  };

  const handleRate = (order: Task) => {
    Taro.navigateTo({ url: `/pages/rating/index?taskId=${order.id}` });
  };

  const handleFilter = () => {
    Taro.showToast({ title: '筛选条件已应用', icon: 'success' });
  };

  const handleResetFilter = () => {
    setKeyword('');
    setStatusFilter('all');
    setStartDate('');
    setEndDate('');
    Taro.showToast({ title: '已重置筛选', icon: 'success' });
  };

  const statusChips = [
    { key: 'all', label: '全部' },
    { key: 'completed', label: '已完成' },
    { key: 'arrived', label: '已到达' },
    { key: 'transporting', label: '运输中' },
    { key: 'loading', label: '装货中' },
    { key: 'accepted', label: '已接单' },
    { key: 'pending', label: '待接单' },
    { key: 'cancelled', label: '已取消' }
  ];

  return (
    <View className={styles.page}>
      <View className={styles.filterBar}>
        <View className={styles.searchRow}>
          <Input
            className={styles.searchInput}
            placeholder="搜索运单号/车牌/地址..."
            value={keyword}
            onInput={(e) => setKeyword(e.detail.value)}
          />
          <Button className={styles.filterBtn} onClick={handleFilter}>筛选</Button>
          <Button className={styles.filterBtn} onClick={handleResetFilter}>重置</Button>
        </View>
        <View className={styles.statusChips}>
          {statusChips.map(chip => (
            <View
              key={chip.key}
              className={`${styles.chip} ${statusFilter === chip.key ? styles.chipActive : ''}`}
              onClick={() => setStatusFilter(chip.key as any)}
            >
              {chip.label}
            </View>
          ))}
        </View>
      </View>

      <View className={styles.statsRow}>
        <View className={styles.statCard}>
          <Text className={styles.statValue}>{stats.totalOrders}</Text>
          <Text className={styles.statLabel}>总运单</Text>
        </View>
        <View className={styles.statCard}>
          <Text className={styles.statValue}>{stats.completedOrders}</Text>
          <Text className={styles.statLabel}>已完成</Text>
        </View>
        <View className={styles.statCard}>
          <Text className={styles.statValue}>{(stats.totalWeight / 1000).toFixed(1)}吨</Text>
          <Text className={styles.statLabel}>总载重</Text>
        </View>
        <View className={styles.statCard}>
          <Text className={styles.statValueFee}>{formatFee(stats.totalFee)}</Text>
          <Text className={styles.statLabel}>总收入</Text>
        </View>
      </View>

      {filteredOrders.length === 0 ? (
        <EmptyState
          icon="📦"
          text="暂无运单记录"
          description={keyword || statusFilter !== 'all' ? '试试调整搜索词或筛选条件' : '快去任务大厅接第一单吧'}
          actionText={keyword || statusFilter !== 'all' ? '重置筛选' : '去任务大厅'}
          onAction={() => {
            if (keyword || statusFilter !== 'all') {
              handleResetFilter();
            } else {
              Taro.switchTab({ url: '/pages/task-hall/index' });
            }
          }}
        />
      ) : (
        filteredOrders.map(order => {
          const statusInfo = statusMap[order.status];
          return (
            <View key={order.id} className={styles.orderCard}>
              <View className={styles.orderHeader}>
                <View>
                  <Text className={styles.orderNo}>{order.taskNo}</Text>
                  <Text className={styles.orderDate}> · {getOrderTimeLabel(order)} {formatTime(getOrderTime(order))}</Text>
                </View>
                <View
                  className={styles.statusBadge}
                  style={{ color: statusInfo.color, background: statusInfo.bgColor }}
                >
                  {statusInfo.text}
                </View>
              </View>

              <View className={styles.routeSection}>
                <View className={styles.routeItem}>
                  <View className={`${styles.routeDot} ${styles.routeStartDot}`} />
                  <View className={styles.routeContent}>
                    <Text className={styles.routeText}>装货点</Text>
                    <Text className={styles.routeAddr}>{order.pickupAddress}</Text>
                  </View>
                </View>
                <View className={styles.routeItem}>
                  <View className={styles.routeLine} />
                </View>
                <View className={styles.routeItem}>
                  <View className={`${styles.routeDot} ${styles.routeEndDot}`} />
                  <View className={styles.routeContent}>
                    <Text className={styles.routeText}>收货点</Text>
                    <Text className={styles.routeAddr}>{order.deliveryAddress}</Text>
                  </View>
                </View>
              </View>

              <View className={styles.infoGrid}>
                <View className={styles.infoItem}>
                  <Text className={styles.infoValue}>{formatWeight(order.actualWeight || order.estimatedWeight)}</Text>
                  <Text className={styles.infoLabel}>重量</Text>
                </View>
                <View className={styles.infoItem}>
                  <Text className={styles.infoValue}>{order.bundleCount || '--'}捆</Text>
                  <Text className={styles.infoLabel}>竹捆数</Text>
                </View>
                <View className={styles.infoItem}>
                  <Text className={styles.infoValueFee}>{formatFee(order.actualFee || order.estimatedFee)}</Text>
                  <Text className={styles.infoLabel}>运费</Text>
                </View>
              </View>

              <View className={styles.orderFooter}>
                <Button className={`${styles.footerBtn} ${styles.secondaryBtn}`} onClick={() => handleViewDetail(order)}>
                  查看详情
                </Button>
                {order.status === 'completed' && (
                  <Button className={`${styles.footerBtn} ${styles.amberBtn}`} onClick={() => handleRate(order)}>
                    ⭐ 去评价
                  </Button>
                )}
                {(order.status === 'completed' || order.status === 'arrived') && (
                  <Button className={`${styles.footerBtn} ${styles.primaryBtn}`} onClick={() => handleSettlement(order)}>
                    💰 结算
                  </Button>
                )}
              </View>
            </View>
          );
        })
      )}
    </View>
  );
};

export default HistoryOrdersPage;
