import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Auth } from 'aws-amplify';

const AuthScreen = ({ onSignUp }) => {
    const [isRegister, setIsRegister] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const toggleMode = () => {
        setIsRegister(!isRegister);
    };

    const handleAuth = async () => {
        if (!phoneNumber || !password) {
            Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ số điện thoại và mật khẩu.');
            return;
        }

        setIsLoading(true);
        if (isRegister) {
            try {
                const result = await Auth.signUp({
                    username: phoneNumber,
                    password: password,
                    attributes: {
                        phone_number: phoneNumber,
                    },
                    autoSignIn: { enabled: true },
                });
                console.log('Sign up success', result);
                Alert.alert('Thành công', 'Mã xác thực đã được gửi đến số điện thoại của bạn.');
                if (onSignUp) {
                    onSignUp(phoneNumber);
                }
            } catch (error) {
                console.log('Error signing up:', error);
                Alert.alert('Lỗi', error.message || 'Có lỗi xảy ra khi đăng ký.');
            }
        } else {
            try {
                const user = await Auth.signIn(phoneNumber, password);
                console.log('User signed in successfully:', user);
            } catch (error) {
                console.error('Error signing in:', error);
                if (error instanceof TypeError) {
                    console.log('Có thể thiếu cấu hình hoặc thư viện.');
                }
                Alert.alert('Lỗi', error.message || 'Có lỗi xảy ra khi đăng nhập.');
            }

        }
        setIsLoading(false);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{isRegister ? 'Đăng ký' : 'Đăng nhập'}</Text>
            <TextInput
                style={styles.input}
                placeholder="Số điện thoại"
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                autoCompleteType="tel"
                textContentType="telephoneNumber"
            />
            <TextInput
                style={styles.input}
                placeholder="Mật khẩu"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                textContentType="password"
            />
            {isLoading ? (
                <ActivityIndicator size="large" color="#0000ff" />
            ) : (
                <Button title={isRegister ? 'Đăng ký' : 'Đăng nhập'} onPress={handleAuth} />
            )}
            <TouchableOpacity onPress={toggleMode} style={styles.toggleButton}>
                <Text style={styles.toggleText}>
                    {isRegister ? 'Bạn đã có tài khoản? Đăng nhập' : 'Bạn chưa có tài khoản? Đăng ký'}
                </Text>
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

export default AuthScreen;
