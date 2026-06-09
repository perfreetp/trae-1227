import React, { useState, useMemo, useEffect } from 'react';
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

const SETTLE_FILTER_KEY = 'settlement_filter_v1';

interface SettleSavedFilter {
  filterStatus: SettlementStatus | 'all';
  filterMonth: string;
  filterPlate: string;
}

const loadSettleFilter = (): SettleSavedFilter | null => {
  try {
    const saved = Taro.getStorageSync(SETTLE_FILTER_KEY);
    if (saved && typeof saved === 'object') return saved;
  } catch (_) {}
  return null;
};

const saveSettleFilter = (f: SettleSavedFilter) => {
  try {
    Taro.setStorageSync(SETTLE_FILTER_KEY, f);
  } catch (_) {}
};

const syncSettlementToGlobal = (updatedList: Settlement[]) => {
  try {
    mockSettlements.length = 0;
    updatedList.forEach(s => mockSettlements.push(s));
  } catch (_) {}
};

const SettlementPage: React.FC = () => {
  const router = useRouter();
  const taskIdFromRouter = router.params.taskId;
  const settlementIdFromRouter = router.params.settlementId;
  const saved = loadSettleFilter();
  const [activeTab, setActiveTab] = useState<TabType>((taskIdFromRouter || settlementIdFromRouter) ? 'list' : 'list');
  const [filterStatus, setFilterStatus] = useState<SettlementStatus | 'all'>(saved?.filterStatus || 'all');
  const [filterMonth, setFilterMonth] = useState<string>(saved?.filterMonth || 'all');
  const [filterPlate, setFilterPlate] = useState<string>(saved?.filterPlate || '');
  const [settlements, setSettlements] = useState<Settlement[]>(mockSettlements);
  const [selectedTaskId, setSelectedTaskId] = useState<string>(taskIdFromRouter || '');
  const [actualWeight, setActualWeight] = useState<string>('');
  const [unitPrice, setUnitPrice] = useState<string>('82');
  const [remarks, setRemarks] = useState<string>('');
  const [detailSettlement, setDetailSettlement] = useState<Settlement | null>(null);

  useEffect(() => {
    saveSettleFilter({ filterStatus, filterMonth, filterPlate });
  }, [filterStatus, filterMonth, filterPlate]);

  useEffect(() => {
    if (settlementIdFromRouter) {
      const found = settlements.find(s => s.id === settlementIdFromRouter);
      if (found) {
        setTimeout(() => setDetailSettlement(found), 300);
        return;
      }
    }
    if (taskIdFromRouter && !settlementIdFromRouter) {
      const found = settlements.find(s => s.taskId === taskIdFromRouter || s.taskNo === mockTasks.find(t => t.id === taskIdFromRouter)?.taskNo);
      if (found) {
        setTimeout(() => setDetailSettlement(found), 300);
      }
    }
  }, [settlementIdFromRouter, taskIdFromRouter, settlements]);

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

  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    settlements.forEach(s => {
      if (s.applyTime) set.add(s.applyTime.slice(0, 7));
    });
    return Array.from(set).sort().reverse();
  }, [settlements]);

  const availablePlates = useMemo(() => {
    const set = new Set<string>();
    settlements.forEach(s => {
      if (s.plateNumber) set.add(s.plateNumber);
    });
    return Array.from(set);
  }, [settlements]);

  const filteredSettlements = useMemo(() => {
    return settlements.filter(s => {
      if (filterStatus !== 'all' && s.status !== filterStatus) return false;
      if (filterMonth !== 'all') {
        const sMonth = s.applyTime ? s.applyTime.slice(0, 7) : '';
        if (sMonth !== filterMonth) return false;
      }
      if (filterPlate && !s.plateNumber.includes(filterPlate)) return false;
      return true;
    });
  }, [settlements, filterStatus, filterMonth, filterPlate]);

  const stats = useMemo(() => {
    const list = filteredSettlements;
    const pending = list.filter(s => s.status === 'pending').length;
    const approved = list.filter(s => s.status === 'approved').length;
    const paid = list.filter(s => s.status === 'paid').length;
    const rejected = list.filter(s => s.status === 'rejected').length;
    const pendingAmount = list
      .filter(s => s.status === 'pending')
      .reduce((sum, s) => sum + s.totalFee, 0);
    const approvedAmount = list
      .filter(s => s.status === 'approved')
      .reduce((sum, s) => sum + s.totalFee, 0);
    const paidAmount = list
      .filter(s => s.status === 'paid')
      .reduce((sum, s) => sum + s.totalFee, 0);
    return {
      pending, approved, paid, rejected,
      pendingAmount, approvedAmount, paidAmount,
      totalPending: pendingAmount + approvedAmount,
      totalPaid: paidAmount
    };
  }, [filteredSettlements]);

  const handleMonthSelect = () => {
    const items = ['全部月份', ...availableMonths];
    Taro.showActionSheet({
      itemList: items,
      success: (res) => {
        if (res.tapIndex === 0) {
          setFilterMonth('all');
        } else if (res.tapIndex > 0 && res.tapIndex < items.length) {
          setFilterMonth(items[res.tapIndex]);
        }
      }
    });
  };

  const handlePlateSelect = () => {
    const items = filterPlate ? ['清除车牌筛选', ...availablePlates] : [...availablePlates];
    Taro.showActionSheet({
      itemList: items.length > 0 ? items : ['暂无可用车牌'],
      success: (res) => {
        if (items.length === 0 || items[0] === '暂无可用车牌') return;
        if (filterPlate) {
          if (res.tapIndex === 0) {
            setFilterPlate('');
          } else if (res.tapIndex > 0 && res.tapIndex < items.length) {
            setFilterPlate(items[res.tapIndex]);
          }
        } else {
          if (res.tapIndex >= 0 && res.tapIndex < items.length) {
            setFilterPlate(items[res.tapIndex]);
          }
        }
      }
    });
  };

  const handleResetFilter = () => {
    setFilterStatus('all');
    setFilterMonth('all');
    setFilterPlate('');
    try { Taro.removeStorageSync(SETTLE_FILTER_KEY); } catch (_) {}
    Taro.showToast({ title: '已重置筛选', icon: 'success' });
  };

  const handleGoTaskDetail = (item: Settlement) => {
    if (item.taskId) {
      Taro.navigateTo({ url: `/pages/task-detail/index?id=${item.taskId}` });
    } else if (item.taskNo) {
      Taro.navigateTo({ url: `/pages/task-detail/index?taskNo=${item.taskNo}` });
    } else {
      Taro.showToast({ title: '运单信息暂不可用', icon: 'none' });
    }
  };

  const nowStr = () => new Date().toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
  }).replace(/\//g, '-');

  const updateSettlement = (id: string, patch: Partial<Settlement>) => {
    const updated = settlements.map(s => s.id === id ? { ...s, ...patch } : s);
    setSettlements(updated);
    syncSettlementToGlobal(updated);
  };

  const handleApprove = (item: Settlement) => {
    Taro.showModal({
      title: '审核通过',
      content: `确认通过结算单 ${item.settlementNo}？\n金额：${formatFee(item.totalFee)}`,
      success: (res) => {
        if (res.confirm) {
          updateSettlement(item.id, { status: 'approved', approveTime: nowStr() });
          Taro.showToast({ title: '已通过审核', icon: 'success' });
          if (detailSettlement?.id === item.id) {
            setDetailSettlement(prev => prev ? { ...prev, status: 'approved' as SettlementStatus, approveTime: nowStr() } : prev);
          }
        }
      }
    });
  };

  const handleReject = (item: Settlement) => {
    Taro.showModal({
      title: '审核驳回',
      content: `确认驳回结算单 ${item.settlementNo}？\n建议填写驳回原因（演示环境已自动添加）`,
      success: (res) => {
        if (res.confirm) {
          updateSettlement(item.id, {
            status: 'rejected',
            approveTime: nowStr(),
            deductionReason: '审核驳回：信息不完整，请补充过磅单照片后重新提交',
            deductionFee: item.deductionFee || 0
          });
          Taro.showToast({ title: '已驳回', icon: 'none' });
          if (detailSettlement?.id === item.id) {
            setDetailSettlement(prev => prev ? {
              ...prev,
              status: 'rejected' as SettlementStatus,
              approveTime: nowStr(),
              deductionReason: '审核驳回：信息不完整，请补充过磅单照片后重新提交'
            } : prev);
          }
        }
      }
    });
  };

  const handleMarkPaid = (item: Settlement) => {
    Taro.showModal({
      title: '标记已到账',
      content: `确认 ${item.settlementNo} 到账？\n将标记为已支付状态并更新运单详情结算状态。`,
      success: (res) => {
        if (res.confirm) {
          updateSettlement(item.id, { status: 'paid', payTime: nowStr() });
          Taro.showToast({ title: '已标记到账', icon: 'success' });
          if (detailSettlement?.id === item.id) {
            setDetailSettlement(prev => prev ? { ...prev, status: 'paid' as SettlementStatus, payTime: nowStr() } : prev);
          }
        }
      }
    });
  };

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
    setDetailSettlement(item);
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
          <Text className={styles.summaryUnit}>
            {(filterMonth !== 'all' || filterPlate || filterStatus !== 'all') ? '筛选范围金额' : '累计结算总额'}
          </Text>
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
            <Text className={styles.summaryStatValue}>{stats.paid}</Text>
            <Text className={styles.summaryStatLabel}>已到账</Text>
          </View>
        </View>
        <View className={styles.summaryDetail}>
          <View className={styles.summaryDetailItem}>
            <Text className={styles.summaryDetailLabel}>⏳ 待审核金额</Text>
            <Text className={`${styles.summaryDetailValue} ${styles.summaryDetailPending}`}>
              {formatFee(stats.pendingAmount)}
            </Text>
          </View>
          <View className={styles.summaryDetailItem}>
            <Text className={styles.summaryDetailLabel}>📋 已审核待打款</Text>
            <Text className={styles.summaryDetailValue} style={{ color: '#90CAF9' }}>
              {formatFee(stats.approvedAmount)}
            </Text>
          </View>
          <View className={styles.summaryDetailItem}>
            <Text className={styles.summaryDetailLabel}>✅ 已到账金额</Text>
            <Text className={`${styles.summaryDetailValue} ${styles.summaryDetailPaid}`}>
              {formatFee(stats.paidAmount)}
            </Text>
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
          <View className={styles.filterBar}>
            <View
              className={`${styles.filterChip} ${filterMonth !== 'all' ? styles.filterChipActive : ''}`}
              onClick={handleMonthSelect}
            >
              📅 {filterMonth !== 'all' ? filterMonth : '全部月份'}
            </View>
            <View
              className={`${styles.filterChip} ${filterPlate ? styles.filterChipActive : ''}`}
              onClick={handlePlateSelect}
            >
              🚚 {filterPlate || '全部车牌'}
            </View>
            {(filterMonth !== 'all' || filterPlate || filterStatus !== 'all') && (
              <View
                className={`${styles.filterChip} ${styles.filterChipReset}`}
                onClick={handleResetFilter}
              >
                ↺ 重置
              </View>
            )}
          </View>

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
            <EmptyState
              icon="💳"
              text="暂无符合条件的结算记录"
              description={
                (filterMonth !== 'all' || filterPlate || filterStatus !== 'all')
                  ? '试试调整筛选条件'
                  : '还没有申请过结算，完成运单后可以申请结算'
              }
              actionText={
                (filterMonth !== 'all' || filterPlate || filterStatus !== 'all') ? '重置筛选' : '去申请结算'
              }
              onAction={() => {
                if (filterMonth !== 'all' || filterPlate || filterStatus !== 'all') {
                  handleResetFilter();
                } else {
                  setActiveTab('apply');
                }
              }}
            />
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
                    <Button className={`${styles.actionBtn} ${styles.secondaryBtn}`} onClick={() => handleGoTaskDetail(item)}>
                      📦 查看运单
                    </Button>
                    <Button className={`${styles.actionBtn} ${styles.primaryBtn}`} onClick={() => handleViewDetail(item)}>
                      💳 结算详情
                    </Button>
                  </View>
                  {item.status === 'pending' && (
                    <View className={styles.cardActions2}>
                      <Button className={`${styles.actionBtnSmall} ${styles.actionBtnReject}`} onClick={() => handleReject(item)}>
                        ✖️ 审核驳回
                      </Button>
                      <Button className={`${styles.actionBtnSmall} ${styles.actionBtnApprove}`} onClick={() => handleApprove(item)}>
                        ✔️ 审核通过
                      </Button>
                    </View>
                  )}
                  {item.status === 'approved' && (
                    <View className={styles.cardActions2}>
                      <Button className={`${styles.actionBtnSmall} ${styles.actionBtnPaid}`} onClick={() => handleMarkPaid(item)}>
                        💰 标记已到账
                      </Button>
                    </View>
                  )}
                  {item.status === 'rejected' && (
                    <View className={styles.cardActions2}>
                      <Button className={`${styles.actionBtnSmall} ${styles.actionBtnApprove}`} onClick={() => {
                        updateSettlement(item.id, { status: 'pending', approveTime: undefined, deductionReason: undefined });
                        Taro.showToast({ title: '已重新提交审核', icon: 'success' });
                      }}>
                        📝 重新提交审核
                      </Button>
                    </View>
                  )}
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

      {detailSettlement && (() => {
        const s = detailSettlement;
        const sInfo = settlementStatusMap[s.status];
        return (
          <View className={styles.modalMask} onClick={() => setDetailSettlement(null)}>
            <View className={styles.modalWrap} onClick={e => e.stopPropagation && e.stopPropagation()}>
              <View className={styles.modalHeader}>
                <Text className={styles.modalTitle}>💳 {s.settlementNo}</Text>
                <View className={styles.modalClose} onClick={() => setDetailSettlement(null)}>
                  ✕
                </View>
              </View>
              <View className={styles.modalBody}>
                <View style={{
                  display: 'inline-block',
                  padding: '8rpx 20rpx',
                  borderRadius: '16rpx',
                  marginBottom: '24rpx',
                  background: sInfo.bgColor,
                  color: sInfo.color,
                  fontWeight: 600,
                  fontSize: '26rpx'
                }}>
                  {sInfo.text}
                </View>

                <View style={{ marginBottom: '16rpx' }}>
                  <Text style={{ fontSize: '26rpx', color: '#86909C', marginBottom: '8rpx', display: 'block' }}>
                    基础信息
                  </Text>
                  {[
                    ['运单号', s.taskNo],
                    ['司机', `${s.driverName} · ${s.plateNumber}`],
                    ['预估重量', formatWeight(s.estimatedWeight)],
                    ['实际重量', formatWeight(s.actualWeight)],
                    ['单价', `¥${s.unitPrice}/吨`]
                  ].map(([k, v]) => (
                    <View key={k} style={{
                      display: 'flex', justifyContent: 'space-between',
                      padding: '14rpx 0', borderBottom: '1rpx solid #F2F3F5'
                    }}>
                      <Text style={{ fontSize: '28rpx', color: '#86909C' }}>{k}</Text>
                      <Text style={{ fontSize: '28rpx', color: '#1D2129', fontWeight: 500 }}>{v}</Text>
                    </View>
                  ))}
                </View>

                <View style={{ marginBottom: '16rpx' }}>
                  <Text style={{ fontSize: '26rpx', color: '#86909C', marginBottom: '8rpx', display: 'block' }}>
                    费用明细
                  </Text>
                  {[
                    ['预估运费', formatFee(s.estimatedFee)],
                    ['实际运费', formatFee(s.actualFee)],
                    s.bonusFee ? ['🎁 奖励金额', `+${formatFee(s.bonusFee)}`] : null,
                    s.deductionFee ? [`⚠️ 扣款${s.deductionReason ? `（${s.deductionReason}）` : ''}`, `-${formatFee(s.deductionFee)}`] : null,
                  ].filter(Boolean).map(([k, v]) => (
                    <View key={k as string} style={{
                      display: 'flex', justifyContent: 'space-between',
                      padding: '14rpx 0', borderBottom: '1rpx solid #F2F3F5'
                    }}>
                      <Text style={{ fontSize: '28rpx', color: '#86909C' }}>{k}</Text>
                      <Text style={{ fontSize: '28rpx', color: '#1D2129', fontWeight: 500 }}>{v}</Text>
                    </View>
                  ))}
                  <View style={{
                    display: 'flex', justifyContent: 'space-between',
                    padding: '20rpx 0', marginTop: '8rpx'
                  }}>
                    <Text style={{ fontSize: '30rpx', color: '#1D2129', fontWeight: 700 }}>💵 结算合计</Text>
                    <Text style={{ fontSize: '34rpx', color: '#2E7D32', fontWeight: 800 }}>{formatFee(s.totalFee)}</Text>
                  </View>
                </View>

                <View>
                  <Text style={{ fontSize: '26rpx', color: '#86909C', marginBottom: '8rpx', display: 'block' }}>
                    处理时间
                  </Text>
                  {[
                    ['申请时间', s.applyTime],
                    s.approveTime ? ['审核时间', s.approveTime] : null,
                    s.payTime ? ['到账时间', s.payTime] : null,
                  ].filter(Boolean).map(([k, v]) => (
                    <View key={k as string} style={{
                      display: 'flex', justifyContent: 'space-between',
                      padding: '14rpx 0', borderBottom: '1rpx solid #F2F3F5'
                    }}>
                      <Text style={{ fontSize: '28rpx', color: '#86909C' }}>{k}</Text>
                      <Text style={{ fontSize: '28rpx', color: '#1D2129' }}>{v}</Text>
                    </View>
                  ))}
                  {s.remarks && (
                    <View style={{ padding: '14rpx 0' }}>
                      <Text style={{ fontSize: '28rpx', color: '#86909C', display: 'block', marginBottom: '8rpx' }}>备注</Text>
                      <Text style={{ fontSize: '28rpx', color: '#4E5969' }}>{s.remarks}</Text>
                    </View>
                  )}
                </View>
              </View>
              <View className={styles.modalFooter}>
                <Button
                  className={styles.actionBtn}
                  style={{ flex: 1, height: '80rpx', background: '#F2F3F5', color: '#4E5969' }}
                  onClick={() => handleGoTaskDetail(s)}
                >
                  📦 查看运单
                </Button>
                {s.status === 'pending' && (
                  <>
                    <Button
                      className={`${styles.actionBtnSmall} ${styles.actionBtnReject}`}
                      style={{ flex: 1, height: '80rpx', fontSize: '28rpx' }}
                      onClick={() => handleReject(s)}
                    >
                      ✖️ 驳回
                    </Button>
                    <Button
                      className={`${styles.actionBtnSmall} ${styles.actionBtnApprove}`}
                      style={{ flex: 1, height: '80rpx', fontSize: '28rpx' }}
                      onClick={() => handleApprove(s)}
                    >
                      ✔️ 通过
                    </Button>
                  </>
                )}
                {s.status === 'approved' && (
                  <Button
                    className={`${styles.actionBtnSmall} ${styles.actionBtnPaid}`}
                    style={{ flex: 1, height: '80rpx', fontSize: '28rpx' }}
                    onClick={() => handleMarkPaid(s)}
                  >
                    💰 标记已到账
                  </Button>
                )}
                {s.status === 'rejected' && (
                  <Button
                    className={`${styles.actionBtnSmall} ${styles.actionBtnApprove}`}
                    style={{ flex: 1, height: '80rpx', fontSize: '28rpx' }}
                    onClick={() => {
                      updateSettlement(s.id, { status: 'pending', approveTime: undefined, deductionReason: undefined });
                      Taro.showToast({ title: '已重新提交审核', icon: 'success' });
                      setDetailSettlement(prev => prev ? { ...prev, status: 'pending' as SettlementStatus, approveTime: undefined, deductionReason: undefined } : prev);
                    }}
                  >
                    📝 重新提交
                  </Button>
                )}
                {(s.status === 'paid') && (
                  <Button
                    className={styles.actionBtn}
                    style={{ flex: 1, height: '80rpx' }}
                    onClick={() => setDetailSettlement(null)}
                  >
                    关闭
                  </Button>
                )}
              </View>
            </View>
          </View>
        );
      })()}
    </View>
  );
};

export default SettlementPage;
