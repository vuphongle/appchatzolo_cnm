    import React, { useState } from 'react';
    import { SafeAreaView, StyleSheet, StatusBar } from 'react-native';
    import { Amplify } from 'aws-amplify';
    import awsConfig from './Auth/aws-exports';
    import AuthScreen from './Auth/AuthScreen';
    import ConfirmSignUpScreen from './Auth/ConfirmSignUpScreen';
    import AsyncStorage from '@react-native-async-storage/async-storage';
    import 'react-native-get-random-values';

    Amplify.configure({
        ...awsConfig,

        Storage: {
            // Cấu hình Storage nếu cần
        },
        // Thêm cấu hình nếu cần
    });

    const App = () => {
        const [isConfirmed, setIsConfirmed] = useState(false);
        const [registeredPhone, setRegisteredPhone] = useState('');

        const handleSignUp = (phone) => {
            setRegisteredPhone(phone);
        };

        const handleConfirm = () => {
            setIsConfirmed(true);
        };

        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" />
                {!isConfirmed ? (
                    registeredPhone ? (
                        <ConfirmSignUpScreen phoneNumber={registeredPhone} onConfirm={handleConfirm} />
                    ) : (
                        <AuthScreen onSignUp={handleSignUp} />
                    )
                ) : (
                    <AuthScreen />
                )}
            </SafeAreaView>
        );
    };

    const styles = StyleSheet.create({
        container: {
            flex: 1,
        },
    });

    export default App;
