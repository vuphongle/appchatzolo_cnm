import React, { useEffect, useState, useContext, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Pressable,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import SearchBar from '../components/SearchBar';
import { IPV4, AVATAR_URL_DEFAULT } from '@env';
import { UserContext } from '../context/UserContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  GestureHandlerRootView,
  Swipeable,
} from 'react-native-gesture-handler';
import UserDetailModal from '../components/UserDetailModal';
//import useFriendRequestCount from '../hooks/useFriendRequestCount';

const DanhBaScreen = () => {
  const navigation = useNavigation();
  const { user, notification } = useContext(UserContext);
  const [activeTab, setActiveTab] = useState('friends');
  const [receivedCount, setReceivedCount] = useState(0);
  const [friends, setFriends] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState(null);
//  const friendRequestsCount = useFriendRequestCount(user);

  // Ref để quản lý Swipeable đang mở
  const currentlyOpenSwipeable = useRef(null);
  const swipeableRefs = useRef(new Map());

  useEffect(() => {
    const fetchFriends = async () => {
      if (!user?.id) return;
      try {
        const response = await fetch(`${IPV4}/user/${user.id}/friends`);
        const data = await response.json();
        setFriends(data);
      } catch (error) {
        console.error('Error fetching friends:', error);
      }
    };
    fetchFriends();
  }, [user?.id, notification]);

  useEffect(() => {
    const fetchReceivedCount = async () => {
      try {
        const response = await fetch(
          `${IPV4}/messages/invitations/received/${user?.id}`,
        );
        const data = await response.json();
        setReceivedCount(data.length);
      } catch (error) {
        console.error('Error fetching friend requests count:', error);
      }
    };
    fetchReceivedCount();
  }, [user?.id, notification]);

  // 10s tải lại danh sách bạn bè
  useEffect(() => {
      const fetchFriends = async () => {
          if (!user?.id) return;
          try {
              const response = await fetch(`${IPV4}/user/${user.id}/friends`);
              const data = await response.json();
              setFriends(data);
          } catch (error) {
              console.error('Error fetching friends:', error);
          }
      };

      // Lần đầu chạy ngay khi component render
      fetchFriends();

      // Khai báo interval và gọi lại hàm fetchFriends sau mỗi 5 giây
      const interval = setInterval(fetchFriends, 10000); // 5000ms = 5 giây

      // Cleanup function để clear interval khi component unmount
      return () => clearInterval(interval);
  }, [user?.id]); // Chạy lại useEffect khi user.id thay đổi

  // Dummy data nhóm
  const dummyGroups = [
    { id: 1, name: 'Nhóm UI/UX', membersCount: 5 },
    { id: 2, name: 'Nhóm React Native', membersCount: 10 },
  ];

  // Hàm hiển thị các nút bên phải khi vuốt
  const renderRightActions = (progress, dragX, contact) => {
    return (
      <View style={styles.rightActionsContainer}>
        {/* Nút "Thêm" */}
        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            { backgroundColor: pressed ? '#7D8590' : '#9199a4' },
          ]}
          onPress={() => handleAdd(contact)}
        >
          <Ionicons name="ellipsis-horizontal" size={24} color="#fff" />
          <Text style={styles.actionButtonText}>Thêm</Text>
        </Pressable>

        {/* Nút "Nhật ký" */}
        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            { backgroundColor: pressed ? '#394296' : '#4752bb' },
          ]}
          onPress={() => handleJournal(contact)}
        >
          <Ionicons name="time-outline" size={24} color="#fff" />
          <Text style={styles.actionButtonText}>Nhật ký</Text>
        </Pressable>

        {/* Nút "Xóa" */}
        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            { backgroundColor: pressed ? '#BE403C' : '#ed504b' },
          ]}
          onPress={() => handleDelete(contact)}
        >
          <Ionicons name="trash-outline" size={24} color="#fff" />
          <Text style={styles.actionButtonText}>Xóa</Text>
        </Pressable>
      </View>
    );
  };

  const handleAdd = (contact) => {
    setSelectedFriend(contact);
    setIsModalVisible(true);
  };

  const handleJournal = (contact) => {
    Alert.alert('Thông báo','Chưa phát triển tính năng này');
    console.log('Nhật ký', contact.name);
  };

  const handleDelete = (contact) => {
    Alert.alert(
      'Xác nhận xóa',
      `Bạn có chắc chắn muốn xóa ${contact.name} khỏi danh sách bạn bè?`,
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Xóa',
          onPress: async () => {
            try {
              const response = await fetch(
                `${IPV4}/user/${user.id}/removeFriend/${contact.id}`,
                {
                  method: 'DELETE',
                },
              );

              if (!response.ok) {
                const errorMessage = await response.text();
                alert(`Lỗi: ${errorMessage}`);
                return;
              }

              // Cập nhật lại danh sách bạn bè sau khi xóa
              setFriends(friends.filter((friend) => friend.id !== contact.id));

              setIsModalVisible(false);

              // Thông báo xóa thành công
              Alert.alert(
                'Xóa thành công',
                `${contact.name} đã được xóa khỏi danh sách bạn bè.`,
              );
            } catch (error) {
              console.error('Lỗi khi xóa bạn bè:', error);
              alert('Lỗi khi xóa bạn bè. Vui lòng thử lại.');
            }
          },
        },
      ],
      { cancelable: false },
    );
  };

  const handleNavigateChat = (contact) => {
      navigation.navigate('Chat', {
        receiverid: contact.id,
        name: contact.name,
        avatar: contact.avatar || AVATAR_URL_DEFAULT,
      });
  };

  const renderFriendsTab = () => {
    return (
      <ScrollView style={styles.content}>
        <View style={styles.shortcutContainer}>
          <TouchableOpacity
            style={styles.shortcutItem}
            onPress={() => navigation.navigate('FriendInvitesScreen')}
          >
            <View style={styles.shortcutItemRow}>
              <Ionicons
                name="person-add-outline"
                size={20}
                color="#000"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.shortcutText}>
                Lời mời kết bạn{receivedCount > 0 ? ` (${receivedCount})` : ''}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.friendsHeader}>
          <Text style={styles.friendsHeaderText}>Tất cả {friends.length}</Text>
        </View>

        {friends.map((contact) => (
          <Swipeable
            key={contact.id}
            // Gán ref cho từng Swipeable
            ref={(ref) => swipeableRefs.current.set(contact.id, ref)}
            onSwipeableWillOpen={() => {
              const currentRef = swipeableRefs.current.get(contact.id);
              if (
                currentlyOpenSwipeable.current &&
                currentlyOpenSwipeable.current !== currentRef
              ) {
                // Đóng Swipeable đang mở trước đó
                currentlyOpenSwipeable.current.close();
              }
              // Cập nhật Swipeable đang mở
              currentlyOpenSwipeable.current = currentRef;
            }}
            onSwipeableWillClose={() => {
              const currentRef = swipeableRefs.current.get(contact.id);
              if (currentlyOpenSwipeable.current === currentRef) {
                currentlyOpenSwipeable.current = null;
              }
            }}
            renderRightActions={(progress, dragX) =>
              renderRightActions(progress, dragX, contact)
            }
          >
            <TouchableOpacity style={styles.contactItem} onPress={() => handleNavigateChat(contact)}>
              <Image
                source={{ uri: contact.avatar || AVATAR_URL_DEFAULT }}
                style={styles.contactAvatar}
              />
              <Text style={styles.contactName}>{contact.name}</Text>
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={28}
                color="#787878"
                style={{ marginRight: 10 }}
              />
            </TouchableOpacity>
          </Swipeable>
        ))}
      </ScrollView>
    );
  };

  const renderGroupsTab = () => {
    return (
      <ScrollView style={styles.content}>
        {dummyGroups.map((group) => (
          <View key={group.id} style={styles.groupItem}>
            <Text style={styles.groupName}>
              {group.name} - {group.membersCount} thành viên
            </Text>
          </View>
        ))}
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <SearchBar
        placeholder="Tìm kiếm"
        leftIcon="search"
        rightIcon="notifications"
      />

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'friends' && styles.activeTab,
          ]}
          onPress={() => setActiveTab('friends')}
        >
          <Text style={styles.tabButtonText}>Bạn bè</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'groups' && styles.activeTab]}
          onPress={() => setActiveTab('groups')}
        >
          <Text style={styles.tabButtonText}>Nhóm</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'friends' ? renderFriendsTab() : renderGroupsTab()}

      {/* Show the UserDetailModal */}
      <UserDetailModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        friend={selectedFriend}
        onDeleteFriend={handleDelete} // Pass delete function
        onSendMessage={handleNavigateChat}
      />
    </View>
  );
};

export default DanhBaScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#F9F9F9',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 3,
    borderColor: '#1e90ff',
  },
  tabButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 15,
    paddingTop: 10,
  },
  shortcutContainer: {
    marginBottom: 15,
  },
  shortcutItem: {
    backgroundColor: '#F9F9F9',
    padding: 10,
    marginBottom: 10,
    borderRadius: 6,
  },
  shortcutItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shortcutText: {
    fontSize: 16,
  },
  friendsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  friendsHeaderText: {
    fontSize: 15,
    color: '#666',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    height: 60,
    backgroundColor: '#f9f9f9',
    marginBottom: 5,
  },
  contactAvatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    marginRight: 10,
  },
  contactName: {
    fontSize: 16,
    flex: 1,
  },
  groupItem: {
    backgroundColor: '#F9F9F9',
    padding: 10,
    borderRadius: 6,
    marginBottom: 10,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '500',
  },
  rightActionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 60,
  },
  actionButton: {
    width: 80,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    marginTop: 4,
  },
});
