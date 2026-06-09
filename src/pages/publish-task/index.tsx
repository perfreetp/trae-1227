import React, { useState } from 'react';
import { View, Text, Input, Button, Textarea } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';

const PublishTaskPage: React.FC = () => {
  const [pickupAddress, setPickupAddress] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [estimatedWeight, setEstimatedWeight] = useState('');
  const [bundleCount, setBundleCount] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [heightLimit, setHeightLimit] = useState('4.2');
  const [widthLimit, setWidthLimit] = useState('2.5');
  const [remarks, setRemarks] = useState('');

  const handleLocatePickup = () => {
    Taro.getLocation({
      type: 'gcj02',
      success: () => {
        setPickupAddress('彭州市龙门山镇团山村竹林场');
        Taro.showToast({ title: '定位成功', icon: 'success' });
      },
      fail: () => {
        Taro.showToast({ title: '请手动输入地址', icon: 'none' });
      }
    });
  };

  const estimateFee = () => {
    const w = parseFloat(estimatedWeight) || 0;
    const p = parseFloat(unitPrice) || 0;
    return Math.round((w / 1000) * p);
  };

  const handleSubmit = () => {
    if (!pickupAddress) {
      Taro.showToast({ title: '请填写装货地址', icon: 'none' });
      return;
    }
    if (!deliveryAddress) {
      Taro.showToast({ title: '请填写收货地址', icon: 'none' });
      return;
    }
    if (!estimatedWeight || parseFloat(estimatedWeight) <= 0) {
      Taro.showToast({ title: '请填写预估重量', icon: 'none' });
      return;
    }
    if (!bundleCount || parseInt(bundleCount) <= 0) {
      Taro.showToast({ title: '请填写竹捆数量', icon: 'none' });
      return;
    }
    if (!unitPrice || parseFloat(unitPrice) <= 0) {
      Taro.showToast({ title: '请填写运输单价', icon: 'none' });
      return;
    }
    Taro.showLoading({ title: '发布中...' });
    setTimeout(() => {
      Taro.hideLoading();
      Taro.showModal({
        title: '发布成功',
        content: `运竹需求已发布\n预估运费：¥${estimateFee()}`,
        showCancel: false,
        confirmText: '好的',
        success: () => Taro.navigateBack()
      });
    }, 1200);
  };

  return (
    <View className={styles.page}>
      <View className={styles.card}>
        <Text className={styles.cardTitle}>📍 运输路线</Text>
        <View className={styles.formItem}>
          <Text className={styles.formLabel}>
            <Text className={styles.required}>*</Text>装货地址
          </Text>
          <View className={styles.inputGroup}>
            <View className={classnames(styles.formInputWrap)}>
              <Input
                className={styles.formInput}
                placeholder='请输入或定位装货地点'
                value={pickupAddress}
                onInput={(e) => setPickupAddress(e.detail.value)}
              />
            </View>
            <Button className={styles.locateBtn} onClick={handleLocatePickup}>
              <Text className={styles.locateBtnText}>📍 定位</Text>
            </Button>
          </View>
        </View>
        <View className={styles.formItem}>
          <Text className={styles.formLabel}>
            <Text className={styles.required}>*</Text>收货地址
          </Text>
          <View className={classnames(styles.formInputWrap)}>
            <Input
              className={styles.formInput}
              placeholder='请输入收购点或目的地地址'
              value={deliveryAddress}
              onInput={(e) => setDeliveryAddress(e.detail.value)}
            />
          </View>
        </View>
      </View>

      <View className={styles.card}>
        <Text className={styles.cardTitle}>📦 货物信息</Text>
        <View className={styles.formItem}>
          <Text className={styles.formLabel}>
            <Text className={styles.required}>*</Text>预估重量
          </Text>
          <View className={classnames(styles.formInputWrap)}>
            <Input
              className={styles.formInput}
              type='digit'
              placeholder='请输入预估重量'
              value={estimatedWeight}
              onInput={(e) => setEstimatedWeight(e.detail.value)}
            />
            <Text className={styles.formUnit}>公斤</Text>
          </View>
        </View>
        <View className={styles.formItem}>
          <Text className={styles.formLabel}>
            <Text className={styles.required}>*</Text>竹捆数量
          </Text>
          <View className={classnames(styles.formInputWrap)}>
            <Input
              className={styles.formInput}
              type='number'
              placeholder='请输入预估竹捆数'
              value={bundleCount}
              onInput={(e) => setBundleCount(e.detail.value)}
            />
            <Text className={styles.formUnit}>捆</Text>
          </View>
        </View>
        <View className={styles.formItem}>
          <Text className={styles.formLabel}>
            <Text className={styles.required}>*</Text>车牌号码
          </Text>
          <View className={classnames(styles.formInputWrap)}>
            <Input
              className={styles.formInput}
              placeholder='指定车牌号（如不限可留空）'
              value={plateNumber}
              onInput={(e) => setPlateNumber(e.detail.value)}
            />
          </View>
        </View>
      </View>

      <View className={styles.card}>
        <Text className={styles.cardTitle}>💰 运费设置</Text>
        <View className={styles.formItem}>
          <Text className={styles.formLabel}>
            <Text className={styles.required}>*</Text>运输单价
          </Text>
          <View className={classnames(styles.formInputWrap)}>
            <Input
              className={styles.formInput}
              type='digit'
              placeholder='请输入运输单价'
              value={unitPrice}
              onInput={(e) => setUnitPrice(e.detail.value)}
            />
            <Text className={styles.formUnit}>元/吨</Text>
          </View>
        </View>
        {parseFloat(estimatedWeight) > 0 && parseFloat(unitPrice) > 0 && (
          <View className={styles.feePreview}>
            <View className={styles.feeRow}>
              <Text className={styles.feeLabel}>预估运费</Text>
              <Text className={styles.feeAmount}>¥{estimateFee()}</Text>
            </View>
            <View className={styles.feeRow}>
              <Text className={styles.feeLabel}>计算方式</Text>
              <Text className={styles.feeCalc}>
                {(parseFloat(estimatedWeight) / 1000).toFixed(1)}吨 × ¥{unitPrice}/吨
              </Text>
            </View>
          </View>
        )}
      </View>

      <View className={styles.card}>
        <Text className={styles.cardTitle}>🚛 车辆限制</Text>
        <View className={styles.twoCol}>
          <View className={styles.formItem} style={{ flex: 1, marginRight: 16 }}>
            <Text className={styles.formLabel}>限高</Text>
            <View className={classnames(styles.formInputWrap)}>
              <Input
                className={styles.formInput}
                type='digit'
                value={heightLimit}
                onInput={(e) => setHeightLimit(e.detail.value)}
              />
              <Text className={styles.formUnit}>米</Text>
            </View>
          </View>
          <View className={styles.formItem} style={{ flex: 1 }}>
            <Text className={styles.formLabel}>限宽</Text>
            <View className={classnames(styles.formInputWrap)}>
              <Input
                className={styles.formInput}
                type='digit'
                value={widthLimit}
                onInput={(e) => setWidthLimit(e.detail.value)}
              />
              <Text className={styles.formUnit}>米</Text>
            </View>
          </View>
        </View>
      </View>

      <View className={styles.card}>
        <Text className={styles.cardTitle}>📝 备注说明</Text>
        <View className={styles.formItem}>
          <Textarea
            className={styles.textarea}
            placeholder='如有特殊要求请备注（如装车时间、路况说明等）'
            value={remarks}
            onInput={(e) => setRemarks(e.detail.value)}
            maxlength={200}
          />
        </View>
      </View>

      <View className={styles.bottomBar}>
        <Button className={styles.btnPrimary} onClick={handleSubmit}>
          <Text className={styles.btnPrimaryText}>✅ 发布运竹需求</Text>
        </Button>
      </View>
    </View>
  );
};

export default PublishTaskPage;
