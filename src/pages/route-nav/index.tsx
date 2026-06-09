import React, { useState, useMemo } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import EmptyState from '@/components/EmptyState';
import { mockTasks } from '@/data/tasks';
import { Task } from '@/types/task';
import { formatWeight } from '@/utils';
import styles from './index.module.scss';

const activeTasks = mockTasks.filter(t => t.status === 'transporting' || t.status === 'loading' || t.status === 'accepted');

const RouteNavPage: React.FC = () => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(activeTasks[0] || null);

  const heightLimits = useMemo(() => [
    { name: '磁桂路龙门桥', limit: 3.5, position: 'K12+300处', isWarning: (selectedTask?.heightLimit || 0) > 3.5 },
    { name: 'S106省道跨线桥', limit: 4.0, position: 'K45+200处', isWarning: (selectedTask?.heightLimit || 0) > 4.0 },
    { name: '湔江路隧道', limit: 4.5, position: 'K8+500处', isWarning: false }
  ], [selectedTask]);

  const widthLimits = useMemo(() => [
    { name: '小鱼洞镇江桥村道', limit: 2.3, position: '村口段500米', isWarning: (selectedTask?.widthLimit || 0) > 2.3 },
    { name: '白鹿镇水观村山路', limit: 2.5, position: 'K3+200至K5+800', isWarning: false }
  ], [selectedTask]);

  const roadConditions = [
    { type: 'normal', title: '道路通畅', desc: '彭白路全线通行正常', pos: 'K0 - K35' },
    { type: 'slow', title: '车流量大', desc: '葛仙山旅游公路车多缓行', pos: 'K15+000 - K22+500' },
    { type: 'bad', title: '路面施工', desc: 'S106省道单侧通行，预计延误30分钟', pos: 'K45+200 - K46+800' }
  ];

  const selectTask = () => {
    if (activeTasks.length === 0) {
      Taro.showToast({ title: '暂无进行中任务', icon: 'none' });
      return;
    }
    Taro.showActionSheet({
      itemList: activeTasks.map(t => `${t.taskNo} · ${t.pickupAddress.slice(0, 10)}→${t.deliveryAddress.slice(0, 8)}`),
      success: (res) => {
        setSelectedTask(activeTasks[res.tapIndex]);
      }
    });
  };

  const startNavigation = () => {
    if (!selectedTask) {
      Taro.showToast({ title: '请先选择任务', icon: 'none' });
      return;
    }
    Taro.openLocation({
      latitude: selectedTask.deliveryLatitude || 30.98,
      longitude: selectedTask.deliveryLongitude || 103.85,
      name: selectedTask.deliveryAddress,
      address: selectedTask.deliveryAddress,
      scale: 15
    });
  };

  const callFarmer = () => {
    if (!selectedTask) return;
    Taro.makePhoneCall({
      phoneNumber: '13800138000',
      fail: () => {
        Taro.showToast({ title: '拨号取消', icon: 'none' });
      }
    });
  };

  if (activeTasks.length === 0 || !selectedTask) {
    return (
      <View className={styles.page}>
        <View className={styles.selector} onClick={selectTask}>
          <View className={styles.selectorContent}>
            <Text className={styles.selectorLabel}>当前导航任务</Text>
            <Text className={styles.selectorValue} style={{ color: '#86909C' }}>
              {selectedTask ? selectedTask.taskNo : '请选择需要导航的运输任务'}
            </Text>
          </View>
          <Button className={styles.selectorBtn}>
            <Text className={styles.selectorBtnText}>选择任务</Text>
          </Button>
        </View>
        <View className={styles.emptyWrap}>
          <EmptyState
            title='暂无进行中的运输任务'
            description='请到任务大厅接单后开始导航'
          />
        </View>
      </View>
    );
  }

  return (
    <View className={styles.page}>
      <View className={styles.currentTaskCard}>
        <View className={styles.currentTaskBadge}>
          <Text className={styles.currentTaskBadgeText}>🚚 {selectedTask.plateNumber}</Text>
        </View>

        <Text className={styles.currentTaskLabel}>📍 当前运输任务 · {selectedTask.taskNo}</Text>

        <View className={styles.currentTaskRoute}>
          <View className={styles.routePoint}>
            <View className={styles.routePointDot} />
            <View className={styles.routePointContent}>
              <Text className={styles.routePointLabel}>装货点</Text>
              <Text className={styles.routePointAddr}>{selectedTask.pickupAddress}</Text>
            </View>
          </View>
          <View className={styles.routeLine} />
          <View className={styles.routePoint}>
            <View className={`${styles.routePointDot} ${styles.routePointDotEnd}`} />
            <View className={styles.routePointContent}>
              <Text className={styles.routePointLabel}>收货点</Text>
              <Text className={styles.routePointAddr}>{selectedTask.deliveryAddress}</Text>
            </View>
          </View>
        </View>

        <View className={styles.currentTaskInfo}>
          <View className={styles.infoItem}>
            <Text className={styles.infoValue}>38</Text>
            <Text className={styles.infoLabel}>公里</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoValue}>1h15m</Text>
            <Text className={styles.infoLabel}>预计耗时</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoValue}>{formatWeight(selectedTask.estimatedWeight)}</Text>
            <Text className={styles.infoLabel}>载重</Text>
          </View>
        </View>

        <View className={styles.actionRow}>
          <Button className={styles.btnCall} onClick={callFarmer}>
            <Text>📞</Text>
          </Button>
          <Button className={styles.btnNav} onClick={startNavigation}>
            <Text>🧭</Text>
            <Text className={styles.btnNavText}>开始导航到收货点</Text>
          </Button>
        </View>
      </View>

      <View className={styles.card}>
        <Text className={styles.cardTitle}>
          <Text className={styles.cardTitleIcon}>⚠️</Text>
          限高提醒
        </Text>
        <View className={styles.limitList}>
          {heightLimits.map((item, idx) => (
            <View
              key={idx}
              className={`${styles.limitItem} ${item.isWarning ? styles.limitWarning : ''}`}
            >
              <Text className={styles.limitIcon}>{item.isWarning ? '🔴' : '🟡'}</Text>
              <View className={styles.limitContent}>
                <Text className={styles.limitTitle}>
                  {item.name} · 限高 {item.limit}m
                  {item.isWarning && ' · 您的车辆超高!'}
                </Text>
                <Text className={styles.limitDesc}>
                  位置: {item.position} · 您的车辆高度: {(selectedTask.heightLimit || 4.2).toFixed(1)}m
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.card}>
        <Text className={styles.cardTitle}>
          <Text className={styles.cardTitleIcon}>🚧</Text>
          限宽提醒
        </Text>
        <View className={styles.limitList}>
          {widthLimits.map((item, idx) => (
            <View
              key={idx}
              className={`${styles.limitItem} ${item.isWarning ? styles.limitWarning : ''}`}
            >
              <Text className={styles.limitIcon}>{item.isWarning ? '🔴' : '🟡'}</Text>
              <View className={styles.limitContent}>
                <Text className={styles.limitTitle}>
                  {item.name} · 限宽 {item.limit}m
                  {item.isWarning && ' · 您的车辆超宽!'}
                </Text>
                <Text className={styles.limitDesc}>
                  位置: {item.position} · 您的车辆宽度: {(selectedTask.widthLimit || 2.5).toFixed(1)}m
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.card}>
        <Text className={styles.cardTitle}>
          <Text className={styles.cardTitleIcon}>🛣️</Text>
          实时路况
        </Text>
        <View className={styles.roadList}>
          {roadConditions.map((item, idx) => (
            <View key={idx} className={styles.roadItem}>
              <View className={`${styles.roadIcon} ${
                item.type === 'normal' ? styles.roadIconNormal :
                item.type === 'slow' ? styles.roadIconSlow : styles.roadIconBad
              }`}>
                <Text>
                  {item.type === 'normal' ? '✅' : item.type === 'slow' ? '🐢' : '⛔'}
                </Text>
              </View>
              <View className={styles.roadContent}>
                <Text className={styles.roadTitle}>{item.title} · {item.desc}</Text>
                <Text className={styles.roadPos}>位置: {item.pos}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

export default RouteNavPage;
