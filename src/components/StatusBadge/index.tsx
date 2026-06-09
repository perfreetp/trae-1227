import React from 'react';
import { View, Text } from '@tarojs/components';
import { TaskStatus } from '@/types/task';
import { statusMap } from '@/utils';
import styles from './index.module.scss';

interface StatusBadgeProps {
  status: TaskStatus;
  size?: 'sm' | 'md';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const config = statusMap[status];
  return (
    <View
      className={size === 'sm' ? styles.badgeSm : styles.badge}
      style={{ backgroundColor: config.bgColor }}
    >
      <Text className={styles.text} style={{ color: config.color }}>
        {config.text}
      </Text>
    </View>
  );
};

export default StatusBadge;
