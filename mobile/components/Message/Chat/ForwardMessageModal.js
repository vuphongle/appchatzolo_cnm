import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MessageService from '../../../services/MessageService';
import UserService from '../../../services/UserService';

const ForwardMessageModal = ({ visible, onClose, originalMessageId, senderID, message, type }) => {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  // Load friends when modal becomes visible
  useEffect(() => {
    if (visible) {
      loadFriends();
    } else {
      // Reset state when modal closes
      setSelectedFriends([]);
      setSearchText('');
      setError(null);
    }
  }, [visible]);

  // Load friends from UserService
  const loadFriends = async () => {
    try {
      setLoading(true);
      setError(null);
      const userId=senderID;
      const response = await UserService.getFriends(userId);
      console.log('Danh sách bạn bè:', response);
      // Ensure we have a valid response with data
      if (response ) {
       
        setFriends(response);
      } else {
        setFriends([]);
        setError('Không có dữ liệu bạn bè.');
      }
    } catch (error) {
      console.error('Lỗi khi tải danh sách bạn bè:', error);
      setFriends([]);
      setError('Không thể tải danh sách bạn bè. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  // Toggle selection of a friend
  const toggleSelectFriend = (friendId) => {
    if (selectedFriends.includes(friendId)) {
      setSelectedFriends(selectedFriends.filter(id => id !== friendId));
    } else {
      setSelectedFriends([...selectedFriends, friendId]);
    }
  };

  // Handle forwarding the message
  const handleForwardMessage = async () => {
    if (selectedFriends.length === 0) {
      Alert.alert('Thông báo', 'Vui lòng chọn ít nhất một người nhận.');
      return;
    }

    // Verify that all selected friends are valid (exist in our friends list)
    const validFriendIds = friends.map(friend => friend.id);
    const invalidSelections = selectedFriends.filter(id => !validFriendIds.includes(id));
    
    if (invalidSelections.length > 0) {
      Alert.alert('Lỗi', 'Có lỗi xảy ra với danh sách người nhận. Vui lòng thử lại.');
      return;
    }

    try {
      setSending(true);
      await MessageService.forwardMessage(originalMessageId, senderID, selectedFriends);
      Alert.alert('Thành công', 'Tin nhắn đã được chuyển tiếp thành công!');
      onClose();
    } catch (error) {
      console.error('Lỗi khi chuyển tiếp tin nhắn:', error);
      Alert.alert('Lỗi', 'Không thể chuyển tiếp tin nhắn. Vui lòng thử lại sau.');
    } finally {
      setSending(false);
    }
  };

  // Filter friends based on search text
  const filteredFriends = friends.filter(friend => 
    friend.name.toLowerCase().includes(searchText.toLowerCase())
  );

  // Preview message content
  const renderMessagePreview = () => {
    switch (type) {
      case 'image':
        return (
          <View style={styles.previewContainer}>
            <Text style={styles.previewTitle}>Hình ảnh:</Text>
            <Image source={{ uri: message }} style={styles.previewImage} />
          </View>
        );
      case 'file':
        return (
          <View style={styles.previewContainer}>
            <Text style={styles.previewTitle}>File:</Text>
            <Text style={styles.previewText}>📎 {message.split('/').pop()}</Text>
          </View>
        );
      default:
        return (
          <View style={styles.previewContainer}>
            <Text style={styles.previewTitle}>Tin nhắn:</Text>
            <Text style={styles.previewText} numberOfLines={2}>{message}</Text>
          </View>
        );
    }
  };

  // Render a friend item in the list
  const renderFriendItem = ({ item }) => {
    const isSelected = selectedFriends.includes(item.id);
    
    return (
      <TouchableOpacity 
        style={[styles.friendItem, isSelected && styles.selectedFriend]} 
        onPress={() => toggleSelectFriend(item.id)}
      >
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
        <View style={styles.friendInfo}>
          <Text style={styles.friendName}>{item.name}</Text>
          {item.status && <Text style={styles.status}>{item.status}</Text>}
        </View>
        <View style={styles.checkBox}>
          {isSelected && <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />}
        </View>
      </TouchableOpacity>
    );
  };

  // Render empty list component
  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>
        {error ? error : 
         searchText ? 'Không tìm thấy bạn bè nào.' : 
         'Bạn chưa có bạn bè nào.'}
      </Text>
      {!error && !searchText && (
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={loadFriends}
        >
          <Text style={styles.retryButtonText}>Tải lại</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chuyển tiếp tin nhắn</Text>
          <TouchableOpacity 
            onPress={handleForwardMessage} 
            disabled={selectedFriends.length === 0 || sending}
            style={[
              styles.sendButton, 
              (selectedFriends.length === 0 || sending) && styles.disabledButton
            ]}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.sendButtonText}>Gửi</Text>
            )}
          </TouchableOpacity>
        </View>
        
        {/* Preview of the message to be forwarded */}
        {renderMessagePreview()}
        
        {/* Search */}
        {/* <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm bạn bè..."
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View> */}
        
        {/* Selected count */}
        {selectedFriends.length > 0 && (
          <View style={styles.selectedCount}>
            <Text style={styles.selectedCountText}>
              Đã chọn: {selectedFriends.length} người
            </Text>
          </View>
        )}
        
        {/* Friends list */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0066cc" />
            <Text style={styles.loadingText}>Đang tải danh sách bạn bè...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredFriends}
            renderItem={renderFriendItem}
            keyExtractor={(item) => item.id.toString()}
            ListEmptyComponent={renderEmptyComponent}
          />
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#f8f8f8',
  },
  closeButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  sendButton: {
    backgroundColor: '#0066cc',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  previewContainer: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#f5f5f5',
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#666',
  },
  previewText: {
    fontSize: 16,
    color: '#333',
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 5,
    marginTop: 5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  selectedCount: {
    padding: 10,
    backgroundColor: '#e3f2fd',
    borderBottomWidth: 1,
    borderBottomColor: '#bbdefb',
  },
  selectedCountText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  selectedFriend: {
    backgroundColor: '#f0f9ff',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  status: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  checkBox: {
    width: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 15,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#333',
    fontWeight: '500',
  },
});

export default ForwardMessageModal;