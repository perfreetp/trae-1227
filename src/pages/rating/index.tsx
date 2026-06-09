import React, { useState, useMemo } from 'react';
import { View, Text, Button, Textarea } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { mockTasks } from '@/data/tasks';
import { Task } from '@/types/task';
import EmptyState from '@/components/EmptyState';
import styles from './index.module.scss';

type TabType = 'rating' | 'history';
type PartnerType = 'farmer' | 'buyer';

interface RatingHistory {
  id: string;
  partnerName: string;
  partnerRole: string;
  partnerAvatar: string;
  stars: number;
  content: string;
  tags: string[];
  taskNo: string;
  createTime: string;
}

const initialHistories: RatingHistory[] = [
  {
    id: '1',
    partnerName: '李竹农',
    partnerRole: 'farmer',
    partnerAvatar: '👨‍🌾',
    stars: 5,
    content: '李叔备货很准时，竹子质量也很好，数量清点准确，下次继续合作！',
    tags: ['备货准时', '竹子新鲜', '数量准确'],
    taskNo: 'PZ20260607006',
    createTime: '2026-06-08 14:30'
  },
  {
    id: '2',
    partnerName: '濛阳竹制品厂',
    partnerRole: 'buyer',
    partnerAvatar: '🏭',
    stars: 4,
    content: '验货比较专业，卸货速度也快，就是结算稍微慢了一天，整体不错。',
    tags: ['验货专业', '卸货快捷'],
    taskNo: 'PZ20260605003',
    createTime: '2026-06-06 10:20'
  },
  {
    id: '3',
    partnerName: '王竹农',
    partnerRole: 'farmer',
    partnerAvatar: '👨‍🌾',
    stars: 5,
    content: '非常好的合作对象，竹子新鲜度高，人也很好说话，强烈推荐！',
    tags: ['竹子新鲜', '态度友好', '值得推荐'],
    taskNo: 'PZ20260603001',
    createTime: '2026-06-04 16:45'
  }
];

const getTaskTime = (task: Task | undefined): string => {
  if (!task) return '';
  return task.completeTime || task.arrivalTime || task.departureTime || task.loadingTime || task.acceptTime || task.publishTime;
};

const formatDateStr = (timeStr: string): string => {
  if (!timeStr) return '';
  return timeStr.slice(0, 10);
};

