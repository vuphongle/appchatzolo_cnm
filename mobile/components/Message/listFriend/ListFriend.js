import React, { useState, useEffect, useContext } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SwipeListView } from 'react-native-swipe-list-view';
import Icon from 'react-native-vector-icons/AntDesign';
import FeatherIcon from 'react-native-vector-icons/Feather';
import { useFocusEffect } from '@react-navigation/native';
import ItemFriend from './ItemFriend';
import CloudItem from './CloudItem';
import axios from 'axios';
import { IPV4 } from '@env';
import UserService from '../../../services/UserService';
import MessageService from '../../../services/MessageService';
import {UserContext} from '../../../context/UserContext';
import GroupService from '../../../services/GroupService';
function ListFriend({ userId }) {
  const [openRow, setOpenRow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [friends, setFriends] = useState([]);
  const { isChange } = useContext(UserContext);
  const [groups, setGroups] = useState([]);
  const [items, setItems] = useState([]);


  const fetchFriendsAndGroups = async () => {
    try {
      setLoading(true);
      
      // Fetch friends and groups data
      const response = await UserService.getFriends(userId);
      const groupsResponse = await GroupService.getGroupsByIds(userId);
      
      // Process friends data - remove duplicates
      let friendsList = response;
      const uniqueFriendsMap = new Map();
      friendsList.forEach((friend) => {
        if (!uniqueFriendsMap.has(friend.id)) {
          uniqueFriendsMap.set(friend.id, friend);
        }
      });
      friendsList = Array.from(uniqueFriendsMap.values());
      setFriends(friendsList);
      
      // Process groups data
      const hasGroups = groupsResponse?.data && groupsResponse.data.length > 0;
      const groupsList = hasGroups ? groupsResponse.data : [];
      setGroups(groupsList);
      
      if (hasGroups) {
        console.log("groups : ", groupsResponse);
      } else {
        console.log("No groups found");
      }
      
      // Combine friends and groups with type identifier
      const friendsWithType = friendsList.map(friend => ({ ...friend, type: 'friend' }));
      const groupsWithType = groupsList.map(group => ({ ...group, type: 'group' }));
      const mergedItems = [...friendsWithType, ...groupsWithType];
      
      // Get latest messages for all items (both friends and groups)
      const itemsWithMessages = await Promise.all(
        mergedItems.map(async (item) => {
          try {
            const messageResponse = await MessageService.getLatestMessage(
              userId,
              item.id
            );
            
            return {
              ...item,
              lastMessage: messageResponse
                ? messageResponse.content
                : 'Chưa có tin nhắn',
              sendDate: messageResponse
                ? new Date(messageResponse.sendDate)
                : null,
              deletedBySender: messageResponse?.deletedBySender,
              deletedByReceiver: messageResponse?.deletedByReceiver,
            };
          } catch (error) {
            console.error(`Lỗi khi lấy tin nhắn mới nhất cho ${item.type} ${item.id}:`, error);
            return {
              ...item,
              lastMessage: 'Chưa có tin nhắn',
              sendDate: null,
            };
          }
        })
      );
      
      // Sort by latest message time
      itemsWithMessages.sort((a, b) => {
        return (b.sendDate?.getTime() || 0) - (a.sendDate?.getTime() || 0);
      });
      
      // Update state with the sorted items
      setItems(itemsWithMessages);
      setError(null);
    } catch (err) {
      setError('Không có bạn trong danh sách');
      console.error('Lỗi khi lấy danh sách bạn bè:', err);
    } finally {
      setLoading(false);
    }
  };
  useFocusEffect(
    React.useCallback(() => {
      fetchFriendsAndGroups();
      return () => {};
    }, []),
  );

   useEffect(() => {
    fetchFriendsAndGroups();
   }, [isChange]);

  // Hàm xử lý ghim
  const pinFriend = (id) => {
    Alert.alert(
      'Xác nhận',
      'Bạn có muốn ghim người bạn này lên đầu danh sách?',
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Có',
          onPress: () => {
            setFriends((prevFriends) => {
              const friendIndex = prevFriends.findIndex(
                (friend) => friend.id === id,
              );
              if (friendIndex === -1) return prevFriends; // Kiểm tra nếu không tìm thấy

              const updatedFriends = [...prevFriends];
              const [pinnedFriend] = updatedFriends.splice(friendIndex, 1);
              return [pinnedFriend, ...updatedFriends];
            });
          },
        },
      ],
    );
  };

  // Hàm xử lý xóa
  const deleteFriend = (id) => {
    Alert.alert(
      'Xác nhận',
      'Bạn có chắc chắn muốn xóa người này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => {
            setFriends((prevFriends) =>
              prevFriends.filter((friend) => friend.id !== id),
            );
          },
        },
      ],
      { cancelable: true },
    );
  };

  const renderItem = ({ item }) => {
    if (item.type === 'group') {
      return (
        <ItemFriend
          receiverID={item.id}
          name={item.groupName}
          avatar={item.image}
          type={item.type}
          lastMessage={item.lastMessage}
          sendDate={item.sendDate}
          
          isDeleted={item.deletedBySender || item.deletedByReceiver}

        />
      );
    } else {
      return (
        <ItemFriend
          receiverID={item.id}
          name={item.name}
          avatar={item.avatar}
          type={item.type}
          lastMessage={item.lastMessage}
          sendDate={item.sendDate}
          isDeleted={item.deletedBySender || item.deletedByReceiver}
        />
      );
    }
  };

  const renderHiddenItem = ({ item }) => {
    if (openRow !== item.id) return <View style={{ height: 0 }} />;
    return (
      <View style={styles.rowBack}>
        <View style={styles.actionLeft}></View>
        <View style={styles.actionRight}>
          <View style={styles.actionButton}>
            <FeatherIcon name="more-horizontal" size={24} color="white" />
            <Text style={styles.actionText}>Thêm</Text>
          </View>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => pinFriend(item.id)}
          >
            <Icon name="pushpin" size={24} color="white" />
            <Text style={styles.actionText}>Ghim</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => deleteFriend(item.id)}
          >
            <Icon name="delete" size={24} color="white" />
            <Text style={styles.actionText}>Xóa</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

//  if (loading) {
//    return (
//      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
//        <ActivityIndicator size="large" color="#0000ff" />
//      </View>
//    );
//  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CloudItem timestamp="23 tiếng" />
      {friends.length > 0 ? (
        <SwipeListView
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          renderHiddenItem={renderHiddenItem}
          rightOpenValue={-230}
          showsVerticalScrollIndicator={false}
          closeOnRowPress={true}
          disableRightSwipe={true}
          previewOpenDelay={3000}
          onRowOpen={(rowKey) => setOpenRow(rowKey)}
          onRowClose={() => setOpenRow(null)}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}></Text>
        </View>
      )}
    </View>
  );
}

export default ListFriend;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    padding: 10,
  },
  rowBack: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    backgroundColor: '#f8f8f8',
    height: '100%',
  },
  actionLeft: {
    flex: 1,
  },
  actionRight: {
    height: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#ff6b6b',
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 70,
    backgroundColor: '#ff6b6b',
    marginHorizontal: 5,
  },
  actionText: {
    fontSize: 12,
    color: 'white',
  },
});
