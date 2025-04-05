import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Auth } from 'aws-amplify';
import { IPV4 } from '@env';
import { UserContext } from '../context/UserContext';
import axios from 'axios';
import { isPasswordValid } from '../utils/passwordUtils';

const ChangePasswordScreen = ({ navigation }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { user, setUser } = useContext(UserContext);

  const changePassword = async (currentPassword, newPassword, username) => {
    // Validate password
    if (!isPasswordValid(newPassword)) {
      alert('Mật khẩu mới không hợp lệ. Vui lòng kiểm tra lại.');
      return;
    }
    try {
      const response = await axios.post(`${IPV4}/auth/change-password`, {
        username,
        currentPassword,
        newPassword,
      });

      // Handle success
      Alert.alert(
        'Thành công',
        response.data.message === 'Password updated successfully'
          ? 'Mật khẩu đã được cập nhật vui lòng đăng nhập lại'
          : response.data.message,
      );
      await Auth.signOut();
      setUser(null); // Clear user info in context
      navigation.replace('AuthScreen');
    } catch (error) {
      if (error.response) {
        // Backend error
        Alert.alert(
          'Lỗi',
          error.response.data === 'Current password is incorrect'
            ? 'Mật khẩu cũ không chính xác'
            : error.response.data,
        );
      } else {
        // Network error
        Alert.alert(
          'Lỗi',
          'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng của bạn.',
        );
      }
    }
  };

  const handleUpdatePassword = () => {
    if (newPassword !== confirmPassword) {
      alert('Mật khẩu mới và mật khẩu xác nhận không khớp');
      return;
    }

    changePassword(currentPassword, newPassword, user?.phoneNumber);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.infoText}>
        Mật khẩu của bạn phải có ít nhất 8 ký tự, bao gồm ký tự đặc biệt, chữ
        hoa, chữ thường và số.
      </Text>
      <TextInput
        style={styles.input}
        placeholder="Mật khẩu hiện tại"
        secureTextEntry
        value={currentPassword}
        onChangeText={setCurrentPassword}
      />
      <TextInput
        style={styles.input}
        placeholder="Mật khẩu mới"
        secureTextEntry
        value={newPassword}
        onChangeText={setNewPassword}
      />
      <TextInput
        style={styles.input}
        placeholder="Nhập lại mật khẩu mới"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />
      <Button title="Cập nhật" onPress={handleUpdatePassword} />
    </View>
  );
};

const styles = StyleSheet.create({
  infoText: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F0F8FF',
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 15,
    paddingHorizontal: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
});

export default ChangePasswordScreen;
