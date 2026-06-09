import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { usePullDownRefresh } from '@tarojs/taro';
import EmptyState from '@/components/EmptyState';
import { mockMessages } from '@/data/messages';
import { Message, MessageType } from '@/types/user';
import { messageTypeMap, formatTime } from '@/utils';
import classnames from 'classnames';
import styles from './index.module.scss';

const tabs = [
  { key: 'all', label: '全部' },
  { key: 'weather', label: '天气' },
  { key: 'road', label: '道路' },
  { key: 'task', label: '任务' },
  { key: 'system', label: '系统' }
];

const MessageCenterPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [messages, setMessages] = useState<Message[]>(mockMessages);

  usePullDownRefresh(() => {
    setTimeout(() => {
      Taro.stopPullDownRefresh();
      Taro.showToast({ title: '已刷新', icon: 'success' });
    }, 1000);
  });

  const unreadCounts = useMemo(() => {
    const counts: Record<string, number> = { all: 0 };
    messages.forEach(m => {
      if (!m.isRead) {
        counts.all++;
        counts[m.type] = (counts[m.type] || 0) + 1;
      }
    });
    return counts;
  }, [messages]);

  const filteredMessages = useMemo(() => {
    if (activeTab === 'all') return messages;
    return messages.filter(m => m.type === activeTab);
  }, [messages, activeTab]);

  const handleMessageClick = (msg: Message) => {
    setMessages(prev => prev.map(m =>
      m.id === msg.id ? { ...m, isRead: true } : m
    ));
    Taro.showModal({
      title: msg.title,
      content: msg.content,
      showCancel: false,
      confirmText: '知道了'
    });
  };

  const markAllRead = () => {
    if (unreadCounts.all === 0) {
      Taro.showToast({ title: '全部已读', icon: 'none' });
      return;
    }
    Taro.showModal({
      title: '全部已读',
      content: `确定将${unreadCounts.all}条未读消息标记为已读吗？`,
      success: (res) => {
        if (res.confirm) {
          setMessages(prev => prev.map(m => ({ ...m, isRead: true })));
          Taro.showToast({ title: '已全部标记', icon: 'success' });
        }
      }
    });
  };

  return (
    <View className={styles.page}>
      <View className={styles.tabs}>
        {tabs.map(tab => (
          <View
            key={tab.key}
            className={classnames(
              styles.tab,
              activeTab === tab.key && styles.tabActive
            )}
            onClick={() => setActiveTab(tab.key)}
          >
            <Text
              className={classnames(
                styles.tabText,
                activeTab === tab.key && styles.tabTextActive
              )}
            >
              {tab.label}
            </Text>
            {(unreadCounts[tab.key] || 0) > 0 && <View className={styles.tabDot} />}
          </View>
        ))}
        <View
          onClick={markAllRead}
          style={{
            padding: '0 16rpx',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '22rpx',
            color: '#2E7D32',
            fontWeight: '500',
            borderLeft: '1rpx solid #f2f3f5'
          }}
        >
          全部已读
        </View>
      </View>

      {filteredMessages.length > 0 ? (
        <ScrollView scrollY enhanced showScrollbar={false}>
          {filteredMessages.map(msg => {
            const typeConfig = messageTypeMap[msg.type];
            return (
              <View
                key={msg.id}
                className={classnames(
                  styles.messageItem,
                  !msg.isRead && styles.messageItemUnread
                )}
                onClick={() => handleMessageClick(msg)}
              >
                <View className={styles.messageHeader}>
                  <View className={styles.messageTypeWrap}>
                    <View
                      className={styles.messageTypeTag}
                      style={{
                        backgroundColor: `${typeConfig.color}15`,
                        color: typeConfig.color
                      }}
                    >
                      {typeConfig.text}
                    </View>
                    {msg.level === 'urgent' && (
                      <View className={classnames(styles.levelBadge, styles.levelUrgent)}>
                        紧急
                      </View>
                    )}
                    {msg.level === 'warning' && (
                      <View className={classnames(styles.levelBadge, styles.levelWarning)}>
                        预警
                      </View>
                    )}
                  </View>
                  <Text className={styles.messageTime}>{formatTime(msg.time)}</Text>
                </View>
                <Text className={styles.messageTitle}>{msg.title}</Text>
                <Text className={styles.messageContent}>{msg.content}</Text>
                {!msg.isRead && <View className={styles.unreadDot} />}
              </View>
            );
          })}
        </ScrollView>
      ) : (
        <EmptyState
          title='暂无消息'
          description='有新消息会第一时间通知您'
        />
      )}
    </View>
  );
};

export default MessageCenterPage;
