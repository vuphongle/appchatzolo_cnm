import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { isPasswordValid } from '../utils/passwordUtils';
import { formatPhoneNumber } from '../utils/formatPhoneNumber';

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
        setIsLoading(true);
        try {
//            await Auth.forgotPassword(phoneNumber);  // Gửi yêu cầu gửi OTP
            setStep(2);  // Chuyển sang bước nhập OTP
            Alert.alert('Thông báo', 'OTP đã được gửi đến số điện thoại của bạn.');
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
//            await Auth.forgotPasswordSubmit(phoneNumber, otp, newPassword);  // Thực hiện xác thực OTP và thay đổi mật khẩu sau khi xác thực
            setStep(3);  // Chuyển sang bước nhập mật khẩu mới
        } catch (error) {
            console.error('Lỗi xác thực OTP:', error);
            Alert.alert('Lỗi', 'Mã OTP không đúng hoặc có lỗi trong quá trình thay đổi mật khẩu.');
        }
        setIsLoading(false);
    };

    const handleChangePassword = async () => {
        if (newPassword !== confirmNewPassword) {
            Alert.alert('Lỗi', 'Mật khẩu mới và xác nhận mật khẩu không khớp.');
            return;
        }

        if (!isPasswordValid(newPassword)) {
            Alert.alert('Lỗi', 'Mật khẩu phải có ít nhất 8 ký tự, một chữ cái thường, một chữ cái in hoa, một số và một ký tự đặc biệt.');
            return;
        }

        setIsLoading(true);
        try {
//            await Auth.forgotPasswordSubmit(phoneNumber, otp, newPassword);  // Thực hiện thay đổi mật khẩu
            Alert.alert('Thông báo', 'Mật khẩu đã được thay đổi thành công.');
            navigation.navigate('Login');  // Quay lại màn hình Đăng nhập
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

            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.toggleButton}>
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
