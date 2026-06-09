import React from 'react';
import { View, Text, Button } from '@tarojs/components';
import styles from './index.module.scss';

interface EmptyStateProps {
  icon?: string;
  text?: string;
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon = '🎋',
  text = '暂无数据',
  title,
  description,
  actionText,
  onAction
}) => {
  const displayTitle = title || text;
  const displayDesc = description || '稍后再来看看吧';

  return (
    <View className={styles.container}>
      <View className={styles.icon}>
        <Text className={styles.iconText}>{icon}</Text>
      </View>
      <Text className={styles.title}>{displayTitle}</Text>
      <Text className={styles.desc}>{displayDesc}</Text>
      {actionText && onAction && (
        <Button className={styles.actionBtn} onClick={onAction}>
          <Text className={styles.actionText}>{actionText}</Text>
        </Button>
      )}
    </View>
  );
};

export default EmptyState;
