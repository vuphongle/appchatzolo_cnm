import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import Footer from '../Chat/Footer';

const ScreenCloud = () => {
  const navigation = useNavigation();
  const tabs = ['Tất cả', 'Văn bản', 'Ảnh', 'File', 'Link'];
  
  const files = [
    { id: '1', name: 'image1.jpg', type: 'JPG', size: '518 KB', date: '23:29' },
    // { id: '2', name: 'image2.jpg', type: 'JPG', size: '833 KB', date: '23:29' },
    // { id: '3', name: 'image3.jpg', type: 'JPG', size: '754 KB', date: '23:29' },
    { id: '4', name: 'video.mp4', type: 'MP4', size: '3.0 MB', date: '16:47 28/01/2025' }
  ];

  const FileItem = ({ file }) => (
    <View style={styles.fileItem}>
      <View style={styles.fileItemLeft}>
        <View style={styles.fileIcon}>
          <Ionicons name={file.type === 'MP4' ? 'play-circle' : 'image'} size={24} color={file.type === 'MP4' ? '#FF6B6B' : '#FFA500'} />
        </View>
        <View style={styles.fileDetails}>
          <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
          <Text style={styles.fileInfo}>{file.type} · {file.size}</Text>
        </View>
      </View>
      <View style={styles.fileItemRight}>
        <TouchableOpacity>
          <Ionicons name="share-outline" size={24} color="#666" />
        </TouchableOpacity>
        <TouchableOpacity>
          <Ionicons name="heart-outline" size={24} color="#666" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E90FF" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cloud của tôi</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity><Ionicons name="apps" size={26} color="white" /></TouchableOpacity>
          <TouchableOpacity><Ionicons name="search" size={26} color="white" /></TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate("CloudStorageScreen")}>
            <Ionicons name="menu" size={26} color="white" />
          </TouchableOpacity>
        </View>
      </View>
      <View style={{ height: 60 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabContainer}>
          {tabs.map((tab, index) => (
            <TouchableOpacity key={index} style={[styles.tab, index === 0 && styles.activeTab]}>
              <Text style={[styles.tabText, index === 0 && styles.activeTabText]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      <ScrollView contentContainerStyle={styles.fileList}>
        <Text style={styles.sectionTitle}>Bộ sưu tập</Text>
        {files.map(file => (<FileItem key={file.id} file={file} />))}
        {/* <View style={styles.warningContainer}>
          <Ionicons name="warning" size={24} color="red" />
          <Text style={styles.warningText}>Đã đầy dung lượng Cloud của tôi</Text>
        </View> */}
      </ScrollView>
      <View style={styles.bottomNav}><Footer /></View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E90FF',
    padding: 16,
    // paddingTop: StatusBar.currentHeight + 16,
  },
  headerTitle: {
    flex: 1,
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 16,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 16,
  },
  headerIcon: {
    marginLeft: 16,
  },
  tabContainer: {
    backgroundColor: 'white',
    paddingVertical: 4,
    flex:1
    ,justifyContent:'space-between',alignItems:'center'
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    height:40,
    backgroundColor: '#F0F0F0',
    justifyContent:'center'
  },
  activeTab: {
    backgroundColor: '#E0E0E0',
  },
  tabText: {
    color: '#666',
  },
  activeTabText: {
    color: '#000',
  },
  fileList: {
    flex: 1,
   
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    padding: 16,
    paddingBottom: 10
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E6F3FF',
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    paddingBottom:20
  },
  fileItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fileIcon: {
    width: 40,
    height: 40,
    backgroundColor: 'white',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileDetails: {
    marginLeft: 12,
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    color: '#333',
  },
  fileInfo: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  fileItemRight: {
    flexDirection: 'row',
    gap: 16,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE5E5',
    padding: 16,
    margin: 16,
    borderRadius: 8,
  },
  warningText: {
    color: 'red',
    marginLeft: 8,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    position:'absolute',
    bottom:0
  },
  bottomNavItem: {
    alignItems: 'center',
  },
  bottomNavText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
});

export default ScreenCloud;
