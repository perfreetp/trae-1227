import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, Input, ScrollView, Button } from '@tarojs/components';
import Taro, { usePullDownRefresh, useDidShow, useDidHide } from '@tarojs/taro';
import TaskCard from '@/components/TaskCard';
import EmptyState from '@/components/EmptyState';
import { mockTasks } from '@/data/tasks';
import { Task, TaskStatus } from '@/types/task';
import classnames from 'classnames';
import styles from './index.module.scss';

const STORAGE_KEY = 'task_hall_filter_v1';

const filters = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待接单' },
  { key: 'accepted', label: '已接单' },
  { key: 'loading', label: '装货中' },
  { key: 'transporting', label: '运输中' },
  { key: 'completed', label: '已完成' }
];

interface SavedFilter {
  activeFilter: string;
  searchKeyword: string;
  plateFilter: string;
}

const loadSavedFilter = (): SavedFilter | null => {
  try {
    const saved = Taro.getStorageSync(STORAGE_KEY);
    if (saved && typeof saved === 'object') return saved;
  } catch (_) {}
  return null;
};

const saveFilter = (filter: SavedFilter) => {
  try {
    Taro.setStorageSync(STORAGE_KEY, filter);
  } catch (_) {}
};

const clearSavedFilter = () => {
  try {
    Taro.removeStorageSync(STORAGE_KEY);
  } catch (_) {}
};

interface RecentView {
  id: string;
  taskNo: string;
  title: string;
  viewAt: string;
}

