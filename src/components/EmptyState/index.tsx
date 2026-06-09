import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';

interface EmptyStateProps {
  title?: string;
  description?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title = '暂无数据',
  description = '稍后再来看看吧'
}) => {
  return (
    <View className={styles.container}>
      <View className={styles.icon}>
        <Text className={styles.iconText}>🎋</Text>
      </View>
      <Text className={styles.title}>{title}</Text>
      <Text className={styles.desc}>{description}</Text>
    </View>
  );
};

export default EmptyState;
