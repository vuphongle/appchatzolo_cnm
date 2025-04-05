import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { isPasswordValid } from '../utils/passwordUtils';
import { formatPhoneNumber } from '../utils/formatPhoneNumber';
import {IPV4} from '@env';

const ForgotPasswordScreen = ({ navigation }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendOtp = async () => {
    const formattedPhone = formatPhoneNumber(phoneNumber);
    if (!formattedPhone) {
      Alert.alert('Lỗi', 'Số điện thoại không đúng. Vui lòng kiểm tra lại.');
      return;
    }
    setPhoneNumber(formattedPhone);

    setIsLoading(true);
    try {
      const response = await fetch(`${IPV4}/auth/forgot-password/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: formattedPhone,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStep(2); // Chuyển sang bước xác thực OTP
        Alert.alert('Thông báo', 'OTP đã được gửi đến số điện thoại của bạn.');
      } else {
        Alert.alert('Lỗi', data.message || 'Không thể gửi OTP. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Lỗi gửi OTP:', error);
      Alert.alert('Lỗi', 'Không thể gửi OTP. Vui lòng thử lại.');
    }
    setIsLoading(false);
  };

  const handleVerifyOtp = async () => {
    if (!otp) {
      Alert.alert('Lỗi', 'Vui lòng nhập mã OTP.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${IPV4}/auth/forgot-password/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: phoneNumber,
          otp: otp,
        }),
      });

      // Đọc phản hồi dưới dạng văn bản thuần (text) hoặc JSON tùy theo trường hợp
      const data = await response.text();

      // Kiểm tra nếu phản hồi thành công
      if (response.ok) {
        // Phản hồi thành công chứa thông điệp JSON
        const message = JSON.parse(data).message;
        setStep(3); // Chuyển sang bước nhập mật khẩu mới
        Alert.alert('Thông báo', 'OTP xác thực thành công. Vui lòng nhập mật khẩu mới.');
      } else {
        console.log('Error response:', data);
        Alert.alert('Lỗi', data === 'Invalid OTP' ? 'Mã OTP không đúng hoặc đã hết hạn. Vui lòng thử lại.' : 'Có lỗi trong quá trình xác thực OTP.');
      }
    } catch (error) {
      console.error('Lỗi xác thực OTP:', error);
      Alert.alert('Lỗi', 'Mã OTP không đúng hoặc có lỗi trong quá trình thay đổi mật khẩu.');
    }
    setIsLoading(false);
  };

  const handleChangePassword = async () => {
    const formattedPhone = formatPhoneNumber(phoneNumber);

    // Kiểm tra sự khớp giữa mật khẩu mới và xác nhận mật khẩu
    if (newPassword !== confirmNewPassword) {
      Alert.alert('Lỗi', 'Mật khẩu mới và xác nhận mật khẩu không khớp.');
      return;
    }

    // Kiểm tra tính hợp lệ của mật khẩu mới
    if (!isPasswordValid(newPassword)) {
      Alert.alert(
        'Lỗi',
        'Mật khẩu phải có ít nhất 8 ký tự, một chữ cái thường, một chữ cái in hoa, một số và một ký tự đặc biệt.',
      );
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${IPV4}/auth/forgot-password/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: formattedPhone,
          newPassword: newPassword,
        }),
      });

      // Đọc phản hồi dưới dạng văn bản (text) hoặc JSON tùy theo trường hợp
      const data = await response.text();  // Đọc dưới dạng văn bản

      // Kiểm tra nếu phản hồi thành công (status 200)
      if (response.ok) {
        const message = JSON.parse(data).message;
        Alert.alert('Thông báo', 'Mật khẩu đã được thay đổi thành công.');
        navigation.navigate('Login');
      } else {
        console.log('Error response:', data);
        Alert.alert('Lỗi', 'Có lỗi trong quá trình thay đổi mật khẩu.');
      }
    } catch (error) {
      console.error('Lỗi thay đổi mật khẩu:', error);
      Alert.alert('Lỗi', 'Có lỗi trong quá trình thay đổi mật khẩu.');
    }
    setIsLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quên mật khẩu</Text>

      {step === 1 ? (
        <>
          <TextInput
            style={styles.input}
            placeholder="Số điện thoại"
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
          />
          <Button title="Gửi OTP" onPress={handleSendOtp} />
        </>
      ) : step === 2 ? (
        <>
          <TextInput
            style={styles.input}
            placeholder="Mã OTP"
            keyboardType="numeric"
            value={otp}
            onChangeText={setOtp}
          />
          <Button title="Xác nhận OTP" onPress={handleVerifyOtp} />
        </>
      ) : (
        <>
          <TextInput
            style={styles.input}
            placeholder="Mật khẩu mới"
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
          />
          <TextInput
            style={styles.input}
            placeholder="Xác nhận mật khẩu mới"
            secureTextEntry
            value={confirmNewPassword}
            onChangeText={setConfirmNewPassword}
          />
          <Button title="Đổi mật khẩu" onPress={handleChangePassword} />
        </>
      )}

      {isLoading && <ActivityIndicator size="large" color="#0000ff" />}

      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.toggleButton}
      >
        <Text style={styles.toggleText}>Quay lại đăng nhập</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 28,
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: 'bold',
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
  toggleButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  toggleText: {
    color: '#1E90FF',
    fontSize: 16,
  },
});

export default ForgotPasswordScreen;
