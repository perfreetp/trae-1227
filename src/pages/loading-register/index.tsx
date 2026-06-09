import React, { useState } from 'react';
import { View, Text, Input, Image, Button, Textarea } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { mockTasks } from '@/data/tasks';
import { Task } from '@/types/task';
import styles from './index.module.scss';

const acceptedTasks = mockTasks.filter(t => t.status === 'accepted' || t.status === 'loading');

const LoadingRegisterPage: React.FC = () => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [bundleCount, setBundleCount] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [unitPrice, setUnitPrice] = useState<string>('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [location, setLocation] = useState<{ address: string; lat: number; lng: number } | null>(null);
  const [loadingPerson, setLoadingPerson] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');

  const selectTask = () => {
    const tasks = acceptedTasks;
    if (tasks.length === 0) {
      Taro.showToast({ title: '暂无已接单任务', icon: 'none' });
      return;
    }
    Taro.showActionSheet({
      itemList: tasks.map(t => `${t.taskNo} ${t.pickupAddress.slice(0, 15)}...`),
      success: (res) => {
        setSelectedTask(tasks[res.tapIndex]);
        setUnitPrice(String(tasks[res.tapIndex].unitPrice));
      }
    });
  };

  const addPhoto = () => {
    Taro.chooseImage({
      count: 9 - photos.length,
      success: (res) => {
        const tempFiles = res.tempFilePaths || res.tempFiles.map(f => f.path);
        const mockUrls = [
          'https://picsum.photos/id/1018/300/300',
          'https://picsum.photos/id/1015/300/300',
          'https://picsum.photos/id/1036/300/300'
        ];
        const newPhotos = tempFiles.slice(0, 3).map((_, i) => mockUrls[i % mockUrls.length]);
        setPhotos([...photos, ...newPhotos].slice(0, 9));
        Taro.showToast({ title: '上传成功', icon: 'success' });
      }
    });
  };

  const deletePhoto = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newPhotos = photos.filter((_, i) => i !== index);
    setPhotos(newPhotos);
  };

  const getLocation = () => {
    Taro.getLocation({
      type: 'gcj02',
      success: (res) => {
        setLocation({
          address: '彭州市龙门山镇团山村竹林场（定位获取）',
          lat: res.latitude || 31.15,
          lng: res.longitude || 103.78
        });
        Taro.showToast({ title: '定位成功', icon: 'success' });
      },
      fail: () => {
        setLocation({
          address: '彭州市龙门山镇团山村竹林场（已选择）',
          lat: 31.15,
          lng: 103.78
        });
        Taro.showToast({ title: '已使用任务地址', icon: 'none' });
      }
    });
  };

  const estimatedFee = () => {
    const w = parseFloat(weight) || 0;
    const p = parseFloat(unitPrice) || 0;
    return Math.round((w / 1000) * p);
  };

  const handleSave = () => {
    if (!selectedTask) {
      Taro.showToast({ title: '请选择任务', icon: 'none' });
      return;
    }
    if (!bundleCount || parseInt(bundleCount) <= 0) {
      Taro.showToast({ title: '请填写竹捆数量', icon: 'none' });
      return;
    }
    if (!weight || parseFloat(weight) <= 0) {
      Taro.showToast({ title: '请填写装车重量', icon: 'none' });
      return;
    }
    if (photos.length === 0) {
      Taro.showToast({ title: '请上传竹捆照片', icon: 'none' });
      return;
    }
    if (!location) {
      Taro.showToast({ title: '请定位装车点', icon: 'none' });
      return;
    }
    Taro.showLoading({ title: '保存中...' });
    setTimeout(() => {
      Taro.hideLoading();
      Taro.showModal({
        title: '登记成功',
        content: `运单${selectedTask.taskNo}装车登记已完成\n预估运费：¥${estimatedFee()}`,
        showCancel: false,
        confirmText: '好的',
        success: () => {
          setBundleCount('');
          setWeight('');
          setPhotos([]);
          setLocation(null);
          setLoadingPerson('');
          setRemarks('');
          setSelectedTask(null);
        }
      });
    }, 1000);
  };

  const handleReset = () => {
    Taro.showModal({
      title: '确认重置',
      content: '确定要清空所有填写内容吗？',
      success: (res) => {
        if (res.confirm) {
          setSelectedTask(null);
          setBundleCount('');
          setWeight('');
          setPhotos([]);
          setLocation(null);
          setLoadingPerson('');
          setRemarks('');
        }
      }
    });
  };

  return (
    <View className={styles.page}>
      <View className={styles.selector}>
        <Text className={styles.selectorLabel}>📋 选择运单</Text>
        <Button className={styles.taskSelector} onClick={selectTask}>
          {selectedTask ? (
            <View className={styles.taskSelectorContent}>
              <Text className={styles.taskSelectorNo}>{selectedTask.taskNo}</Text>
              <Text className={styles.taskSelectorAddr}>
                {selectedTask.pickupAddress} → {selectedTask.deliveryAddress}
              </Text>
            </View>
          ) : (
            <Text className={styles.taskSelectorEmpty}>请选择需要登记装车的运单</Text>
          )}
          <Text className={styles.taskSelectorArrow}>›</Text>
        </Button>
      </View>

      <View className={styles.formCard}>
        <Text className={styles.formTitle}>
          <Text className={styles.formTitleIcon}>📸</Text>
          竹捆拍照记录
        </Text>
        <View className={styles.formItem}>
          <Text className={styles.formLabel}>
            <Text className={styles.formLabelRequired}>*</Text>
            上传竹捆照片（最多9张，用于数量核对）
          </Text>
          <View className={styles.photoGrid}>
            {photos.map((photo, index) => (
              <View key={index} className={styles.photoItem}>
                <Image className={styles.photoImg} src={photo} mode='aspectFill' />
                <View className={styles.photoDelete} onClick={(e) => deletePhoto(index, e as any)}>
                  <Text className={styles.photoDeleteText}>×</Text>
                </View>
              </View>
            ))}
            {photos.length < 9 && (
              <View className={styles.photoItem}>
                <Button className={styles.photoAdd} onClick={addPhoto}>
                  <Text className={styles.photoAddIcon}>📷</Text>
                  <Text className={styles.photoAddText}>拍照/上传</Text>
                </Button>
              </View>
            )}
          </View>
        </View>
      </View>

      <View className={styles.formCard}>
        <Text className={styles.formTitle}>
          <Text className={styles.formTitleIcon}>📝</Text>
          装车信息填写
        </Text>

        <View className={styles.formItem}>
          <Text className={styles.formLabel}>
            <Text className={styles.formLabelRequired}>*</Text>
            竹捆数量
          </Text>
          <View className={classnames(styles.formInputWrap)}>
            <Input
              className={styles.formInput}
              type='number'
              placeholder='请输入竹捆数量'
              value={bundleCount}
              onInput={(e) => setBundleCount(e.detail.value)}
            />
            <Text className={styles.formUnit}>捆</Text>
          </View>
        </View>

        <View className={styles.formItem}>
          <Text className={styles.formLabel}>
            <Text className={styles.formLabelRequired}>*</Text>
            装车重量
          </Text>
          <View className={classnames(styles.formInputWrap)}>
            <Input
              className={styles.formInput}
              type='digit'
              placeholder='请输入实际过磅重量'
              value={weight}
              onInput={(e) => setWeight(e.detail.value)}
            />
            <Text className={styles.formUnit}>公斤</Text>
          </View>
        </View>

        <View className={styles.formItem}>
          <Text className={styles.formLabel}>
            <Text className={styles.formLabelRequired}>*</Text>
            单价
          </Text>
          <View className={classnames(styles.formInputWrap)}>
            <Input
              className={styles.formInput}
              type='digit'
              placeholder='运输单价'
              value={unitPrice}
              onInput={(e) => setUnitPrice(e.detail.value)}
            />
            <Text className={styles.formUnit}>元/吨</Text>
          </View>
        </View>

        <View className={styles.formItem}>
          <Text className={styles.formLabel}>装车人员</Text>
          <View className={classnames(styles.formInputWrap)}>
            <Input
              className={styles.formInput}
              placeholder='请输入装车人员姓名'
              value={loadingPerson}
              onInput={(e) => setLoadingPerson(e.detail.value)}
            />
          </View>
        </View>
      </View>

      <View className={styles.formCard}>
        <Text className={styles.formTitle}>
          <Text className={styles.formTitleIcon}>📍</Text>
          装车点定位
        </Text>
        <View className={styles.locationCard}>
          <Text className={styles.locationIcon}>📍</Text>
          {location ? (
            <View className={styles.locationInfo}>
              <Text className={styles.locationAddr}>{location.address}</Text>
              <Text className={styles.locationCoords}>
                经度: {location.lng.toFixed(4)} / 纬度: {location.lat.toFixed(4)}
              </Text>
            </View>
          ) : (
            <View className={styles.locationInfo}>
              <Text className={styles.locationAddr} style={{ color: '#86909C' }}>
                未定位，请点击右侧按钮获取位置
              </Text>
            </View>
          )}
          <Button className={styles.locationBtn} onClick={getLocation}>
            <Text className={styles.locationBtnText}>{location ? '重新定位' : '获取位置'}</Text>
          </Button>
        </View>
      </View>

      {(parseFloat(weight) > 0 && parseFloat(unitPrice) > 0) && (
        <View className={styles.feePreview}>
          <Text className={styles.feePreviewTitle}>💰 运费预估</Text>
          <View className={styles.feeRow}>
            <Text className={styles.feeLabel}>装车重量</Text>
            <Text className={styles.feeValue}>{weight ? `${(parseFloat(weight) / 1000).toFixed(1)} 吨` : '-'}</Text>
          </View>
          <View className={styles.feeRow}>
            <Text className={styles.feeLabel}>运输单价</Text>
            <Text className={styles.feeValue}>¥{unitPrice || '0'}/吨</Text>
          </View>
          <View className={styles.feeRow}>
            <Text className={styles.feeLabel}>预估运费</Text>
            <Text className={styles.feeTotal}>¥{estimatedFee()}</Text>
          </View>
        </View>
      )}

      <View className={styles.formCard}>
        <Text className={styles.formTitle}>
          <Text className={styles.formTitleIcon}>📝</Text>
          备注信息
        </Text>
        <View className={styles.formItem}>
          <Textarea
            className={styles.remarkTextarea}
            placeholder='如有特殊情况请备注（选填）'
            value={remarks}
            onInput={(e) => setRemarks(e.detail.value)}
            maxlength={200}
          />
        </View>
      </View>

      <View className={styles.bottomBar}>
        <Button className={styles.btnSecondary} onClick={handleReset}>
          <Text className={styles.btnSecondaryText}>重置</Text>
        </Button>
        <Button className={styles.btnPrimary} onClick={handleSave}>
          <Text className={styles.btnPrimaryText}>✅ 提交装车登记</Text>
        </Button>
      </View>
    </View>
  );
};

export default LoadingRegisterPage;
