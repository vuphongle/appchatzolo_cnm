import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { IPV4 } from '@env';
import { UserContext } from '../context/UserContext';
import SearchBar from '../components/SearchBar';
import useFriendRequestCount from '../hooks/useFriendRequestCount';

const FriendInvitesScreen = () => {
  const [searchText, setSearchText] = useState('');
  const [activeSubTab, setActiveSubTab] = useState('received');
  const [friendRequests, setFriendRequests] = useState([]); // Lời mời đã nhận
  const [sentRequests, setSentRequests] = useState([]); // Lời mời đã gửi
  const [sendersInfo, setSendersInfo] = useState({});
  const [receiversInfo, setReceiversInfo] = useState({});
  const { user, setNotification, accept, setAccept, reject, setReject, updateUserProfile} = useContext(UserContext);
  const friendRequestsCount = useFriendRequestCount(user);


  // Lấy lời mời đã nhận
  useEffect(() => {
    if (activeSubTab === 'received') {
      const fetchReceived = async () => {
        try {
          const response = await fetch(
            `${IPV4}/messages/invitations/received/${user?.id}`,
          );
          const data = await response.json();
          setFriendRequests(data);

          // Lấy info của người gửi
          for (let request of data) {
            const senderRes = await fetch(
              `${IPV4}/user/findById/${request.senderID}`,
            );
            const senderData = await senderRes.json();
            setSendersInfo((prev) => ({ ...prev, [request.id]: senderData }));
          }
        } catch (error) {
          console.error('Error fetching received invites:', error);
        }
      };
      setNotification(0);
      fetchReceived();
    }
  }, [activeSubTab, user?.id]);

  // Lấy lời mời đã gửi
  useEffect(() => {
    if (activeSubTab === 'sent') {
      const fetchSent = async () => {
        try {
          const response = await fetch(
            `${IPV4}/messages/invitations/sent/${user?.id}`,
          );
          const data = await response.json();
          setSentRequests(data);

          for (let request of data) {
            const receiverRes = await fetch(
              `${IPV4}/user/findById/${request.receiverID}`,
            );
            const receiverData = await receiverRes.json();
            setReceiversInfo((prev) => ({
              ...prev,
              [request.id]: receiverData,
            }));
          }
        } catch (error) {
          console.error('Error fetching sent invites:', error);
        }
      };
      fetchSent();
    }
  }, [activeSubTab, user?.id, friendRequestsCount]);

  const handleRequestResponse = async (
    requestId,
    senderId,
    receiverId,
    action,
  ) => {
    try {
      let url = '';
      let method = 'POST';

      if (action === 'accept') {
        url = `${IPV4}/messages/acceptFriendRequest/${senderId}/${receiverId}`;
      } else if (action === 'reject') {
        url = `${IPV4}/messages/invitations/${senderId}/${receiverId}`;
        method = 'DELETE';
      } else if (action === 'delete') {
        // Xóa lời mời đã gửi
        url = `${IPV4}/messages/invitations/${user?.id}/${receiverId}`;
        method = 'DELETE';
      }

      const res = await fetch(url, { method });
      if (res.ok) {
        if (action === 'accept') {
          setFriendRequests(
            friendRequests.filter((req) => req.id !== requestId),
          );
          if(accept) {
            setAccept(true);
          } else {
            setAccept(false);
          }
          updateUserProfile();
        } else if (action === 'reject') {
          setFriendRequests(
            friendRequests.filter((req) => req.id !== requestId),
          );
          if(reject) {
            setReject(true);
          }else {
            setReject(false);
          }
        } else if (action === 'delete') {
          setSentRequests(sentRequests.filter((req) => req.id !== requestId));
        }
      } else {
        console.error('Action failed:', action);
      }
    } catch (error) {
      console.error('Error in handleRequestResponse:', error);
    }
  };

  const renderReceivedInvites = () => {
    return (
      <View style={styles.section}>
        {friendRequests.length > 0 ? (
          friendRequests.map((request) => (
            <View key={request.id} style={styles.requestItem}>
              {/* Info người gửi */}
              {sendersInfo[request.id] && (
                <View style={styles.senderInfo}>
                  <Image
                    source={{ uri: sendersInfo[request.id].avatar }}
                    style={styles.avatar}
                  />
                  <Text style={styles.senderName}>
                    {sendersInfo[request.id].name}
                  </Text>
                </View>
              )}
              <Text style={styles.requestText}>{request.content}</Text>

              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.acceptButton}
                  onPress={() =>
                    handleRequestResponse(
                      request.id,
                      request.senderID,
                      request.receiverID,
                      'accept',
                    )
                  }
                >
                  <Text style={styles.actionButtonText}>Đồng ý</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.rejectButton}
                  onPress={() =>
                    handleRequestResponse(
                      request.id,
                      request.senderID,
                      request.receiverID,
                      'reject',
                    )
                  }
                >
                  <Text style={styles.actionButtonText}>Từ chối</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.noRequestsText}>Chưa có lời mời kết bạn</Text>
        )}
      </View>
    );
  };

  // Render "Đã gửi"
  const renderSentInvites = () => {
    return (
      <View style={styles.section}>
        {sentRequests.length > 0 ? (
          sentRequests.map((request) => (
            <View key={request.id} style={styles.requestItem}>
              {/* Info người nhận */}
              {receiversInfo[request.id] && (
                <View style={styles.senderInfo}>
                  <Image
                    source={{ uri: receiversInfo[request.id].avatar }}
                    style={styles.avatar}
                  />
                  <Text style={styles.senderName}>
                    {receiversInfo[request.id].name}
                  </Text>
                </View>
              )}
              <Text style={styles.requestText}>{request.content}</Text>
              <Text style={styles.requestStatus}>
                Trạng thái: {request.status}
              </Text>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() =>
                  handleRequestResponse(
                    request.id,
                    request.senderID,
                    request.receiverID,
                    'delete',
                  )
                }
              >
                <Text style={styles.actionButtonText}>Xóa lời mời</Text>
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <Text style={styles.noRequestsText}>Chưa gửi lời mời nào</Text>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Thanh tab con */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[
            styles.tabItem,
            activeSubTab === 'received' && styles.activeTab,
          ]}
          onPress={() => setActiveSubTab('received')}
        >
          <Text style={styles.tabText}>Đã nhận</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeSubTab === 'sent' && styles.activeTab]}
          onPress={() => setActiveSubTab('sent')}
        >
          <Text style={styles.tabText}>Đã gửi</Text>
        </TouchableOpacity>
      </View>

      {/* Danh sách lời mời */}
      <ScrollView style={styles.listContainer}>
        {activeSubTab === 'received'
          ? renderReceivedInvites()
          : renderSentInvites()}
      </ScrollView>
    </View>
  );
};

export default FriendInvitesScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginHorizontal: 15,
    marginVertical: 10,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#ccc',
    marginHorizontal: 15,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderColor: '#1e90ff',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  requestItem: {
    backgroundColor: '#F9F9F9',
    padding: 10,
    borderRadius: 6,
    marginBottom: 10,
  },
  senderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: 10,
  },
  senderName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  requestText: {
    fontSize: 15,
    marginBottom: 6,
  },
  requestStatus: {
    fontSize: 13,
    color: '#888',
    marginBottom: 6,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#34C759',
    paddingVertical: 6,
    borderRadius: 5,
    marginRight: 5,
    alignItems: 'center',
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#FF3B30',
    paddingVertical: 6,
    borderRadius: 5,
    marginLeft: 5,
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 6,
    borderRadius: 5,
    marginTop: 6,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  noRequestsText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
  },
  // Suggested friends
  suggestedContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  suggestedItem: {
    width: '48%',
    backgroundColor: '#F9F9F9',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 10,
  },
  suggestedAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  suggestedName: {
    fontSize: 15,
    marginVertical: 5,
  },
  addFriendBtn: {
    backgroundColor: '#34C759',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  addFriendText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
