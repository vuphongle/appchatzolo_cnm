import React, { useState, useEffect } from 'react';
import { Text, View, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import UserService from '../../../services/UserService';

function Header({ name, id, avatar }) {
  const navigation = useNavigation();
  const [onlineStatus, setOnlineStatus] = useState(false);
  const [user, setUser] = useState(null); // Lưu dữ liệu người dùng

  const handlePressBack = () => {
    navigation.goBack();
  };

  const handlePressMenu = () => {
    console.log('User:', user); // Kiểm tra dữ liệu người dùng
    if (user) {
      navigation.navigate('DetailChat', { user });
    }
  };

  const getOnlineStatus = async () => {
    try {
      const userId=id;
      const receiver = await UserService.getUserById(userId);
      // console.log("id receiver :",userId);
      // console.log("status Receiver :",receiver);
      setOnlineStatus(receiver.online);
      setUser(receiver);
    } catch (err) {
      console.log(err);
      setOnlineStatus(false);
      setUser(null);
    }
  };

  useEffect(() => {
    getOnlineStatus();
  }, [id]);

  return (
    <View style={styles.container}>
      <View style={styles.container_left}>
        <TouchableOpacity onPress={handlePressBack} style={styles.button}>
          <Ionicons name="chevron-back-outline" size={32} color="white" />
        </TouchableOpacity>

        <View style={styles.container_friend_Name}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.friend_Name}>
              {name}
              {onlineStatus ? (
                <Ionicons
                  name="ellipse"
                  size={10}
                  color="green"
                  style={{ marginLeft: 15 }}
                />
              ) : (
                <Ionicons
                  name="ellipse"
                  size={10}
                  color="grey"
                  style={{ marginLeft: 15 }}
                />
              )}
            </Text>
          </View>
          {onlineStatus ? (
            <Text style={{ color: 'white', fontSize: 12 }}>Đang hoạt động</Text>
          ) : (
            <Text style={{ color: 'white', fontSize: 12 }}> Không hoạt động</Text>
          )}
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

export default Header;

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