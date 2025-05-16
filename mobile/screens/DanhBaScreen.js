import React, { useEffect, useState, useContext, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Pressable,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator
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
import { useFocusEffect } from '@react-navigation/native';
import ListFriend from '../components/Message/listFriend/ListFriend';
import { v4 as uuidv4 } from 'uuid';

const formatPhoneNumber = (phone) => {
  const cleaned = phone.replace(/\s+/g, '');

  if (!/^(\+?\d+)$/.test(cleaned)) {
    return null;
  }

  if (cleaned.startsWith('+84')) {
    return cleaned;
  }

  if (cleaned.startsWith('0')) {
    return '+84' + cleaned.substring(1);
  }

  return cleaned;
};

const DanhBaScreen = () => {
  const navigation = useNavigation();
  const { user, notification, updateUserProfile, isChange, accept, reject, fetchUserProfile } = useContext(UserContext);
  const [activeTab, setActiveTab] = useState('friends');
  const [receivedCount, setReceivedCount] = useState(0);
  const [friends, setFriends] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [searchText, setSearchText] = useState('');
  const searchInputRef = useRef(null);
  const [message, setMessage] = useState('Kết bạn với mình nhé.');
  const [friendRequestStatus, setFriendRequestStatus] = useState('Kết bạn');

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
  }, [user?.friendIds, notification, isChange, accept, reject]);

  // Dummy data nhóm
  const dummyGroups = [
    { id: 1, name: 'Nhóm UI/UX', membersCount: 5 },
    { id: 2, name: 'Nhóm React Native', membersCount: 10 },
  ];

  const handleSearchBarFocus = () => {
    setIsSearching(true);

    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 0);
  };

  const handleClearSearch = () => {
    setIsSearching(false);
    setSearchText('');
    setSearchResult(null);
  };

  const handleAddFriend = async () => {
    if (!searchResult) return;

    const newFriendRequest = {
      id: uuidv4(),
      content: message,  // Use the custom message here
      sendDate: new Date().toISOString(),
      senderID: user?.id,
      receiverID: searchResult.id,
      isRead: false,
      media: null,
      status: 'Chờ đồng ý',
    };

    try {
      const response = await fetch(IPV4 + '/messages/addFriend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newFriendRequest),
      });

      if (response.ok) {
        console.log('Lời mời kết bạn đã được gửi');
      } else {
        console.log('Gửi lời mời kết bạn thất bại');
      }
      checkFriendRequestStatus();
      setIsModalVisible(false);
    } catch (error) {
      console.error('Có lỗi xảy ra khi gửi lời mời kết bạn:', error);
    }
  };

  // Hàm xóa lời mời kết bạn
  const handleDeleteFriendRequest = async () => {
    if (!searchResult) return;

    try {
      const response = await fetch(
        IPV4 + '/messages/invitations/' + user?.id + '/' + searchResult.id,
        {
          method: 'DELETE',
        },
      );

      if (response.ok) {
        console.log('Lời mời kết bạn đã được xóa');
        setFriendRequestStatus('Kết bạn');
      } else {
        console.log('Xóa lời mời kết bạn thất bại');
      }
    } catch (error) {
      console.error('Có lỗi xảy ra khi xóa lời mời kết bạn:', error);
    }
  };

  // Hàm kiểm tra trạng thái lời mời kết bạn
  const checkFriendRequestStatus = async () => {
    if (!searchResult) return;

    try {
      // Kiểm tra nếu searchResult.id đã có trong friendIds
      if (user.friendIds && user?.friendIds.includes(searchResult.id)) {
        setFriendRequestStatus('Bạn bè');
      } else {
        // Kiểm tra xem có phải đã gửi lời mời kết bạn không
        const response = await fetch(
          IPV4 + '/messages/invitations/sent/' + user?.id,
        );
        const invitations = await response.json();

        const sentInvitation = invitations.find(
          (invitation) => invitation.receiverID === searchResult.id,
        );

        if (sentInvitation) {
          setFriendRequestStatus('Hoàn tác');
        } else {
          setFriendRequestStatus('Kết bạn');
        }
      }
    } catch (error) {
      console.error('Có lỗi xảy ra khi kiểm tra lời mời:', error);
    }
  };

  useEffect(() => {
    if (!searchText.trim()) {
      setSearchResult(null);
      return;
    }

    const timer = setTimeout(() => {
      handleSearch();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchText]);

  const handleSearch = async () => {
    if (!searchText.trim()) return;

    // Định dạng số điện thoại trước khi tìm kiếm
    const formattedPhone = formatPhoneNumber(searchText);
    if (!formattedPhone) {
      return;
    }

    setLoading(true);
    const result = await fetchUserProfile(formattedPhone);

    if (result) {
      if (result.id === user?.id) {
        setSearchResult({ ...result, isOwnProfile: true });
      } else {
        setSearchResult({ ...result, isOwnProfile: false });
      }
    } else {
      setSearchResult(null);
    }
    setLoading(false);
  };

  const sendFriendRequest = async () => {
    if (friendRequestStatus === 'Hoàn tác') {
      handleDeleteFriendRequest();
    } else if (friendRequestStatus === 'Kết bạn') {
      // Hiện modal khi người dùng bấm "Kết bạn"
      setIsModalVisible(true);
    }
  };

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
              updateUserProfile();
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
      <ListFriend userId={user?.id} requestType="Group"/>
    );
  };

  return (
    <View style={styles.container}>
      {!isSearching ? (
        <>
          <SearchBar
            placeholder="Tìm kiếm số điện thoại"
            leftIcon="search"
            rightIcon="add"
            mainTabName="Contacts"
            searchText={searchText}
            setSearchText={(text) => {
              setSearchText(text);
              setIsSearching(!!text);
            }}
            onFocus={handleSearchBarFocus}
            inputRef={searchInputRef}
          />
        </>
      ) :(
      <View style={styles.searchScreen}>
          <View style={styles.searchHeader}>
            <SearchBar
              placeholder="Tìm kiếm số điện thoại"
              leftIcon="arrow-back"
              onLeftIconPress={handleClearSearch}
              searchText={searchText}
              setSearchText={setSearchText}
              inputRef={searchInputRef}
            />
            <TouchableOpacity
              onPress={() => console.log('Search initiated')}
              style={styles.searchButton}
            >
              <Text style={styles.searchButtonText}>Tìm</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.resultContainer}>
            {loading ? (
              <ActivityIndicator size="large" color="#0000ff" />
            ) : searchResult ? (
              <View style={styles.header}>
                <Image
                  source={{
                    uri: searchResult.avatar || 'https://placehold.co/100x100',
                  }}
                  style={styles.avatar}
                />
                <View>
                  <Text style={styles.name}>
                    {searchResult.name || 'Người dùng vô danh'}
                  </Text>
                  <Text style={styles.phone}>
                    {searchResult.phoneNumber || 'Chưa có số điện thoại'}
                  </Text>
                </View>
                {!searchResult.isOwnProfile && (
                  <>
                    <TouchableOpacity
                      onPress={sendFriendRequest}
                      style={styles.addFriendButton}
                    >
                      <Text style={styles.addFriendButtonText}>
                        {friendRequestStatus}
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            ) : (
              <Text style={styles.noResult}>
                {searchText
                  ? 'Không tìm thấy người dùng'
                  : 'Nhập số điện thoại để tìm kiếm'}
              </Text>
            )}
          </ScrollView>
        </View>
      )}

{/* Modal nhập lời mời kết bạn */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Gửi yêu cầu kết bạn</Text>
            <TextInput
              style={styles.messageInput}
              placeholder="Xin chào, nhập lời mời của bạn"
              value={message}
              onChangeText={setMessage}
              multiline
            />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
                <TouchableOpacity
                    style={styles.buttonAddFriend}
                    onPress={handleAddFriend}
                >
                    <Text style={styles.buttonText}>Gửi yêu cầu</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.buttonCancel}
                    onPress={() => setIsModalVisible(false)}
                >
                    <Text style={styles.buttonText}>Hủy</Text>
                </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {!isSearching && (
      <>
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
      </>
      )}


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
  searchScreen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  searchButton: {
    marginLeft: 10,
    backgroundColor: '#007AFF',
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultContainer: {
    padding: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: '#F9F9F9',
    borderRadius: 5,
    padding: 10,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  phone: {
    fontSize: 16,
    color: '#555',
  },
  addFriendButton: {
    backgroundColor: '#34C759',
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 5,
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: [{ translateY: -5 }],
  },
  addFriendButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  noResult: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginTop: 20,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Background overlay
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  messageInput: {
    width: '100%',
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
  },
  buttonAddFriend: {
    backgroundColor: '#1e90ff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginBottom: 10,
    alignItems: 'center',
  },
  buttonCancel: {
    backgroundColor: '#1e90ff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginBottom: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
