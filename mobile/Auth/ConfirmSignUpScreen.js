import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Auth } from 'aws-amplify';
import axios from 'axios';
import { IPV4 } from '@env';
import { useRoute, useNavigation } from '@react-navigation/native';

const ConfirmSignUpScreen = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const { phoneNumber, name, dob } = route.params;

    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleConfirm = async () => {
        if (!code) {
            Alert.alert('Lỗi', 'Vui lòng nhập mã xác thực.');
            return;
        }

        setIsLoading(true);
        console.log('Tên là:', name, 'kiểu dữ liệu:', typeof name);
        console.log('Ngày sinh:', dob, 'kiểu dữ liệu:', typeof dob);
        console.log('Bắt đầu xác thực với số điện thoại:', phoneNumber, 'kiểu dữ liệu:', typeof phoneNumber, 'mã:', code);
        try {
            await Auth.confirmSignUp(phoneNumber, code);
            Alert.alert('Thành công', 'Xác thực số điện thoại thành công. Đang lưu thông tin người dùng...');

            const userData = {
                name: name,
                phoneNumber: phoneNumber,
                dob: dob,
            };

            const backendUrl = `${IPV4}/user/create`;

            try {
                const response = await axios.post(backendUrl, userData, {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
                console.log('User data sent to backend successfully:', response.data);
                Alert.alert('Thành công', 'Đăng ký và lưu thông tin người dùng thành công.');

                // Điều hướng đến màn hình chính hoặc màn hình mong muốn sau khi xác nhận thành công
                navigation.navigate('AuthScreen'); // Thay 'AuthScreen' bằng tên màn hình bạn muốn điều hướng tới
            } catch (backendError) {
                console.error('Error sending user data to backend:', backendError);
                Alert.alert('Lỗi', 'Xác thực thành công nhưng không thể lưu thông tin người dùng. Vui lòng liên hệ hỗ trợ.');
            }
        } catch (error) {
            console.log('Error confirming sign up', JSON.stringify(error, null, 2));
            Alert.alert('Lỗi', error.message || 'Có lỗi xảy ra khi xác thực mã.');
        }
        setIsLoading(false);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Xác nhận Đăng ký</Text>
            <Text style={styles.instructions}>Mã xác thực đã được gửi đến số điện thoại của bạn.</Text>
            <TextInput
                style={styles.input}
                placeholder="Mã xác thực"
                keyboardType="number-pad"
                value={code}
                onChangeText={setCode}
            />
            {isLoading ? (
                <ActivityIndicator size="large" color="#0000ff" />
            ) : (
                <Button title="Xác nhận" onPress={handleConfirm} />
            )}
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
        fontSize: 24,
        marginBottom: 20,
        textAlign: 'center',
        fontWeight: 'bold',
    },
    instructions: {
        fontSize: 16,
        marginBottom: 20,
        textAlign: 'center',
        color: '#555',
    },
    input: {
        height: 50,
        borderColor: '#ccc',
        borderWidth: 1,
        marginBottom: 20,
        paddingHorizontal: 10,
        borderRadius: 5,
        backgroundColor: '#fff',
    },
});

export default ConfirmSignUpScreen;
