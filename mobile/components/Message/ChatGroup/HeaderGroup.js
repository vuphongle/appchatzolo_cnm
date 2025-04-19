import React, { useState, useEffect,useContext } from 'react';
import { Text, View, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import UserService from '../../../services/UserService';
import GroupService from '../../../services/GroupService';
import Detail_infoChatGroup from './Detail_infoChatGroup';
import { UserContext } from '../../../context/UserContext'; // Import UserContext

function HeaderGroup({ name, id, avatar }) {
  const navigation = useNavigation();
  const [onlineStatus, setOnlineStatus] = useState(false);
  const { user, setUser } = useContext(UserContext); // Lấy user hiện tại từ UserContext
  const [countMember, setCountMember] = useState(0); // Lưu số lượng thành viên
useEffect(() => {
  getGroupMembers(); // Gọi hàm để lấy danh sách thành viên nhóm khi component được mount
}, [id]); // Chỉ chạy một lần khi component được mount
  const handlePressBack = () => {
    navigation.navigate('MainTabs'); //
  };
  const getGroupMembers = async () => {
    try {
      const response = await GroupService.getGroupMembers(id);
      console.log('Dữ liệu trả về từ API:', response.data);
  
      if (response.data && Array.isArray(response.data.userGroups)) {
        const memberCount = response.data.userGroups.length;
        setCountMember(memberCount);
      } else {
       
        setCountMember(0); // Đặt giá trị mặc định
      }
    } catch (error) {
     
    }
  };
  

  const handlePressMenu = () => {
    console.log('User:', user); // Kiểm tra dữ liệu người dùng
    const userFriend = user?.id;
    if (user) {
      navigation.navigate('Detail_infoChatGroup', { userFriend,groupId:id });
    }
  };



  // useEffect(() => {
  //   getOnlineStatus();
  // }, [id]);

  return (
    <View style={styles.container}>
      <View style={styles.container_left}>
        <TouchableOpacity onPress={handlePressBack} style={styles.button}>
          <Ionicons name="chevron-back-outline" size={32} color="white" />
        </TouchableOpacity>

        <View style={styles.container_friend_Name}>
          <View style={{  alignItems: 'center' }}>
            <Text style={styles.friend_Name}>
              {name}
             
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' ,gap:5}}>
              <Ionicons name="people-outline" size={18} color="white" />
              <Text style={{ color: 'white', fontSize: 12 }}>
                {countMember} thành viên
              </Text>

            </View>
          </View>
         
        </View>
      </View>

      <View style={styles.container_right}>
        <TouchableOpacity style={styles.container_right_icon}>
          <Feather name="phone" size={23} color="white" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.container_right_icon}>
          <Feather name="video" size={26} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.container_right_icon}
          onPress={handlePressMenu} // Truyền dữ liệu người dùng ở đây
        >
          <Feather name="menu" size={26} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default HeaderGroup;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#0091ff',
    height: 60,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
  container_left: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '70%',
  },
  container_friend_Name: {
    paddingLeft: 10,
  },
  friend_Name: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  container_right: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '30%',
    justifyContent: 'space-around',
  },
  container_right_icon: {
    padding: 8,
  },
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 5,
  },
});