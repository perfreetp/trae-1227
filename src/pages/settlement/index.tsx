import React, { useState, useMemo } from 'react';
import { View, Text, Button, Input, Textarea } from '@tarojs/components';
import Taro, { useRouter, usePullDownRefresh } from '@tarojs/taro';
import { mockSettlements } from '@/data/orders';
import { mockTasks } from '@/data/tasks';
import { Settlement, SettlementStatus } from '@/types/settlement';
import { settlementStatusMap, formatFee, formatWeight } from '@/utils';
import EmptyState from '@/components/EmptyState';
import styles from './index.module.scss';

type TabType = 'list' | 'apply';

// 统一运费计算函数：重量(公斤) × 单价(元/吨) = 运费(元)
// 公式：运费 = (重量 / 1000) × 单价
// 支持：小于一吨、整数吨、带小数吨的所有情况
const calculateFee = (weightKg: number, pricePerTon: number): number => {
  if (!weightKg || !pricePerTon || weightKg <= 0 || pricePerTon <= 0) return 0;
  const weightTon = weightKg / 1000; // 统一换算为吨
  return weightTon * pricePerTon;
};

const SettlementPage: React.FC = () => {
  const router = useRouter();
  const taskIdFromRouter = router.params.taskId;
  const [activeTab, setActiveTab] = useState<TabType>(taskIdFromRouter ? 'apply' : 'list');
  const [filterStatus, setFilterStatus] = useState<SettlementStatus | 'all'>('all');
  const [settlements, setSettlements] = useState<Settlement[]>(mockSettlements);
  const [selectedTaskId, setSelectedTaskId] = useState<string>(taskIdFromRouter || '');
  const [actualWeight, setActualWeight] = useState<string>('');
  const [unitPrice, setUnitPrice] = useState<string>('82');
  const [remarks, setRemarks] = useState<string>('');

  usePullDownRefresh(() => {
    setTimeout(() => {
      Taro.stopPullDownRefresh();
      Taro.showToast({ title: '刷新成功', icon: 'success' });
    }, 800);
  });

  const completedTasks = useMemo(
    () => mockTasks.filter(t => t.status === 'completed' || t.status === 'arrived'),
    []
  );

  const selectedTask = useMemo(
    () => mockTasks.find(t => t.id === selectedTaskId),
    [selectedTaskId]
  );

  const filteredSettlements = useMemo(() => {
    if (filterStatus === 'all') return settlements;
    return settlements.filter(s => s.status === filterStatus);
  }, [settlements, filterStatus]);

  const stats = useMemo(() => {
    const pending = settlements.filter(s => s.status === 'pending').length;
    const approved = settlements.filter(s => s.status === 'approved').length;
    const paid = settlements.filter(s => s.status === 'paid').length;
    const totalPending = settlements
      .filter(s => s.status === 'pending' || s.status === 'approved')
      .reduce((sum, s) => sum + s.totalFee, 0);
    const totalPaid = settlements
      .filter(s => s.status === 'paid')
      .reduce((sum, s) => sum + s.totalFee, 0);
    return { pending, approved, paid, totalPending, totalPaid };
  }, [settlements]);

  const estimatedFee = useMemo(() => {
    const weight = parseFloat(actualWeight) || selectedTask?.estimatedWeight || 0;
    const price = parseFloat(unitPrice) || 0;
    return calculateFee(weight, price);
  }, [actualWeight, unitPrice, selectedTask]);

  const handleSelectTask = () => {
    const tasks = completedTasks.map(t => `${t.taskNo} - ${t.pickupAddress.slice(0, 8)}→${t.deliveryAddress.slice(0, 8)}`);
    Taro.showActionSheet({
      itemList: tasks.length > 0 ? tasks : ['暂无已完成的运单'],
      success: (res) => {
        if (tasks.length > 0 && res.tapIndex < tasks.length) {
          const task = completedTasks[res.tapIndex];
          setSelectedTaskId(task.id);
          setActualWeight(String(task.actualWeight || task.estimatedWeight || ''));
        }
      }
    });
  };

  const handleViewDetail = (item: Settlement) => {
    const statusInfo = settlementStatusMap[item.status];
    Taro.showModal({
      title: '结算单详情',
      content: `结算单号：${item.settlementNo}\n运单号：${item.taskNo}\n司机：${item.driverName}\n车牌：${item.plateNumber}\n预估重量：${formatWeight(item.estimatedWeight)}\n实际重量：${formatWeight(item.actualWeight)}\n单价：¥${item.unitPrice}/吨\n预估运费：${formatFee(item.estimatedFee)}\n实际运费：${formatFee(item.actualFee)}${item.bonusFee ? `\n奖励：+${formatFee(item.bonusFee)}` : ''}${item.deductionFee ? `\n扣款：-${formatFee(item.deductionFee)}\n扣款原因：${item.deductionReason || ''}` : ''}\n总计：${formatFee(item.totalFee)}\n状态：${statusInfo.text}\n申请时间：${item.applyTime}${item.approveTime ? `\n审核时间：${item.approveTime}` : ''}${item.payTime ? `\n支付时间：${item.payTime}` : ''}`,
      showCancel: false
    });
  };

  const handleSubmitApply = () => {
    if (!selectedTaskId) {
      Taro.showToast({ title: '请选择运单', icon: 'none' });
      return;
    }
    if (!actualWeight || parseFloat(actualWeight) <= 0) {
      Taro.showToast({ title: '请填写实际重量', icon: 'none' });
      return;
    }
    Taro.showLoading({ title: '提交中...' });
    setTimeout(() => {
      Taro.hideLoading();
      const weightNum = parseFloat(actualWeight) || selectedTask?.estimatedWeight || 0;
      const priceNum = parseFloat(unitPrice) || 82;
      const calcFee = Math.round(calculateFee(weightNum, priceNum));

      const newSettlement: Settlement = {
        id: String(Date.now()),
        settlementNo: `JS${Date.now().toString().slice(-10)}`,
        taskId: selectedTaskId,
        taskNo: selectedTask?.taskNo || '',
        driverName: '赵师傅',
        plateNumber: selectedTask?.plateNumber || '川A·33333',
        estimatedWeight: selectedTask?.estimatedWeight || 0,
        actualWeight: weightNum,
        unitPrice: priceNum,
        estimatedFee: selectedTask?.estimatedFee || Math.round(calculateFee(selectedTask?.estimatedWeight || 0, priceNum)),
        actualFee: calcFee,
        totalFee: calcFee,
        status: 'pending',
        applyTime: new Date().toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        }).replace(/\//g, '-'),
        remarks
      };
      setSettlements([newSettlement, ...settlements]);
      Taro.showModal({
        title: '申请提交成功',
        content: `结算单号：${newSettlement.settlementNo}\n预估运费：${formatFee(newSettlement.totalFee)}\n平台将在24小时内审核完成。`,
        showCancel: false,
        success: () => {
          setActiveTab('list');
          setSelectedTaskId('');
          setActualWeight('');
          setRemarks('');
        }
      });
    }, 1200);
  };

  return (
    <View className={styles.page}>
      <View className={styles.summaryCard}>
        <Text className={styles.summaryTitle}>💰 结算中心</Text>
        <View className={styles.summaryMain}>
          <Text className={styles.summaryAmount}>{formatFee(stats.totalPending + stats.totalPaid)}</Text>
          <Text className={styles.summaryUnit}>累计结算总额</Text>
        </View>
        <View className={styles.summaryStats}>
          <View className={styles.summaryStat}>
            <Text className={styles.summaryStatValue}>{stats.pending}</Text>
            <Text className={styles.summaryStatLabel}>待审核</Text>
          </View>
          <View className={styles.summaryStatDivider} />
          <View className={styles.summaryStat}>
            <Text className={styles.summaryStatValue}>{stats.approved}</Text>
            <Text className={styles.summaryStatLabel}>已审核</Text>
          </View>
          <View className={styles.summaryStatDivider} />
          <View className={styles.summaryStat}>
            <Text className={styles.summaryStatValue}>{formatFee(stats.totalPaid)}</Text>
            <Text className={styles.summaryStatLabel}>已到账</Text>
          </View>
        </View>
      </View>

      <View className={styles.tabs}>
        <View
          className={`${styles.tab} ${activeTab === 'list' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('list')}
        >
          <Text className={activeTab === 'list' ? styles.tabTextActive : styles.tabText}>
            📋 结算记录
          </Text>
          {stats.pending > 0 && <View className={styles.tabBadge}>{stats.pending}</View>}
        </View>
        <View
          className={`${styles.tab} ${activeTab === 'apply' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('apply')}
        >
          <Text className={activeTab === 'apply' ? styles.tabTextActive : styles.tabText}>
            ✏️ 新建申请
          </Text>
        </View>
      </View>

      {activeTab === 'list' && (
        <>
          <View className={styles.tabs} style={{ marginBottom: '32rpx' }}>
            {[
              { key: 'all', label: '全部' },
              { key: 'pending', label: '待审核' },
              { key: 'approved', label: '已审核' },
              { key: 'paid', label: '已支付' },
              { key: 'rejected', label: '已驳回' }
            ].map(item => (
              <View
                key={item.key}
                className={`${styles.tab} ${filterStatus === item.key ? styles.tabActive : ''}`}
                onClick={() => setFilterStatus(item.key as any)}
              >
                <Text className={filterStatus === item.key ? styles.tabTextActive : styles.tabText}>
                  {item.label}
                </Text>
              </View>
            ))}
          </View>

          {filteredSettlements.length === 0 ? (
            <EmptyState text="暂无结算记录" actionText="去申请结算" onAction={() => setActiveTab('apply')} />
          ) : (
            filteredSettlements.map(item => {
              const statusInfo = settlementStatusMap[item.status];
              return (
                <View key={item.id} className={styles.applyCard}>
                  <View className={styles.cardHeader}>
                    <Text className={styles.cardNo}>{item.settlementNo}</Text>
                    <View
                      className={styles.statusBadge}
                      style={{ color: statusInfo.color, background: statusInfo.bgColor }}
                    >
                      {statusInfo.text}
                    </View>
                  </View>
                  <View className={styles.cardInfo}>
                    <View className={styles.infoRow}>
                      <Text className={styles.infoLabel}>运单号</Text>
                      <Text className={styles.infoValue}>{item.taskNo}</Text>
                    </View>
                    <View className={styles.infoRow}>
                      <Text className={styles.infoLabel}>车牌</Text>
                      <Text className={styles.infoValue}>{item.plateNumber}</Text>
                    </View>
                    <View className={styles.infoRow}>
                      <Text className={styles.infoLabel}>实际重量</Text>
                      <Text className={styles.infoValue}>{formatWeight(item.actualWeight)}</Text>
                    </View>
                  </View>
                  <View className={styles.feeRow}>
                    <Text className={styles.feeLabel}>结算运费</Text>
                    <Text className={styles.feeValue}>{formatFee(item.totalFee)}</Text>
                  </View>
                  {item.bonusFee && (
                    <View className={styles.bonusRow}>
                      <Text className={styles.bonusText}>🎁 奖励金额 +{formatFee(item.bonusFee)}</Text>
                    </View>
                  )}
                  {item.deductionFee && (
                    <View className={styles.deductionRow}>
                      <Text className={styles.deductionText}>⚠️ 扣款金额 -{formatFee(item.deductionFee)} · {item.deductionReason}</Text>
                    </View>
                  )}
                  <View className={styles.infoRow} style={{ marginTop: '24rpx' }}>
                    <Text className={styles.infoLabel}>申请时间</Text>
                    <Text className={styles.infoValue}>{item.applyTime}</Text>
                  </View>
                  <View className={styles.cardActions}>
                    <Button className={`${styles.actionBtn} ${styles.secondaryBtn}`} onClick={() => handleViewDetail(item)}>
                      查看详情
                    </Button>
                    {(item.status === 'paid') && (
                      <Button className={`${styles.actionBtn} ${styles.primaryBtn}`}>
                        查看详情
                      </Button>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </>
      )}

      {activeTab === 'apply' && (
        <>
          <View className={styles.formCard}>
            <Text className={styles.sectionTitle}>选择运单</Text>
            <View className={styles.taskSelect} onClick={handleSelectTask}>
              <Text className={styles.taskSelectText}>
                {selectedTask
                  ? `${selectedTask.taskNo} - ${selectedTask.pickupAddress.slice(0, 10)}→${selectedTask.deliveryAddress.slice(0, 10)}`
                  : '请选择已完成的运单'}
              </Text>
              <Text className={styles.taskSelectArrow}>›</Text>
            </View>
          </View>

          <View className={styles.formCard}>
            <Text className={styles.sectionTitle}>费用信息</Text>
            <View className={styles.formRow}>
              <View className={styles.formRowItem}>
                <Text className={styles.formLabel}>实际重量（公斤）</Text>
                <Input
                  className={styles.formInput}
                  type="digit"
                  placeholder="请输入实际过磅重量"
                  value={actualWeight}
                  onInput={(e) => setActualWeight(e.detail.value)}
                />
              </View>
              <View className={styles.formRowItem}>
                <Text className={styles.formLabel}>单价（元/吨）</Text>
                <Input
                  className={styles.formInput}
                  type="digit"
                  placeholder="运费单价"
                  value={unitPrice}
                  onInput={(e) => setUnitPrice(e.detail.value)}
                />
              </View>
            </View>
            <View className={styles.formItem}>
              <Text className={styles.formLabel}>备注说明</Text>
              <Textarea
                className={styles.formTextarea}
                placeholder="选填，如特殊情况说明等"
                value={remarks}
                onInput={(e) => setRemarks(e.detail.value)}
                maxlength={200}
              />
            </View>
          </View>

          <View className={styles.previewBox}>
            <Text className={styles.previewTitle}>📊 运费预估</Text>
            <View className={styles.previewItem}>
              <Text className={styles.previewLabel}>实际重量</Text>
              <Text className={styles.previewValue}>
                {parseFloat(actualWeight) || selectedTask?.estimatedWeight
                  ? formatWeight(parseFloat(actualWeight) || selectedTask?.estimatedWeight || 0)
                  : '--'}
              </Text>
            </View>
            <View className={styles.previewItem}>
              <Text className={styles.previewLabel}>运费单价</Text>
              <Text className={styles.previewValue}>¥{unitPrice || '--'}/吨</Text>
            </View>
            <View className={styles.previewTotal}>
              <Text className={styles.previewTotalLabel}>预估运费</Text>
              <Text className={styles.previewTotalValue}>
                {estimatedFee > 0 ? formatFee(Math.round(estimatedFee)) : '--'}
              </Text>
            </View>
          </View>

          <View className={styles.submitBar}>
            <Button className={styles.backBtn} onClick={handleSubmitApply}>
              提交结算申请
            </Button>
          </View>
        </>
      )}
    </View>
  );
};

export default SettlementPage;
