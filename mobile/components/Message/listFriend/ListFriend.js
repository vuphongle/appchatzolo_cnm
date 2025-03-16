import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert } from 'react-native';
import { SwipeListView } from 'react-native-swipe-list-view';
import Icon from 'react-native-vector-icons/AntDesign';
import FeatherIcon from 'react-native-vector-icons/Feather';
import { useFocusEffect } from '@react-navigation/native'; 
import ItemFriend from './ItemFriend';
import CloudItem from './CloudItem';
import axios from 'axios';
import { IPV4 } from '@env';

function ListFriend({userId}) {
  const [openRow, setOpenRow] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [friends, setFriends] = useState([]);

  const fetchFriends = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${IPV4}/user/${userId}/friends`);
      setFriends(response.data);
      setError(null);
    } catch (err) {
      setError('Không có bạn trong danh sách');
      Alert.alert('Error',"Không thể tải danh sách bạn bè.");
    } finally {
      setLoading(false);
    }
  };

 
  useFocusEffect(
    React.useCallback(() => {
      fetchFriends();
      return () => {}       
      
    }, [userId])
  );

  // Hàm xử lý ghim
  const pinFriend = (id) => {
    Alert.alert(
      "Xác nhận",
      "Bạn có muốn ghim người bạn này lên đầu danh sách?",
      [
        {
          text: "Hủy",
          style: "cancel",
        },
        {
          text: "Có",
          onPress: () => {
            setFriends((prevFriends) => {
              const friendIndex = prevFriends.findIndex((friend) => friend.id === id);
              if (friendIndex === -1) return prevFriends; // Kiểm tra nếu không tìm thấy
  
              const updatedFriends = [...prevFriends];
              const [pinnedFriend] = updatedFriends.splice(friendIndex, 1);
              return [pinnedFriend, ...updatedFriends];
            });
          },
        },
      ]
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
              prevFriends.filter((friend) => friend.id !== id)
            );
          },
        },
      ],
      { cancelable: true }
    );
  };

  const renderItem = ({ item }) => <ItemFriend receiverID={item.id} name={item.name} avatar={item.avatar} />;

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
            onPress={() => pinFriend(item.id)}>
            <Icon name="pushpin" size={24} color="white" />
            <Text style={styles.actionText}>Ghim</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => deleteFriend(item.id)}>
            <Icon name="delete" size={24} color="white" />
            <Text style={styles.actionText}>Xóa</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  
  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

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
        data={friends}
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
        <Text style={styles.emptyText}>Không có bạn bè trong danh sách</Text>
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