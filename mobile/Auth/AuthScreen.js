// screens/AuthScreen.js
import React, { useState, useContext } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Auth } from 'aws-amplify';
import { useNavigation } from '@react-navigation/native';
import AWS from 'aws-sdk';
import { REGION, ACCESS_KEY_ID, SECRET_ACCESS_KEY, IPV4 } from '@env';
import { UserContext } from '../context/UserContext';

AWS.config.update({
    region: REGION,
    credentials: new AWS.Credentials({
        accessKeyId: ACCESS_KEY_ID,
        secretAccessKey: SECRET_ACCESS_KEY
    })
});

const sns = new AWS.SNS();

const verifyPhoneNumber = async (phoneNumber) => {
    try {
        const result = await sns.createSMSSandboxPhoneNumber({
            PhoneNumber: phoneNumber,
            LanguageCode: 'en-US',
        }).promise();
        console.log('Số điện thoại đã được thêm vào sandbox:', result);
        Alert.alert(
            'Thành công',
            'Số điện thoại đã được thêm vào sandbox. Vui lòng kiểm tra tin nhắn để xác minh.'
        );
    } catch (error) {
        console.error('Lỗi thêm số điện thoại vào sandbox:', error);
        Alert.alert(
            'Lỗi',
            error.message || 'Không thể thêm số điện thoại vào sandbox.'
        );
    }
};

// Server -> get user (Đã chuyển vào UserContext)
const AuthScreen = () => {
    const navigation = useNavigation();
    const { setUser, fetchUserProfile } = useContext(UserContext);
    const [isRegister, setIsRegister] = useState(false);
    const [step, setStep] = useState(1);
    const [name, setName] = useState('');
    const [birthDate, setBirthDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const toggleMode = () => {
        setIsRegister(!isRegister);
        setStep(1);
    };

    const handleNextStep = () => {
        if (!name) {
            Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ tên và ngày sinh.');
            return;
        }
        setStep(2);
    };

    const handleAuth = async () => {
        if (step === 2 && (!phoneNumber || !password || (isRegister && !confirmPassword))) {
            Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ số điện thoại, mật khẩu và xác nhận mật khẩu.');
            return;
        }

        if (isRegister && password !== confirmPassword) {
            Alert.alert('Lỗi', 'Mật khẩu và xác nhận mật khẩu không khớp.');
            return;
        }

        setIsLoading(true);
        try {
            if (isRegister) {
                // Thực hiện đăng ký (nếu cần)
                // Ví dụ: sử dụng Auth.signUp nếu bạn sử dụng Cognito
                // const result = await Auth.signUp({...});
                // console.log('Sign up success', result);

                // Thực hiện xác thực số điện thoại
                await verifyPhoneNumber(phoneNumber);
                Alert.alert('Thành công', 'Mã xác thực đã được gửi đến số điện thoại của bạn.');

                navigation.navigate('ConfirmSignUpScreen', {
                    phoneNumber: phoneNumber,
                    name: name,
                    dob: birthDate.toISOString().split('T')[0],
                    password: password,
                });
            } else {
                const user = await Auth.signIn(phoneNumber, password);
                console.log('User signed in successfully:', user);

                const userProfile = await fetchUserProfile(phoneNumber);

                if (userProfile) {
                    setUser(userProfile);
                    navigation.replace('MainTabs');
                }
                console.log('User profile:', userProfile);
            }
        } catch (error) {
            console.error('Error during authentication:', error);
            Alert.alert('Lỗi', error.message || 'Có lỗi xảy ra.');
        }
        setIsLoading(false);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{isRegister ? 'Đăng ký' : 'Đăng nhập'}</Text>
            {isRegister && step === 1 ? (
                <>
                    <TextInput
                        style={styles.input}
                        placeholder="Tên"
                        value={name}
                        onChangeText={setName}
                        keyboardType="default"
                        autoCorrect={false}
                    />
                    <TouchableOpacity
                        style={styles.input}
                        onPress={() => setShowDatePicker(true)}
                    >
                        <Text>{birthDate.toISOString().split('T')[0]}</Text>
                    </TouchableOpacity>
                    {showDatePicker && (
                        <DateTimePicker
                            value={birthDate}
                            mode="date"
                            display="default"
                            onChange={(event, selectedDate) => {
                                setShowDatePicker(false);
                                if (selectedDate) {
                                    setBirthDate(selectedDate);
                                }
                            }}
                        />
                    )}
                    <Button title="Tiếp tục" onPress={handleNextStep} />
                </>
            ) : (
                <>
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
                    {isRegister && (
                        <TextInput
                            style={styles.input}
                            placeholder="Xác nhận mật khẩu"
                            secureTextEntry
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                        />
                    )}
                    {isLoading ? (
                        <ActivityIndicator size="large" color="#0000ff" />
                    ) : (
                        <Button
                            title={isRegister ? 'Đăng ký' : 'Đăng nhập'}
                            onPress={() => {
                                if (!phoneNumber || !password) {
                                    Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ số điện thoại và mật khẩu.');
                                } else {
                                    handleAuth();
                                }
                            }}
                        />
                    )}
                </>
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
        justifyContent: 'center',
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