const TaskHallPage: React.FC = () => {
  const saved = loadSavedFilter();
  const [activeFilter, setActiveFilter] = useState<string>(saved?.activeFilter || 'all');
  const [searchKeyword, setSearchKeyword] = useState<string>(saved?.searchKeyword || '');
  const [plateFilter, setPlateFilter] = useState<string>(saved?.plateFilter || '');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [recentList, setRecentList] = useState<RecentView[]>([]);

  useEffect(() => {
    saveFilter({ activeFilter, searchKeyword, plateFilter });
  }, [activeFilter, searchKeyword, plateFilter]);

  useDidShow(() => {
    try {
      const raw = Taro.getStorageSync('task_hall_recent_view_v1');
      if (raw && Array.isArray(raw)) {
        setRecentList(raw);
      }
    } catch (_) {}
  });

  usePullDownRefresh(() => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      Taro.stopPullDownRefresh();
      Taro.showToast({ title: '刷新成功', icon: 'success' });
    }, 1000);
  });

  const filteredTasks = useMemo(() => {
    return mockTasks.filter(task => {
      // 条件1：状态筛选
      if (activeFilter !== 'all' && task.status !== activeFilter) {
        return false;
      }
      // 条件2：关键词搜索（运单号、装货点、收货点）
      if (searchKeyword) {
        const keyword = searchKeyword.toLowerCase();
        const matchNo = task.taskNo.toLowerCase().includes(keyword);
        const matchPickup = task.pickupAddress.includes(keyword);
        const matchDelivery = task.deliveryAddress.includes(keyword);
        if (!matchNo && !matchPickup && !matchDelivery) {
          return false;
        }
      }
      // 条件3：车牌筛选（与关键词叠加使用，AND关系）
      if (plateFilter) {
        if (!task.plateNumber.toLowerCase().includes(plateFilter.toLowerCase())) {
          return false;
        }
      }
      // 所有条件都满足才保留
      return true;
    });
  }, [activeFilter, searchKeyword, plateFilter]);

  const stats = useMemo(() => {
    const pending = mockTasks.filter(t => t.status === 'pending').length;
    const transporting = mockTasks.filter(t => t.status === 'transporting').length;
    const completed = mockTasks.filter(t => t.status === 'completed').length;
    return { pending, transporting, completed };
  }, []);

  const handlePublish = () => {
    Taro.navigateTo({ url: '/pages/publish-task/index' });
  };

  const handlePlateFilter = () => {
    Taro.showModal({
      title: '按车牌筛选',
      editable: true,
      placeholderText: '请输入车牌号（如：川A）',
      content: plateFilter,
      success: (res) => {
        if (res.confirm && res.content !== undefined) {
          setPlateFilter(res.content);
        }
      }
    });
  };

  const clearPlateFilter = () => {
    if (plateFilter) {
      setPlateFilter('');
      Taro.showToast({ title: '已清除车牌筛选', icon: 'none' });
    } else {
      handlePlateFilter();
    }
  };

  const handleResetAllFilter = () => {
    setActiveFilter('all');
    setSearchKeyword('');
    setPlateFilter('');
    clearSavedFilter();
    Taro.showToast({ title: '已重置所有筛选', icon: 'success' });
  };

  const handleRecentClick = (id: string) => {
    Taro.navigateTo({ url: `/pages/task-detail/index?id=${id}` });
  };

  const handleClearRecent = () => {
    Taro.showModal({
      title: '确认清空',
      content: '确定清空最近查看的运单记录？',
      success: (res) => {
        if (res.confirm) {
          try {
            Taro.removeStorageSync('task_hall_recent_view_v1');
          } catch (_) {}
          setRecentList([]);
          Taro.showToast({ title: '已清空最近记录', icon: 'success' });
        }
      }
    });
  };

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <View className={styles.headerTop}>
          <View className={styles.greeting}>
            <Text className={styles.greetingText}>🎋 欢迎使用彭州竹运助手</Text>
            <Text className={styles.title}>今天也要安全驾驶哦</Text>
          </View>
          <View className={styles.weatherCard}>
            <Text className={styles.weatherIcon}>☀️</Text>
            <View className={styles.weatherInfo}>
              <Text className={styles.weatherTemp}>28°C</Text>
              <Text className={styles.weatherDesc}>晴 东南风3级</Text>
            </View>
          </View>
        </View>

        <View className={styles.searchBar}>
          <Text className={styles.searchIcon}>🔍</Text>
          <Input
            className={styles.searchInput}
            placeholder='搜索运单号、装货点、收货点'
            placeholderClass={styles.searchInput}
            value={searchKeyword}
            onInput={(e) => setSearchKeyword(e.detail.value)}
          />
          <Button className={styles.searchBtn} onClick={() => {}}>搜索</Button>
        </View>
      </View>

      <View className={styles.filterBar}>
        <ScrollView className={styles.filterScroll} scrollX enhanced showScrollbar={false}>
          <View className={styles.filterList}>
            {filters.map(filter => (
              <View
                key={filter.key}
                className={classnames(
                  styles.filterChip,
                  activeFilter === filter.key && styles.filterChipActive
                )}
                onClick={() => setActiveFilter(filter.key)}
              >
                <Text
                  className={classnames(
                    styles.filterText,
                    activeFilter === filter.key && styles.filterTextActive
                  )}
                >
                  {filter.label}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
        <View className={styles.plateFilter}>
          <Button className={styles.plateBtn} onClick={clearPlateFilter}>
            <Text className={styles.plateBtnText}>
              {plateFilter ? `🚚 ${plateFilter} ✕` : '🚚 车牌筛选'}
            </Text>
          </Button>
          {(searchKeyword || activeFilter !== 'all' || plateFilter) && (
            <Button
              className={styles.plateBtn}
              style={{
                background: 'transparent',
                border: '2rpx dashed #C9CDD4',
                marginLeft: '16rpx'
              }}
              onClick={handleResetAllFilter}
            >
              <Text className={styles.plateBtnText} style={{ color: '#86909C' }}>
                ↺ 重置
              </Text>
            </Button>
          )}
        </View>
      </View>

      <View className={styles.content}>
        <View className={styles.statsRow}>
          <View className={styles.statCard}>
            <Text className={styles.statValue}>{stats.pending}</Text>
            <Text className={styles.statLabel}>待接单</Text>
          </View>
          <View className={styles.statCard}>
            <Text className={styles.statValue}>{stats.transporting}</Text>
            <Text className={styles.statLabel}>运输中</Text>
          </View>
          <View className={styles.statCard}>
            <Text className={styles.statValue}>{stats.completed}</Text>
            <Text className={styles.statLabel}>已完成</Text>
          </View>
        </View>

        {recentList.length > 0 && (
          <View className={styles.recentCard}>
            <View className={styles.recentHeader}>
              <View className={styles.recentTitle}>🕐 最近查看</View>
              <Text className={styles.recentClear} onClick={handleClearRecent}>
                清空
              </Text>
            </View>
            <View className={styles.recentList}>
              {recentList.map(item => (
                <View
                  key={item.id}
                  className={styles.recentItem}
                  onClick={() => handleRecentClick(item.id)}
                >
                  <View className={styles.recentItemLeft}>
                    <Text className={styles.recentItemNo}>{item.taskNo}</Text>
                    <Text className={styles.recentItemRoute}>{item.title}</Text>
                  </View>
                  <View className={styles.recentItemMeta}>
                    <Text className={styles.recentItemTime}>{item.viewAt}</Text>
                    <Text className={styles.recentItemGo}>查看 →</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        <View className={styles.sectionHeader}>
          <View className={styles.sectionTitle}>
            <View className={styles.sectionTitleBar} />
            <Text>任务列表</Text>
          </View>
          <Button className={styles.publishBtn} onClick={handlePublish}>
            <Text className={styles.publishIcon}>➕</Text>
            <Text className={styles.publishBtnText}>发布需求</Text>
          </Button>
        </View>

        {filteredTasks.length > 0 ? (
          filteredTasks.map(task => (
            <TaskCard key={task.id} task={task} />
          ))
        ) : (
          <EmptyState
            icon="📋"
            text="暂无匹配的任务"
            description={searchKeyword || plateFilter || activeFilter !== 'all' ? '试试调整筛选条件或搜索关键词' : '暂时没有任务，稍后再来看看吧'}
            actionText={searchKeyword || plateFilter || activeFilter !== 'all' ? '重置筛选' : undefined}
            onAction={searchKeyword || plateFilter || activeFilter !== 'all' ? () => {
              setSearchKeyword('');
              setPlateFilter('');
              setActiveFilter('all');
              Taro.showToast({ title: '已重置筛选', icon: 'success' });
            } : undefined}
          />
        )}
      </View>
    </View>
  );
};

export default TaskHallPage;
