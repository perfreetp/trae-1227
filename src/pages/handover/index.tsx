import React, { useState, useMemo } from 'react';
import { View, Text, Button, Image, Textarea } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { mockTasks } from '@/data/tasks';
import { Task } from '@/types/task';
import { formatWeight, formatFee } from '@/utils';
import styles from './index.module.scss';

type TabType = 'scan' | 'exception' | 'receipt';

const HandoverPage: React.FC = () => {
  const router = useRouter();
  const taskId = router.params.id || '5';
  const task = useMemo<Task>(() => mockTasks.find(t => t.id === taskId) || mockTasks[4], [taskId]);
  const [activeTab, setActiveTab] = useState<TabType>('scan');
  const [exceptionText, setExceptionText] = useState('');
  const [exceptionPhotos, setExceptionPhotos] = useState<string[]>([]);
  const [receiptPhotos, setReceiptPhotos] = useState<string[]>(task.weightReceiptPhoto ? [task.weightReceiptPhoto] : []);

  const handleScan = () => {
    Taro.showLoading({ title: '扫码中...' });
    setTimeout(() => {
      Taro.hideLoading();
      Taro.showModal({
        title: '扫码确认',
        content: `收购点：彭州市濛阳镇竹制品厂\n运单号：${task.taskNo}\n实际重量：${formatWeight(task.actualWeight || task.estimatedWeight)}\n实际运费：${formatFee(task.actualFee || task.estimatedFee)}\n\n确认到场交接完成？`,
        success: (res) => {
          if (res.confirm) {
            Taro.showToast({ title: '交接成功', icon: 'success' });
            setTimeout(() => {
              Taro.navigateTo({ url: `/pages/settlement/index?taskId=${task.id}` });
            }, 1000);
          }
        }
      });
    }, 1500);
  };

  const handleAddPhoto = (type: 'exception' | 'receipt') => {
    Taro.chooseImage({
      count: type === 'exception' ? 9 - exceptionPhotos.length : 3 - receiptPhotos.length,
      success: (res) => {
        const mockUrls = [
          'https://picsum.photos/id/1043/300/300',
          'https://picsum.photos/id/1044/300/300',
          'https://picsum.photos/id/1025/300/300'
        ];
        const paths = (res.tempFilePaths || res.tempFiles.map(f => f.path)).slice(0, 3).map((_, i) => mockUrls[i]);
        if (type === 'exception') {
          setExceptionPhotos([...exceptionPhotos, ...paths].slice(0, 9));
        } else {
          setReceiptPhotos([...receiptPhotos, ...paths].slice(0, 3));
        }
        Taro.showToast({ title: '上传成功', icon: 'success' });
      }
    });
  };

  const handleSubmitException = () => {
    if (!exceptionText && exceptionPhotos.length === 0) {
      Taro.showToast({ title: '请填写异常描述或上传图片', icon: 'none' });
      return;
    }
    Taro.showLoading({ title: '提交中...' });
    setTimeout(() => {
      Taro.hideLoading();
      Taro.showModal({
        title: '异常已上报',
        content: '平台和收购点已收到您的异常报告，将尽快处理。',
        showCancel: false,
        success: () => {
          setExceptionText('');
          setExceptionPhotos([]);
          setActiveTab('scan');
        }
      });
    }, 1000);
  };

  const handleSubmitReceipt = () => {
    if (receiptPhotos.length === 0) {
      Taro.showToast({ title: '请上传磅单照片', icon: 'none' });
      return;
    }
    Taro.showLoading({ title: '提交中...' });
    setTimeout(() => {
      Taro.hideLoading();
      Taro.showToast({ title: '磅单已补传', icon: 'success' });
    }, 1000);
  };

  return (
    <View className={styles.page}>
      <View className={styles.taskCard}>
        <View className={styles.taskHeader}>
          <Text className={styles.taskNo}>运单：{task.taskNo}</Text>
          <Text className={styles.statusTag}>已到达</Text>
        </View>
        <View className={styles.taskRoute}>
          <Text className={styles.routeText}>
            📍 {task.pickupAddress.slice(0, 12)} → {task.deliveryAddress.slice(0, 12)}
          </Text>
        </View>
        <View className={styles.taskInfo}>
          <View className={styles.infoBlock}>
            <Text className={styles.infoLabel}>实际重量</Text>
            <Text className={styles.infoValue}>{formatWeight(task.actualWeight || task.estimatedWeight)}</Text>
          </View>
          <View className={styles.infoBlock}>
            <Text className={styles.infoLabel}>运费</Text>
            <Text className={styles.infoValueFee}>{formatFee(task.actualFee || task.estimatedFee)}</Text>
          </View>
          <View className={styles.infoBlock}>
            <Text className={styles.infoLabel}>车牌</Text>
            <Text className={styles.infoValue}>{task.plateNumber}</Text>
          </View>
        </View>
      </View>

      <View className={styles.tabs}>
        {[
          { key: 'scan', label: '📱 扫码确认' },
          { key: 'exception', label: '⚠️ 异常上报' },
          { key: 'receipt', label: '📄 补传磅单' }
        ].map(tab => (
          <View
            key={tab.key}
            className={`${styles.tab} ${activeTab === tab.key ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(tab.key as TabType)}
          >
            <Text className={activeTab === tab.key ? styles.tabTextActive : styles.tabText}>
              {tab.label}
            </Text>
          </View>
        ))}
      </View>

      {activeTab === 'scan' && (
        <View className={styles.contentCard}>
          <View className={styles.scanArea}>
            <View className={styles.scanBox}>
              <Text className={styles.scanIcon}>📷</Text>
              <Text className={styles.scanHint}>点击下方按钮扫一扫</Text>
              <Text className={styles.scanDesc}>扫描收购点二维码完成到场确认</Text>
            </View>
          </View>
          <View className={styles.tips}>
            <Text className={styles.tipsTitle}>温馨提示：</Text>
            <Text className={styles.tipsItem}>1. 请确保车辆已停放在指定区域</Text>
            <Text className={styles.tipsItem}>2. 请配合收购点人员验货过磅</Text>
            <Text className={styles.tipsItem}>3. 磅单照片可在"补传磅单"中上传</Text>
            <Text className={styles.tipsItem}>4. 如有异常请及时上报</Text>
          </View>
          <Button className={styles.scanBtn} onClick={handleScan}>
            <Text className={styles.scanBtnText}>📱 立即扫码确认</Text>
          </Button>
        </View>
      )}

      {activeTab === 'exception' && (
        <View className={styles.contentCard}>
          <Text className={styles.sectionTitle}>异常描述</Text>
          <Textarea
            className={styles.textarea}
            placeholder='请详细描述异常情况（如货物损坏、道路受阻、车辆故障等）...'
            value={exceptionText}
            onInput={(e) => setExceptionText(e.detail.value)}
            maxlength={500}
          />
          <Text className={styles.sectionTitle}>上传凭证（{exceptionPhotos.length}/9）</Text>
          <View className={styles.photoGrid}>
            {exceptionPhotos.map((p, i) => (
              <View key={i} className={styles.photoItem}>
                <Image className={styles.photoImg} src={p} mode='aspectFill' />
              </View>
            ))}
            {exceptionPhotos.length < 9 && (
              <View className={styles.photoItem} onClick={() => handleAddPhoto('exception')}>
                <View className={styles.photoAdd}>
                  <Text className={styles.photoAddIcon}>📷</Text>
                  <Text className={styles.photoAddText}>添加图片</Text>
                </View>
              </View>
            )}
          </View>
          <Button className={styles.submitBtn} onClick={handleSubmitException}>
            <Text className={styles.submitBtnText}>✅ 提交异常报告</Text>
          </Button>
        </View>
      )}

      {activeTab === 'receipt' && (
        <View className={styles.contentCard}>
          <Text className={styles.sectionTitle}>磅单照片（{receiptPhotos.length}/3）</Text>
          <View className={styles.photoGrid}>
            {receiptPhotos.map((p, i) => (
              <View key={i} className={styles.photoItem}>
                <Image className={styles.photoImg} src={p} mode='aspectFill' />
              </View>
            ))}
            {receiptPhotos.length < 3 && (
              <View className={styles.photoItem} onClick={() => handleAddPhoto('receipt')}>
                <View className={styles.photoAdd}>
                  <Text className={styles.photoAddIcon}>📷</Text>
                  <Text className={styles.photoAddText}>上传磅单</Text>
                </View>
              </View>
            )}
          </View>
          <View className={styles.tips}>
            <Text className={styles.tipsTitle}>磅单说明：</Text>
            <Text className={styles.tipsItem}>1. 请确保磅单信息清晰可辨</Text>
            <Text className={styles.tipsItem}>2. 需包含皮重、毛重、净重等关键信息</Text>
            <Text className={styles.tipsItem}>3. 磅单将作为运费结算依据</Text>
          </View>
          <Button className={styles.submitBtn} onClick={handleSubmitReceipt}>
            <Text className={styles.submitBtnText}>📄 提交磅单</Text>
          </Button>
        </View>
      )}
    </View>
  );
};

export default HandoverPage;
