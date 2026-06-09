import React from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { mockUserProfile } from '@/data/users';
import { roleMap, formatFee } from '@/utils';
import styles from './index.module.scss';

const MinePage: React.FC = () => {
  const user = mockUserProfile;

  const menuGroups = [
    {
      title: '业务管理',
      items: [
        { icon: '💰', label: '费用结算', desc: '运费预估、结算申请', badge: '3笔待审核', url: '/pages/settlement/index' },
        { icon: '📋', label: '历史运单', desc: '查询历史运输记录', url: '/pages/history-orders/index' },
        { icon: '📊', label: '月度明细', desc: '导出月度运输明细', url: '/pages/monthly-detail/index' }
      ]
    },
    {
      title: '评价与设置',
      items: [
        { icon: '⭐', label: '评价合作方', desc: '对竹农和收购点评价', url: '/pages/rating/index' },
        { icon: '🔔', label: '消息设置', desc: '管理通知推送', url: '' },
        { icon: '❓', label: '帮助中心', desc: '常见问题解答', url: '' },
        { icon: '⚙️', label: '个人设置', desc: '修改资料、切换角色', url: '' }
      ]
    }
  ];

  const handleMenuClick = (url: string) => {
    if (!url) {
      Taro.showToast({ title: '功能开发中', icon: 'none' });
      return;
    }
    Taro.navigateTo({ url });
  };

  return (
    <View className={styles.page}>
      <View className={styles.profileHeader}>
        <View className={styles.profileTop}>
          <Image
            className={styles.avatar}
            src={user.avatar || 'https://picsum.photos/id/64/200/200'}
            mode='aspectFill'
          />
          <View className={styles.profileInfo}>
            <Text className={styles.profileName}>{user.name}</Text>
            <View className={styles.profileRole}>
              🎋 {roleMap[user.role]} · 评分{user.rating}
            </View>
            <Text className={styles.profilePhone}>📱 {user.phone}</Text>
          </View>
        </View>

        <View className={styles.statsBar}>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{user.totalOrders}</Text>
            <Text className={styles.statLabel}>累计运单</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{formatFee(user.totalFee)}</Text>
            <Text className={styles.statLabel}>累计收入</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{user.rating}</Text>
            <Text className={styles.statLabel}>服务评分</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>2年+</Text>
            <Text className={styles.statLabel}>入驻时长</Text>
          </View>
        </View>
      </View>

      <View className={styles.vehicleCard}>
        <Text className={styles.vehicleIcon}>🚚</Text>
        <View className={styles.vehicleInfo}>
          <Text className={styles.vehiclePlate}>{user.plateNumber}</Text>
          <Text className={styles.vehicleType}>{user.vehicleType}</Text>
        </View>
        <Text
          style={{ fontSize: '24rpx', color: '#2E7D32', fontWeight: '500' }}
          onClick={() => Taro.showToast({ title: '车辆信息完整', icon: 'success' })}
        >
          查看详情 ›
        </Text>
      </View>

      {menuGroups.map(group => (
        <View key={group.title} className={styles.section}>
          <Text className={styles.sectionTitle}>{group.title}</Text>
          {group.items.map(item => (
            <View
              key={item.label}
              className={styles.menuItem}
              onClick={() => handleMenuClick(item.url)}
            >
              <View className={styles.menuIcon}>{item.icon}</View>
              <View className={styles.menuContent}>
                <Text className={styles.menuLabel}>{item.label}</Text>
                <Text className={styles.menuDesc}>{item.desc}</Text>
              </View>
              <View className={styles.menuExtra}>
                {item.badge && <View className={styles.menuBadge}>{item.badge}</View>}
                <Text className={styles.menuArrow}>›</Text>
              </View>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
};

export default MinePage;
