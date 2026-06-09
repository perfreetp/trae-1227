import React, { useState, useMemo } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { mockMonthlyDetail } from '@/data/orders';
import { MonthlyDetail, MonthlyDetailItem } from '@/types/settlement';
import { formatFee, formatWeight } from '@/utils';
import EmptyState from '@/components/EmptyState';
import styles from './index.module.scss';

const MonthlyDetailPage: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState('2026-05');
  const [detailData, setDetailData] = useState<MonthlyDetail>(mockMonthlyDetail);

  const months = useMemo(() => {
    const list: string[] = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      list.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    return list;
  }, []);

  const currentIndex = months.indexOf(currentMonth);

  const handlePrevMonth = () => {
    if (currentIndex < months.length - 1) {
      const newMonth = months[currentIndex + 1];
      setCurrentMonth(newMonth);
      if (newMonth === '2026-05') {
        setDetailData(mockMonthlyDetail);
      } else {
        setDetailData({
          month: newMonth,
          totalOrders: 0,
          totalWeight: 0,
          totalDistance: 0,
          totalFee: 0,
          paidFee: 0,
          pendingFee: 0,
          details: []
        });
      }
    } else {
      Taro.showToast({ title: '已是最早月份', icon: 'none' });
    }
  };

  const handleNextMonth = () => {
    if (currentIndex > 0) {
      const newMonth = months[currentIndex - 1];
      setCurrentMonth(newMonth);
      if (newMonth === '2026-05') {
        setDetailData(mockMonthlyDetail);
      } else {
        setDetailData({
          month: newMonth,
          totalOrders: 0,
          totalWeight: 0,
          totalDistance: 0,
          totalFee: 0,
          paidFee: 0,
          pendingFee: 0,
          details: []
        });
      }
    } else {
      Taro.showToast({ title: '已是最新月份', icon: 'none' });
    }
  };

  const handleSelectMonth = () => {
    Taro.showActionSheet({
      itemList: months,
      success: (res) => {
        const newMonth = months[res.tapIndex];
        setCurrentMonth(newMonth);
        if (newMonth === '2026-05') {
          setDetailData(mockMonthlyDetail);
        } else {
          setDetailData({
            month: newMonth,
            totalOrders: 0,
            totalWeight: 0,
            totalDistance: 0,
            totalFee: 0,
            paidFee: 0,
            pendingFee: 0,
            details: []
          });
        }
      }
    });
  };

  const handleExport = (type: 'excel' | 'share') => {
    Taro.showLoading({ title: type === 'excel' ? '导出中...' : '生成中...' });
    setTimeout(() => {
      Taro.hideLoading();
      if (type === 'excel') {
        Taro.showModal({
          title: '导出成功',
          content: `已导出 ${currentMonth} 月度运输明细\n\n包含：${detailData.totalOrders} 笔运单\n文件格式：Excel (.xlsx)\n\n文件已保存至：我的文件/月度报表/`,
          showCancel: false
        });
      } else {
        Taro.showActionSheet({
          itemList: ['分享到微信好友', '生成图片保存', '发送到邮箱'],
          success: (res) => {
            const actions = ['已分享给微信好友', '图片已保存至相册', '已发送至绑定邮箱'];
            Taro.showToast({ title: actions[res.tapIndex], icon: 'success' });
          }
        });
      }
    }, 1200);
  };

  const handleRowClick = (item: MonthlyDetailItem) => {
    Taro.navigateTo({ url: `/pages/task-detail/index?taskNo=${item.taskNo}` });
  };

  return (
    <View className={styles.page}>
      <View className={styles.monthSelector}>
        <View className={styles.monthNav} onClick={handlePrevMonth}>‹</View>
        <View className={styles.monthDisplay} onClick={handleSelectMonth}>
          <Text className={styles.monthText}>{currentMonth}</Text>
          <Text className={styles.monthSub}>点击切换月份 ▾</Text>
        </View>
        <View className={styles.monthNav} onClick={handleNextMonth}>›</View>
      </View>

      <View className={styles.summaryHeader}>
        <Text className={styles.summaryTitle}>📊 月度收入概览</Text>
        <View className={styles.summaryMain}>
          <Text className={styles.summaryAmount}>{formatFee(detailData.totalFee)}</Text>
          <Text className={styles.summaryUnit}>总收入</Text>
        </View>
        <View className={styles.summaryGrid}>
          <View className={styles.summaryItem}>
            <Text className={styles.summaryValue}>{detailData.totalOrders}</Text>
            <Text className={styles.summaryLabel}>运单数量</Text>
          </View>
          <View className={styles.summaryItem}>
            <Text className={styles.summaryValue}>{detailData.totalWeight}吨</Text>
            <Text className={styles.summaryLabel}>总载重</Text>
          </View>
          <View className={styles.summaryItem}>
            <Text className={styles.summaryValue}>{formatFee(detailData.paidFee)}</Text>
            <Text className={styles.summaryLabel}>已到账</Text>
          </View>
          <View className={styles.summaryItem}>
            <Text className={styles.summaryValue}>{formatFee(detailData.pendingFee)}</Text>
            <Text className={styles.summaryLabel}>待结算</Text>
          </View>
        </View>
      </View>

      <View className={styles.feeBreakdown}>
        <View className={styles.sectionTitle}>
          <View className={styles.titleText}>
            <Text style={{ fontSize: '28rpx', fontWeight: '600', color: '#1B5E20' }}>💰 费用明细</Text>
          </View>
          <Button className={styles.exportBtn} onClick={() => handleExport('excel')}>
            📤 导出明细
          </Button>
        </View>

        <View className={styles.feeRow}>
          <Text className={styles.feeLabel}>
            <Text className={styles.feeIcon}>📦</Text>
            基础运费
          </Text>
          <Text className={styles.feeValue}>{formatFee(Math.round(detailData.totalFee * 0.95))}</Text>
        </View>
        <View className={styles.feeRow}>
          <Text className={styles.feeLabel}>
            <Text className={styles.feeIcon}>🎁</Text>
            月度全勤奖励
          </Text>
          <Text className={`${styles.feeValue} ${styles.feeValuePositive}`}>
            +{formatFee(500)}
          </Text>
        </View>
        <View className={styles.feeRow}>
          <Text className={styles.feeLabel}>
            <Text className={styles.feeIcon}>🏆</Text>
            优秀司机补贴
          </Text>
          <Text className={`${styles.feeValue} ${styles.feeValuePositive}`}>
            +{formatFee(300)}
          </Text>
        </View>
        <View className={styles.feeRow}>
          <Text className={styles.feeLabel}>
            <Text className={styles.feeIcon}>🛣️</Text>
            过路费报销
          </Text>
          <Text className={`${styles.feeValue} ${styles.feeValuePositive}`}>
            +{formatFee(280)}
          </Text>
        </View>
        <View className={styles.feeRow}>
          <Text className={styles.feeLabel}>
            <Text className={styles.feeIcon}>⚠️</Text>
            迟到扣款（1次）
          </Text>
          <Text className={`${styles.feeValue} ${styles.feeValueNegative}`}>
            -{formatFee(100)}
          </Text>
        </View>

        <View className={styles.feeTotalRow}>
          <View className={styles.feeRow} style={{ borderBottom: 'none', padding: 0 }}>
            <Text className={styles.feeLabel} style={{ fontSize: '28rpx', fontWeight: '600', color: '#1B5E20' }}>
              月度实发合计
            </Text>
            <Text style={{ fontSize: '32rpx', fontWeight: '700', color: '#ED6C02' }}>
              {formatFee(detailData.totalFee + 500 + 300 + 280 - 100)}
            </Text>
          </View>
        </View>
      </View>

      <View className={styles.detailTableCard}>
        <View className={styles.tableHeader}>
          <Text className={`${styles.tableHeaderCell} ${styles.cellDate}`}>日期</Text>
          <Text className={`${styles.tableHeaderCell} ${styles.cellNo}`}>运单号</Text>
          <Text className={`${styles.tableHeaderCell} ${styles.cellRoute}`}>路线</Text>
          <Text className={`${styles.tableHeaderCell} ${styles.cellWeight}`}>重量</Text>
          <Text className={`${styles.tableHeaderCell} ${styles.cellFee}`}>运费</Text>
          <Text className={`${styles.tableHeaderCell} ${styles.cellStatus}`}>状态</Text>
        </View>

        {detailData.details.length === 0 ? (
          <EmptyState
            icon="📊"
            text="本月暂无运输记录"
            description="完成运单后这里会显示月度明细~"
            actionText="去任务大厅"
            onAction={() => Taro.switchTab({ url: '/pages/task-hall/index' })}
          />
        ) : (
          detailData.details.map((item, idx) => (
            <View key={idx} className={styles.tableRow} onClick={() => handleRowClick(item)}>
              <Text className={`${styles.tableCell} ${styles.cellDate}`}>{item.date.slice(5)}</Text>
              <Text className={`${styles.tableCell} ${styles.cellNo}`}>{item.taskNo.slice(-4)}</Text>
              <Text className={`${styles.tableCell} ${styles.cellRoute}`}>{item.route}</Text>
              <Text className={`${styles.tableCell} ${styles.cellWeight}`}>{item.weight}吨</Text>
              <Text className={`${styles.tableCell} ${styles.cellFee}`}>{formatFee(item.fee)}</Text>
              <Text className={`${styles.tableCell} ${styles.cellStatus} ${item.status === '已结' ? styles.statusPaid : styles.statusPending}`}>
                {item.status}
              </Text>
            </View>
          ))
        )}
      </View>

      {detailData.details.length > 0 && (
        <View className={styles.bottomBar}>
          <View className={styles.shareRow}>
            <Button className={`${styles.shareBtn} ${styles.secondaryBtn}`} onClick={() => handleExport('share')}>
              📤 分享报表
            </Button>
            <Button className={`${styles.shareBtn} ${styles.primaryBtn}`} onClick={() => handleExport('excel')}>
              📊 导出Excel
            </Button>
          </View>
        </View>
      )}
    </View>
  );
};

export default MonthlyDetailPage;
