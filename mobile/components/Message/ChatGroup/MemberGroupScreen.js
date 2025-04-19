import React, { useState } from 'react';
import { TouchableOpacity, View, Text, StyleSheet, FlatList, Image } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import HeaderMemberGroupScreen from './HeaderMemberGroupScreen';
import { UserContext } from '../../../context/UserContext';
import MemberInfoModal from './MemberInfoModal';
import GroupService from '../../../services/GroupService';

const MemberGroupScreen = ({ route, navigation }) => {
  const {infoGroup } = route.params;
  const [infoMemberGroup, setInfoMemberGroup] = useState(route.params.infoMemberGroup);
  const { user } = React.useContext(UserContext);

  const filteredMembers = infoMemberGroup.filter(member => member.userId == user?.id);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  const sortedMembers = [...infoMemberGroup];
  sortedMembers.sort((a, b) => (a.userId === user?.id ? -1 : 1));
  const refreshMemberGroupData = async () => {
    try {
          const response = await GroupService.getGroupMembers(infoGroup.id);

          if (response.data && Array.isArray(response.data) && response.data[0].userGroups) {
            const userGroups = response.data[0].userGroups;
            setInfoMemberGroup(userGroups);
          } else {
            console.error('Dữ liệu không hợp lệ:', response.data);
            setInfoMemberGroup([]);
          }

        } catch (error) {
          console.error('Lỗi khi lấy thông tin thành viên nhóm:', error);
          setInfoMemberGroup([]);
        }
  };

  const renderItem = ({ item }) => {
    const displayName = item.userId === user?.id ? 'Bạn' : item.userName;

    let roleText = '';
    // Kiểm tra vai trò và hiển thị tên tương ứng
    if (item.role === 'LEADER') {
      roleText = 'Trưởng nhóm';
    } else if (item.role === 'CO_LEADER') {
      roleText = 'Phó nhóm';
    } else if (item.role === 'MEMBER') {
      roleText = 'Thành viên';
    }

    const openMemberModal = () => {
      setSelectedMember(item);
      setModalVisible(true);
    };

    return (
      <TouchableOpacity style={styles.memberItem} onPress={openMemberModal}>
        <View style={styles.memberLeftContainer}>
          <Image source={{ uri: item.avatar }} style={styles.avatar} />
        </View>
        <View style={styles.memberRightContainer}>
          <Text style={styles.memberName}>{displayName}</Text>
          {roleText ? (
            <Text style={styles.roleText}>{roleText}</Text>
          ) : (
            <Ionicons name="person-add" size={24} color="#4CAF50" />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <HeaderMemberGroupScreen infoMemberGroup={infoMemberGroup} />
      <FlatList
        data={sortedMembers}
        renderItem={renderItem}
        keyExtractor={(item) => (item.userId ? item.userId.toString() : Math.random().toString())}
      />

      <MemberInfoModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        member={selectedMember}
        filteredMembers={filteredMembers[0]}
        infoGroup={infoGroup}
        refreshMemberGroupData={refreshMemberGroupData}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  memberItem: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  memberLeftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  memberRightContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
  },
  roleText: {
    fontSize: 14,
    color: '#777',
  },
});

export default MemberGroupScreen;