const RatingPage: React.FC = () => {
  const router = useRouter();
  const taskId = router.params.taskId;
  const [activeTab, setActiveTab] = useState<TabType>('rating');
  const [partnerType, setPartnerType] = useState<PartnerType>('farmer');
  const [anonymous, setAnonymous] = useState(false);
  const [comment, setComment] = useState('');
  const [overallStars, setOverallStars] = useState(0);
  const [histories, setHistories] = useState<RatingHistory[]>(initialHistories);
  const [filterPartnerType, setFilterPartnerType] = useState<'all' | PartnerType>('all');
  const [filterStars, setFilterStars] = useState<0 | 1 | 2 | 3 | 4 | 5>(0);

  const ratingItems = useMemo(() => {
    if (partnerType === 'farmer') {
      return [
        { key: 'timely', label: '备货准时', value: 0 },
        { key: 'quality', label: '竹子质量', value: 0 },
        { key: 'count', label: '数量准确', value: 0 },
        { key: 'attitude', label: '服务态度', value: 0 },
        { key: 'cooperation', label: '配合程度', value: 0 }
      ];
    }
    return [
      { key: 'unloading', label: '卸货效率', value: 0 },
      { key: 'checking', label: '验货速度', value: 0 },
      { key: 'payment', label: '结算及时', value: 0 },
      { key: 'attitude', label: '服务态度', value: 0 },
      { key: 'standard', label: '流程规范', value: 0 }
    ];
  }, [partnerType]);

  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const tags = useMemo(() => {
    if (partnerType === 'farmer') {
      return ['备货准时', '竹子新鲜', '数量准确', '态度友好', '沟通顺畅', '配合默契', '值得推荐'];
    }
    return ['卸货快捷', '验货专业', '结算及时', '态度友好', '流程规范', '管理有序', '长期合作'];
  }, [partnerType]);

  const currentTask = useMemo<Task | undefined>(() => {
    if (taskId) {
      return mockTasks.find(t => t.id === taskId);
    }
    return mockTasks.find(t => t.status === 'completed');
  }, [taskId]);

  const taskTimeStr = useMemo(() => formatDateStr(getTaskTime(currentTask)), [currentTask]);

  const handleStarClick = (key: string, value: number) => {
    setRatings({ ...ratings, [key]: value });
  };

  const handleOverallStarClick = (value: number) => {
    setOverallStars(value);
  };

  const handleTagClick = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else if (selectedTags.length < 5) {
      setSelectedTags([...selectedTags, tag]);
    } else {
      Taro.showToast({ title: '最多选择5个标签', icon: 'none' });
    }
  };

  const handleSubmit = () => {
    const totalRating = Object.values(ratings).reduce((sum, v) => sum + v, 0);
    const itemCount = ratingItems.length;
    const hasRating = totalRating > 0;

    if (!hasRating && overallStars === 0) {
      Taro.showToast({ title: '请进行星级评分', icon: 'none' });
      return;
    }

    Taro.showLoading({ title: '提交中...' });
    setTimeout(() => {
      Taro.hideLoading();
      const finalStars = overallStars > 0 ? overallStars : Math.max(1, Math.round(totalRating / itemCount));
      const nowStr = new Date().toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }).replace(/\//g, '-');

      const newHistory: RatingHistory = {
        id: String(Date.now()),
        partnerName: partnerType === 'farmer'
          ? (currentTask?.farmerName || '合作竹农')
          : '彭州收购点',
        partnerRole: partnerType,
        partnerAvatar: partnerType === 'farmer' ? '👨‍🌾' : '🏭',
        stars: finalStars,
        content: comment || '用户未填写文字评价',
        tags: [...selectedTags],
        taskNo: currentTask?.taskNo || 'PZ000000000',
        createTime: nowStr
      };

      setHistories([newHistory, ...histories]);

      Taro.showModal({
        title: '评价提交成功',
        content: `感谢您的评价！您的反馈将帮助其他司机更好地选择合作方。\n\n综合评分：${finalStars}.0 星\n评价标签：${selectedTags.join('、') || '无'}`,
        showCancel: false,
        success: () => {
          setRatings({});
          setOverallStars(0);
          setSelectedTags([]);
          setComment('');
          setActiveTab('history');
        }
      });
    }, 1000);
  };

  const handleViewTask = (taskNo: string, history?: any) => {
    const task = mockTasks.find(t => t.taskNo === taskNo);
    if (task) {
      Taro.navigateTo({ url: `/pages/task-detail/index?id=${task.id}` });
      return;
    }
    try {
      Taro.setStorageSync('fallback_detail_summary_v1', {
        source: 'rating',
        sourceName: '评价记录',
        taskNo,
        date: history?.createTime || new Date().toLocaleDateString().replace(/\//g, '-'),
        status: '已完成',
        ratingStars: history?.stars,
        ratingContent: history?.content,
        partnerName: history?.partnerName,
        partnerRole: history?.partnerRole,
        route: '详情摘要',
        plateNumber: '川A·',
        weight: 0,
        fee: 0
      });
    } catch (_) {}
    Taro.navigateTo({ url: `/pages/task-detail/index?taskNo=${taskNo}` });
  };

  const filteredHistories = useMemo(() => {
    return histories.filter(h => {
      if (filterPartnerType !== 'all' && h.partnerRole !== filterPartnerType) return false;
      if (filterStars > 0 && h.stars !== filterStars) return false;
      return true;
    });
  }, [histories, filterPartnerType, filterStars]);

  const handleResetRatingFilter = () => {
    setFilterPartnerType('all');
    setFilterStars(0);
    Taro.showToast({ title: '已重置筛选', icon: 'success' });
  };

  return (
    <View className={styles.page}>
      <View className={styles.tabs}>
        <View
          className={`${styles.tab} ${activeTab === 'rating' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('rating')}
        >
          <Text className={activeTab === 'rating' ? styles.tabTextActive : styles.tabText}>
            ✏️ 写评价
          </Text>
        </View>
        <View
          className={`${styles.tab} ${activeTab === 'history' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <Text className={activeTab === 'history' ? styles.tabTextActive : styles.tabText}>
            📋 评价记录
          </Text>
          {histories.length > 0 && (
            <Text
              style={{
                position: 'absolute',
                top: '8rpx',
                right: '20rpx',
                minWidth: '32rpx',
                height: '32rpx',
                padding: '0 8rpx',
                background: '#ED6C02',
                color: '#fff',
                fontSize: '20rpx',
                borderRadius: '999rpx',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: 1
              }}
            >
              {histories.length}
            </Text>
          )}
        </View>
      </View>

      {activeTab === 'rating' && (
        <>
          <View className={styles.ratingCard}>
            <View className={styles.tabs}>
              <View
                className={`${styles.tab} ${partnerType === 'farmer' ? styles.tabActive : ''}`}
                onClick={() => {
                  setPartnerType('farmer');
                  setRatings({});
                }}
              >
                <Text className={partnerType === 'farmer' ? styles.tabTextActive : styles.tabText}>
                  👨‍🌾 评价竹农
                </Text>
              </View>
              <View
                className={`${styles.tab} ${partnerType === 'buyer' ? styles.tabActive : ''}`}
                onClick={() => {
                  setPartnerType('buyer');
                  setRatings({});
                }}
              >
                <Text className={partnerType === 'buyer' ? styles.tabTextActive : styles.tabText}>
                  🏭 评价收购点
                </Text>
              </View>
            </View>

            <View className={styles.partnerCard}>
              <View className={styles.partnerAvatar}>
                {partnerType === 'farmer' ? '👨‍🌾' : '🏭'}
              </View>
              <View className={styles.partnerInfo}>
                <Text className={styles.partnerName}>
                  {partnerType === 'farmer'
                    ? (currentTask?.farmerName || '合作竹农')
                    : '濛阳竹制品厂'}
                </Text>
                <View className={styles.partnerRole}>
                  {partnerType === 'farmer' ? '竹农' : '收购点'}
                </View>
              </View>
            </View>

            {currentTask && (
              <View className={styles.taskInfo}>
                <Text className={styles.taskNo}>📦 {currentTask.taskNo}</Text>
                <Text className={styles.taskDate}>{taskTimeStr || '时间待更新'}</Text>
              </View>
            )}

            <View className={styles.overallRating}>
              <Text className={styles.overallLabel}>综合评分</Text>
              <View className={styles.overallStars}>
                {[1, 2, 3, 4, 5].map(i => (
                  <View key={i} onClick={() => handleOverallStarClick(i)}>
                    <Text className={`${styles.overallStar} ${i <= overallStars ? styles.overallStarActive : ''}`}>
                      ★
                    </Text>
                  </View>
                ))}
              </View>
              <Text className={styles.overallText}>
                {overallStars > 0 ? `${overallStars}.0 分` : '请点击星星评分'}
              </Text>
            </View>
          </View>

          <View className={styles.ratingCard}>
            <Text className={styles.sectionTitle}>分项评分</Text>
            <View className={styles.ratingSection}>
              {ratingItems.map(item => (
                <View key={item.key} className={styles.ratingItem}>
                  <Text className={styles.ratingLabel}>{item.label}</Text>
                  <View style={{ display: 'flex', alignItems: 'center' }}>
                    <View className={styles.starsRow}>
                      {[1, 2, 3, 4, 5].map(i => (
                        <View key={i} onClick={() => handleStarClick(item.key, i)}>
                          <Text className={`${styles.star} ${i <= (ratings[item.key] || 0) ? styles.starActive : ''}`}>
                            ★
                          </Text>
                        </View>
                      ))}
                    </View>
                    {(ratings[item.key] || 0) > 0 && (
                      <Text className={styles.starText}>{ratings[item.key]}.0</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View className={styles.ratingCard}>
            <Text className={styles.sectionTitle}>评价标签（最多5个）</Text>
            <View className={styles.tagList}>
              {tags.map(tag => (
                <View
                  key={tag}
                  className={`${styles.tag} ${selectedTags.includes(tag) ? styles.tagActive : ''}`}
                  onClick={() => handleTagClick(tag)}
                >
                  {tag}
                </View>
              ))}
            </View>
          </View>

          <View className={styles.ratingCard}>
            <Text className={styles.sectionTitle}>评价内容</Text>
            <Textarea
              className={styles.textarea}
              placeholder={`请分享您对${partnerType === 'farmer' ? '竹农' : '收购点'}的真实感受，帮助其他司机了解~`}
              value={comment}
              onInput={(e) => setComment(e.detail.value)}
              maxlength={300}
            />
            <Text className={styles.textareaCount}>{comment.length}/300</Text>

            <View className={styles.anonymousRow}>
              <Text className={styles.anonymousText}>🙈 匿名评价</Text>
              <View
                className={`${styles.switch} ${anonymous ? styles.switchActive : ''}`}
                onClick={() => setAnonymous(!anonymous)}
              >
                <View className={`${styles.switchKnob} ${anonymous ? styles.switchKnobActive : ''}`} />
              </View>
            </View>
          </View>

          <View className={styles.submitBar}>
            <Button className={styles.submitBtn} onClick={handleSubmit}>
              ⭐ 提交评价
            </Button>
          </View>
        </>
      )}

      {activeTab === 'history' && (
        <>
          <View className={styles.filterBar}>
            <View className={styles.filterRow}>
              <Text className={styles.filterLabel}>合作方：</Text>
              {[
                { key: 'all', label: '全部' },
                { key: 'farmer', label: '👨‍🌾 竹农' },
                { key: 'buyer', label: '🏭 收购点' }
              ].map(item => (
                <View
                  key={item.key}
                  className={`${styles.filterChip} ${filterPartnerType === item.key ? styles.filterChipActive : ''}`}
                  onClick={() => setFilterPartnerType(item.key as any)}
                >
                  {item.label}
                </View>
              ))}
            </View>
            <View className={styles.filterRow}>
              <Text className={styles.filterLabel}>星级：</Text>
              {[
                { key: 0, label: '全部' },
                { key: 5, label: '★★★★★' },
                { key: 4, label: '★★★★' },
                { key: 3, label: '★★★' },
                { key: 2, label: '★★' },
                { key: 1, label: '★' }
              ].map(item => (
                <View
                  key={item.key}
                  className={`${styles.filterChip} ${filterStars === item.key ? styles.filterChipActive : ''}`}
                  onClick={() => setFilterStars(item.key as any)}
                >
                  {item.label}
                </View>
              ))}
              {(filterPartnerType !== 'all' || filterStars > 0) && (
                <View
                  className={`${styles.filterChip} ${styles.filterChipReset}`}
                  onClick={handleResetRatingFilter}
                >
                  ↺ 重置
                </View>
              )}
            </View>
          </View>

          {filteredHistories.length === 0 ? (
            <EmptyState
              icon="⭐"
              text={histories.length === 0 ? '暂无评价记录' : '暂无符合条件的评价'}
              description={
                histories.length === 0
                  ? '完成运单后可以对合作方进行评价~'
                  : '试试调整筛选条件看看其他评价'
              }
              actionText={histories.length === 0 ? '去写评价' : ((filterPartnerType !== 'all' || filterStars > 0) ? '重置筛选' : undefined)}
              onAction={() => {
                if (histories.length === 0) {
                  setActiveTab('rating');
                } else if (filterPartnerType !== 'all' || filterStars > 0) {
                  handleResetRatingFilter();
                }
              }}
            />
          ) : (
            filteredHistories.map(h => (
              <View key={h.id} className={styles.historyCard}>
                <View className={styles.historyHeader}>
                  <View className={styles.historyPartner}>
                    <View className={styles.historyAvatar}>{h.partnerAvatar}</View>
                    <View>
                      <Text className={styles.historyName}>{h.partnerName}</Text>
                      <View style={{ marginTop: '4rpx' }}>
                        <Text className={styles.historyRole}>
                          {h.partnerRole === 'farmer' ? '竹农' : '收购点'}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View className={styles.historyStars}>
                    {[1, 2, 3, 4, 5].map(i => (
                      <Text key={i} className={`${styles.historyStar} ${i <= h.stars ? styles.historyStarActive : ''}`}>
                        ★
                      </Text>
                    ))}
                  </View>
                </View>

                <Text className={styles.historyContent}>{h.content}</Text>

                {h.tags.length > 0 && (
                  <View className={styles.historyTags}>
                    {h.tags.map(tag => (
                      <Text key={tag} className={styles.historyTag}>{tag}</Text>
                    ))}
                  </View>
                )}

                <Text className={styles.historyTask} onClick={() => handleViewTask(h.taskNo, h)}>
                  📦 {h.taskNo} · {h.createTime} → 查看运单
                </Text>
              </View>
            ))
          )}
        </>
      )}
    </View>
  );
};

export default RatingPage;
