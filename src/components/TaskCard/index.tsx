import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import StatusBadge from '@/components/StatusBadge';
import { Task } from '@/types/task';
import { formatFee, formatWeight, formatTime } from '@/utils';
import styles from './index.module.scss';

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onClick }) => {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      Taro.navigateTo({
        url: `/pages/task-detail/index?id=${task.id}`
      });
    }
  };

  return (
    <View className={styles.card} onClick={handleClick}>
      <View className={styles.header}>
        <View className={styles.taskNo}>
          <Text className={styles.taskNoText}>运单号：{task.taskNo}</Text>
        </View>
        <StatusBadge status={task.status} size='sm' />
      </View>

      <View className={styles.route}>
        <View className={styles.point}>
          <View className={styles.startDot} />
          <View className={styles.addrWrap}>
            <Text className={styles.addrLabel}>装货点</Text>
            <Text className={styles.addr}>{task.pickupAddress}</Text>
          </View>
        </View>
        <View className={styles.line} />
        <View className={styles.point}>
          <View className={styles.endDot} />
          <View className={styles.addrWrap}>
            <Text className={styles.addrLabel}>收货点</Text>
            <Text className={styles.addr}>{task.deliveryAddress}</Text>
          </View>
        </View>
      </View>

      <View className={styles.infoRow}>
        <View className={styles.infoItem}>
          <Text className={styles.infoLabel}>预估重量</Text>
          <Text className={styles.infoValue}>{formatWeight(task.estimatedWeight)}</Text>
        </View>
        <View className={styles.infoItem}>
          <Text className={styles.infoLabel}>竹捆数量</Text>
          <Text className={styles.infoValue}>{task.bundleCount}捆</Text>
        </View>
        <View className={styles.infoItem}>
          <Text className={styles.infoLabel}>运费</Text>
          <Text className={styles.fee}>{formatFee(task.estimatedFee)}</Text>
        </View>
      </View>

      <View className={styles.footer}>
        <View className={styles.plate}>
          <Text className={styles.plateText}>{task.plateNumber}</Text>
        </View>
        <Text className={styles.time}>{formatTime(task.publishTime)}发布</Text>
      </View>
    </View>
  );
};

export default TaskCard;
