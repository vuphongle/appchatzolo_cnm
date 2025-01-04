// src/ConfirmSignUpScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Auth } from 'aws-amplify';

const ConfirmSignUpScreen = ({ phoneNumber, onConfirm }) => {
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleConfirm = async () => {
        if (!code) {
            Alert.alert('Lỗi', 'Vui lòng nhập mã xác thực.');
            return;
        }

        setIsLoading(true);
        try {
            await Auth.confirmSignUp(phoneNumber, code);
            Alert.alert('Thành công', 'Xác thực số điện thoại thành công. Bạn có thể đăng nhập.');
            console.log('Đã xác thực thành công');
            onConfirm();
            console.log('Đã chạy thành công onConfirm');
        } catch (error) {
            console.log('Error confirming sign up', error);
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
