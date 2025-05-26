import { Platform, PermissionsAndroid, Alert, Linking } from 'react-native';

// Function xin quyền MANAGE_EXTERNAL_STORAGE cho Android 11+
const requestManageStoragePermission = async () => {
  if (Platform.OS === 'android' && Platform.Version >= 30) {
    try {
      const canManage = await PermissionsAndroid.check('android.permission.MANAGE_EXTERNAL_STORAGE');
      if (!canManage) {
        Alert.alert(
          'Quyền quản lý file',
          'Ứng dụng cần quyền quản lý tất cả file. Bạn sẽ được chuyển đến cài đặt.',
          [
            { text: 'Hủy', style: 'cancel' },
            { 
              text: 'Mở cài đặt', 
              onPress: () => {
                Linking.openSettings();
              }
            }
          ]
        );
        return false;
      }
      return true;
    } catch (error) {
      console.warn('Lỗi khi kiểm tra MANAGE_EXTERNAL_STORAGE:', error);
      return false;
    }
  }
  return true;
};

// Function xin quyền bộ nhớ được cải thiện
const requestStoragePermission = async () => {
  if (Platform.OS === 'android') {
    try {
      // Kiểm tra phiên bản Android
      const androidVersion = Platform.Version;
      
      if (androidVersion >= 33) {
        // Android 13+ (API 33+) - Sử dụng quyền media mới
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_AUDIO,
        ]);
        
        return Object.values(granted).every(
          permission => permission === PermissionsAndroid.RESULTS.GRANTED
        );
      } else if (androidVersion >= 30) {
        // Android 11+ (API 30+) - Scoped Storage
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          {
            title: 'Quyền truy cập bộ nhớ',
            message: 'Ứng dụng cần quyền để truy cập file trên thiết bị',
            buttonNeutral: 'Hỏi lại sau',
            buttonNegative: 'Hủy',
            buttonPositive: 'Đồng ý',
          }
        );
        
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        // Android 10 và thấp hơn
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        ], {
          title: 'Quyền truy cập bộ nhớ',
          message: 'Ứng dụng cần quyền để đọc và ghi file',
          buttonNeutral: 'Hỏi lại sau',
          buttonNegative: 'Hủy',
          buttonPositive: 'Đồng ý',
        });
        
        return (
          granted[PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE] === PermissionsAndroid.RESULTS.GRANTED &&
          granted[PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE] === PermissionsAndroid.RESULTS.GRANTED
        );
      }
    } catch (err) {
      console.warn('Lỗi khi xin quyền:', err);
      return false;
    }
  }
  return true; // iOS không cần xin quyền này
};

// Function kiểm tra quyền đã được cấp chưa
const checkStoragePermission = async () => {
  if (Platform.OS === 'android') {
    try {
      const androidVersion = Platform.Version;
      
      if (androidVersion >= 33) {
        const hasPermission = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
        );
        return hasPermission;
      } else {
        const hasPermission = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
        );
        return hasPermission;
      }
    } catch (err) {
      console.warn('Lỗi khi kiểm tra quyền:', err);
      return false;
    }
  }
  return true;
};

// Function sử dụng với UI feedback
const requestStoragePermissionWithFeedback = async () => {
  try {
    // Kiểm tra quyền trước
    const hasPermission = await checkStoragePermission();
    if (hasPermission) {
      Alert.alert('Thông báo', 'Ứng dụng đã có quyền truy cập bộ nhớ');
      return true;
    }

    // Xin quyền nếu chưa có
    const granted = await requestStoragePermission();
    
    if (granted) {
      Alert.alert('Thành công', 'Đã cấp quyền truy cập bộ nhớ');
      return true;
    } else {
      Alert.alert(
        'Cần quyền truy cập', 
        'Vui lòng cấp quyền trong Cài đặt > Ứng dụng > [Tên ứng dụng] > Quyền',
        [
          { text: 'Hủy', style: 'cancel' },
          { text: 'Mở cài đặt', onPress: () => openAppSettings() }
        ]
      );
      return false;
    }
  } catch (error) {
    console.error('Lỗi khi xử lý quyền:', error);
    Alert.alert('Lỗi', 'Không thể xin quyền truy cập bộ nhớ');
    return false;
  }
};

// Function mở cài đặt ứng dụng
const openAppSettings = () => {
  if (Platform.OS === 'android') {
    const { Linking } = require('react-native');
    Linking.openSettings();
  }
};

// Cách sử dụng trong component
const ExampleUsage = () => {
  const handleRequestPermission = async () => {
    const hasPermission = await requestStoragePermissionWithFeedback();
    
    if (hasPermission) {
      // Tiếp tục với logic của ứng dụng
      console.log('Có thể truy cập bộ nhớ');
      // Ví dụ: đọc file, lưu file, etc.
    } else {
      console.log('Không có quyền truy cập bộ nhớ');
    }
  };

  return handleRequestPermission;
};

export { 
  requestStoragePermission, 
  checkStoragePermission, 
  requestStoragePermissionWithFeedback,
  requestManageStoragePermission,
  openAppSettings 
};