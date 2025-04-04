import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Auth } from 'aws-amplify';
import axios from 'axios';
import { IPV4 } from '@env';
import { useRoute, useNavigation } from '@react-navigation/native';
import AWS from 'aws-sdk';
import { REGION, ACCESS_KEY_ID, SECRET_ACCESS_KEY, USER_POOL_ID, USER_POOL_WEB_CLIENT_ID} from '@env';

AWS.config.update({
    region: REGION,
    credentials: new AWS.Credentials({
        accessKeyId: ACCESS_KEY_ID,
        secretAccessKey: SECRET_ACCESS_KEY
    })
});

const sns = new AWS.SNS();

const resendOTP = async () => {
    setIsLoading(true);
    try {
        const result = await sns.createSMSSandboxPhoneNumber({
            PhoneNumber: phoneNumber,
            LanguageCode: 'en-US',
        }).promise();

        Alert.alert('Thành công', 'Mã OTP mới đã được gửi đến số điện thoại của bạn.');
    } catch (error) {
        console.error('Lỗi khi gửi lại OTP:', error);
        Alert.alert('Lỗi', error.message || 'Không thể gửi lại mã OTP.');
    }
    setIsLoading(false);
};

const ConfirmSignUpScreen = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const { phoneNumber, name, dob, password } = route.params;

    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleConfirm = async () => {
        if (!code) {
            Alert.alert('Lỗi', 'Vui lòng nhập mã xác thực.');
            return;
        }

        setIsLoading(true);
        try {
            const result = await sns.verifySMSSandboxPhoneNumber({
                        PhoneNumber: phoneNumber,
                        OneTimePassword: code,
            }).promise();
            Alert.alert('Thành công', 'Xác thực số điện thoại thành công. Đang tạo tài khoản...');

            const cognito = new AWS.CognitoIdentityServiceProvider();

            const cognitoParams = {
            UserPoolId: USER_POOL_ID,
                 Username: phoneNumber,
                 UserAttributes: [
                    { Name: 'phone_number', Value: phoneNumber },
                    { Name: 'name', Value: name },
                    { Name: 'birthdate', Value: dob },
                 ],
                 MessageAction: 'SUPPRESS',
                 TemporaryPassword: password,
            };

           await cognito.adminCreateUser(cognitoParams).promise();

           const setPasswordParams = {
                       UserPoolId: USER_POOL_ID,
                       Username: phoneNumber,
                       Password: password,
                       Permanent: true,
           };

           await cognito.adminSetUserPassword(setPasswordParams).promise();

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

                navigation.navigate('AuthScreen');
            } catch (backendError) {
                console.error('Error sending user data to backend:', backendError);
                Alert.alert('Lỗi', 'Xác thực thành công nhưng không thể lưu thông tin người dùng. Vui lòng liên hệ hỗ trợ.');
            }
        } catch (error) {
            console.log('Error confirming sign up', JSON.stringify(error, null, 2));

            if (error.code === 'VerificationException' && error.message.includes('Verification code is incorrect')) {
                Alert.alert('Lỗi', 'Mã OTP không chính xác. Vui lòng kiểm tra lại.');
            } else {
                Alert.alert('Lỗi', error.message || 'Có lỗi xảy ra khi xác thực mã.');
            }
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

            <TouchableOpacity onPress={resendOTP}>
                <Text style={{ marginTop: 20, color: 'blue', textAlign: 'center' }}>Bạn không nhận được OTP? Gửi lại</Text>
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
