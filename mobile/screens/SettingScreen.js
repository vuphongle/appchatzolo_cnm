// screens/SettingsScreen.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Auth } from 'aws-amplify';

const SettingsScreen = ({ route, navigation }) => {
    const { handleLogout } = route.params;

    const logout = async () => {
        try {
            await Auth.signOut();
            handleLogout();
            if (navigation.canGoBack()) {
                navigation.popToTop();
            } else {
                navigation.replace('AuthScreen');
            }
        } catch (error) {
            console.error('Lỗi khi đăng xuất:', error);
            Alert.alert('Lỗi', 'Không thể đăng xuất.');
        }
    };

    const confirmLogout = () => {
        if (navigation.isFocused()) {
            Alert.alert(
                'Xác nhận',
                'Bạn có chắc chắn muốn đăng xuất?',
                [
                    { text: 'Hủy', style: 'cancel' },
                    { text: 'Đăng xuất', onPress: logout },
                ]
            );
        } else {
            console.warn('Cảnh báo: Không thể hiển thị Alert khi màn hình không hoạt động.');
        }
    };

    const settingsOptions = [
        { icon: 'security', text: 'Tài khoản và bảo mật', onPress: () => navigation.navigate('AccountSecurityScreen') },
        { icon: 'lock', text: 'Quyền riêng tư', onPress: () => {} },
        { icon: 'history', text: 'Dữ liệu trên máy', onPress: () => {} },
        { icon: 'sync', text: 'Sao lưu và khôi phục', onPress: () => {} },
        { icon: 'notifications', text: 'Thông báo', onPress: () => {} },
        { icon: 'message', text: 'Tin nhắn', onPress: () => {} },
        { icon: 'call', text: 'Cuộc gọi', onPress: () => {} },
        { icon: 'event-note', text: 'Nhật ký', onPress: () => {} },
        { icon: 'contacts', text: 'Danh bạ', onPress: () => {} },
        { icon: 'translate', text: 'Giao diện và ngôn ngữ', onPress: () => {} },
        { icon: 'info', text: 'Thông tin về Zalo', onPress: () => {} },
        { icon: 'help-outline', text: 'Liên hệ hỗ trợ', onPress: () => {} },
        { icon: 'swap-horiz', text: 'Chuyển tài khoản', onPress: () => {} },
    ];

    return (
        <ScrollView style={styles.container}>
            {settingsOptions.map((option, index) => (
                <TouchableOpacity key={index} style={styles.optionItem} onPress={option.onPress}>
                    <Icon name={option.icon} size={24} color="#0056B3" style={styles.icon} />
                    <Text style={styles.optionText}>{option.text}</Text>
                </TouchableOpacity>
            ))}

            <TouchableOpacity style={[styles.optionItem, styles.logoutItem]} onPress={confirmLogout}>
                <Icon name="logout" size={24} color="#FF0000" style={styles.icon} />
                <Text style={[styles.optionText, styles.logoutText]}>Đăng xuất</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F0F8FF',
        padding: 10,
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    icon: {
        marginRight: 15,
    },
    optionText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0056B3',
    },
    logoutItem: {
        marginTop: 20,
        marginBottom: 50
    },
    logoutText: {
        color: '#FF0000',
    },
});

export default SettingsScreen;
