import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    Image,
  } from 'react-native';
  import Icon from 'react-native-vector-icons/Ionicons';
  import { useNavigation } from '@react-navigation/native';
  const CloudStorageScreen = () => {
    const navigation = useNavigation();
    return (
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Cloud của tôi</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.headerIcon}>
              <Icon name="help-circle-outline" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIcon}>
              <Icon name="settings-outline" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
  
        {/* Cloud Icon and Status */}
        <View style={styles.cloudStatus}>
          <View style={styles.cloudIconContainer}>
             <Icon name="cloud" size={48} color="white" />
          </View>
          <Text style={styles.statusTitle}>Đã đầy dung lượng Cloud của tôi</Text>
          <Text style={styles.statusSubtitle}>
            Nội dung bạn gửi vào sẽ chỉ được lưu tạm thời nếu không dọn dẹp dữ liệu
          </Text>
        </View>
  
        {/* Storage Usage */}
        <View style={styles.storageSection}>
          <View style={styles.storageHeader}>
            <Text style={styles.storageTitle}>Dung lượng</Text>
            <Text style={styles.storageValue}>1,29 GB / 500 MB</Text>
          </View>
          
          {/* Progress Bar */}
          <View style={styles.progressBar}>
            <View style={styles.progressImage} />
            <View style={styles.progressVideo} />
            <View style={styles.progressFile} />
            <View style={styles.progressOther} />
          </View>
          
          {/* Legend */}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#FF9500' }]} />
              <Text style={styles.legendText}>Ảnh</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#34C759' }]} />
              <Text style={styles.legendText}>Video</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#FFD60A' }]} />
              <Text style={styles.legendText}>File</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#8E8E93' }]} />
              <Text style={styles.legendText}>Khác</Text>
            </View>
          </View>
        </View>
  
        {/* Add Storage Section */}
        <View style={styles.actionSection}>
          <Text style={styles.actionTitle}>Thêm dung lượng với zCloud</Text>
          <Text style={styles.actionSubtitle}>
            100 GB dành cho Cloud của tôi và toàn bộ dữ liệu trò chuyện
          </Text>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Thêm dung lượng</Text>
          </TouchableOpacity>
        </View>
  
        {/* Clean Up Section */}
        <View style={styles.actionSection}>
          <Text style={styles.actionTitle}>Dọn dẹp dữ liệu Cloud của tôi</Text>
          <Text style={styles.actionSubtitle}>
            Xóa bớt nội dung không cần thiết để có thêm dung lượng trống
          </Text>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Xem và dọn dẹp</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  };
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F2F2F7',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#0091FF',
      padding: 16,
      
    },
    headerTitle: {
      flex: 1,
      color: 'white',
      fontSize: 18,
      fontWeight: '600',
      marginLeft: 12,
    },
    headerRight: {
      flexDirection: 'row',
      gap: 16,
    },
    headerIcon: {
      marginLeft: 8,
    },
    cloudStatus: {
      alignItems: 'center',
      padding: 24,
    },
    cloudIconContainer: {
      width: 80,
      height: 80,
      backgroundColor: '#0091FF',
      borderRadius: 40,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    statusTitle: {
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 8,
    },
    statusSubtitle: {
      fontSize: 14,
      color: '#666',
      textAlign: 'center',
      paddingHorizontal: 32,
    },
    storageSection: {
      backgroundColor: 'white',
      padding: 16,
      marginVertical: 8,
    },
    storageHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    storageTitle: {
      fontSize: 16,
      fontWeight: '600',
    },
    storageValue: {
      fontSize: 16,
      color: '#FF3B30',
      fontWeight: '600',
    },
    progressBar: {
      height: 8,
      backgroundColor: '#E5E5EA',
      borderRadius: 4,
      flexDirection: 'row',
      overflow: 'hidden',
    },
    progressImage: {
      flex: 3,
      backgroundColor: '#FF9500',
    },
    progressVideo: {
      flex: 2,
      backgroundColor: '#34C759',
    },
    progressFile: {
      flex: 4,
      backgroundColor: '#FFD60A',
    },
    progressOther: {
      flex: 1,
      backgroundColor: '#8E8E93',
    },
    legend: {
      flexDirection: 'row',
      marginTop: 12,
      justifyContent: 'space-around',
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    legendDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 4,
    },
    legendText: {
      fontSize: 12,
      color: '#666',
    },
    actionSection: {
      backgroundColor: 'white',
      padding: 16,
      marginBottom: 8,
    },
    actionTitle: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 4,
    },
    actionSubtitle: {
      fontSize: 14,
      color: '#666',
      marginBottom: 12,
    },
    actionButton: {
      backgroundColor: '#F2F2F7',
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 20,
      alignSelf: 'flex-start',
    },
    actionButtonText: {
      color: '#007AFF',
      fontSize: 14,
      fontWeight: '500',
    },
  });
  
  export default CloudStorageScreen;
  