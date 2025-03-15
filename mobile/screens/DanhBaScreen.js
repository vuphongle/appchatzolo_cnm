import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import SearchBar from '../components/SearchBar';
import { IPV4 } from '@env';
import { UserContext } from '../context/UserContext';
import Ionicons from 'react-native-vector-icons/Ionicons';

const DanhBaScreen = () => {
  const navigation = useNavigation();
  const { user, friendRequestsCount } = useContext(UserContext);

  const [activeTab, setActiveTab] = useState('friends');

  const [receivedCount, setReceivedCount] = useState(0);

  const [friends, setFriends] = useState([]);

  useEffect(() => {
    const fetchFriends = async () => {
      if (!user?.id) return;
      try {
        const response = await fetch(`${IPV4}/user/${user.id}/friends`);
        const data = await response.json();
        if (typeof data === 'string' && data === "No friends found") {
          setFriends([]);
        } else {
          setFriends(data);
        }
      } catch (error) {
        console.error('Error fetching friends:', error);
      }
    };
    fetchFriends();
  }, [user?.id]);

  useEffect(() => {
    const fetchReceivedCount = async () => {
      try {
        const response = await fetch(`${IPV4}/messages/invitations/received/${user?.id}`);
        const data = await response.json();
        setReceivedCount(data.length);
      } catch (error) {
        console.error('Error fetching friend requests count:', error);
      }
    };
    fetchReceivedCount();
  }, [user?.id, friendRequestsCount]);

  // Dummy data nhóm
  const dummyGroups = [
    { id: 1, name: 'Nhóm UI/UX', membersCount: 5 },
    { id: 2, name: 'Nhóm React Native', membersCount: 10 },
  ];

  const renderFriendsTab = () => {
    return (
      <ScrollView style={styles.content}>
        <View style={styles.shortcutContainer}>
          <TouchableOpacity
            style={styles.shortcutItem}
            onPress={() => navigation.navigate('FriendInvitesScreen')}
          >
            <View style={styles.shortcutItemRow}>
              <Ionicons name="person-add-outline" size={20} color="#000" style={{ marginRight: 8 }} />
              <Text style={styles.shortcutText}>
                Lời mời kết bạn
                {receivedCount > 0 ? ` (${receivedCount})` : ''}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.friendsHeader}>
          <Text style={styles.friendsHeaderText}>Tất cả {friends.length}</Text>
        </View>

        {friends.map((contact) => (
          <View key={contact.id} style={styles.contactItem}>
            <Image
              source={{ uri: contact.avatar }}
              style={styles.contactAvatar}
            />
            <Text style={styles.contactName}>{contact.name}</Text>
            <TouchableOpacity
              style={styles.messageIcon}
              onPress={() => {
                navigation.navigate('ChatScreen', { userId: contact.id });
              }}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={22} color="#787878" />
            </TouchableOpacity>
          </View>
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
          style={[styles.tabButton, activeTab === 'friends' && styles.activeTab]}
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
  messageIcon: {
    padding: 5,
    marginLeft: 'auto',
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
});
