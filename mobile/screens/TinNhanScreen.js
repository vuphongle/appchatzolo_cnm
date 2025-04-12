import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import SearchBar from '../components/SearchBar';
import { UserContext } from '../context/UserContext';
import ListFriend from '../components/Message/listFriend/ListFriend';
import { v4 as uuidv4 } from 'uuid';
import { REGION, ACCESS_KEY_ID, SECRET_ACCESS_KEY, IPV4 } from '@env';

// Hàm định dạng số điện thoại
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

const TinNhanScreen = () => {
  const [searchText, setSearchText] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const { fetchUserProfile, user } = useContext(UserContext);
  const [friendRequestStatus, setFriendRequestStatus] = useState('Kết bạn');

  useEffect(() => {
    if (searchResult) {
      checkFriendRequestStatus();
    }
  }, [searchResult]);

  // Tạo ref cho ô tìm kiếm
  const searchInputRef = useRef(null);

  // Tự động tìm kiếm khi người dùng nhập
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

  const handleClearSearch = () => {
    setIsSearching(false);
    setSearchText('');
    setSearchResult(null);
  };

  // Hàm gửi lời mời kết bạn hoặc hoàn tác lời mời
  const sendFriendRequest = async () => {
    if (friendRequestStatus === 'Hoàn tác') {
      handleDeleteFriendRequest();
    } else if (friendRequestStatus === 'Kết bạn') {
      handleAddFriend();
    }
  };

  // Hàm gửi lời mời kết bạn
  const handleAddFriend = async () => {
    if (!searchResult) return;

    const newFriendRequest = {
      id: uuidv4(),
      content: 'Lời mời kết bạn',
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
      if (user?.friendIds.includes(searchResult.id)) {
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

  // Hàm xử lý khi ô tìm kiếm được focus
  const handleSearchBarFocus = () => {
    console.log('Search bar focused before:', isSearching);
    setIsSearching(true);
    console.log('Search bar focused after:', isSearching);

    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 0);
  };

  return (
    <View style={styles.container}>
      {!isSearching ? (
        <>
          <SearchBar
            placeholder="Tìm kiếm số điện thoại"
            leftIcon="search"
            rightIcon="qr-code-scanner"
            onRightIconPress={() => console.log('Scan QR button pressed')}
            searchText={searchText}
            setSearchText={(text) => {
              setSearchText(text);
              setIsSearching(!!text);
            }}
            onFocus={handleSearchBarFocus}
            inputRef={searchInputRef}
          />
          <ListFriend userId={user?.id} />
        </>
      ) : (
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
              onPress={handleSearch}
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
                  <TouchableOpacity
                    onPress={sendFriendRequest}
                    style={styles.addFriendButton}
                  >
                    <Text style={styles.addFriendButtonText}>
                      {friendRequestStatus}
                    </Text>
                  </TouchableOpacity>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F8FF',
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
});

export default TinNhanScreen;