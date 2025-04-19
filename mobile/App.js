// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { Amplify } from 'aws-amplify';
import awsConfig from './Auth/aws-exports';
import AuthScreen from './Auth/AuthScreen';
import SettingScreen from './screens/SettingScreen';
import ConfirmSignUpScreen from './Auth/ConfirmSignUpScreen';
import MainTabNavigator from './navigation/MainTabNavigator';
import { UserProvider } from './context/UserContext';
import Chat from './components/Message/Chat/Chat';
import Detail_infoChat from './components/Message/Chat/Detail_infoChat';
import ImageChat from './components/Message/Chat/ImageChat';
import ScreenCloud from './components/Message/Cloud/ScreenCloud';
import CloudStorageScreen from './components/Message/Cloud/CloudStorageScreen';
import FriendInvitesScreen from './screens/FriendInvitesScreen';
import AccountSecurityScreen from './screens/AccountSecurityScreen';
import PersonalInfoScreen from './screens/PersonalInfoScreen';
import EditPersonalInfoScreen from './screens/EditPersonalInfoScreen';
import ForgotPasswordScreen from './Auth/ForgotPasswordScreen';
import ChangePasswordScreen from './Auth/ChangePasswordScreen';
import { WebSocketProvider } from './context/Websocket';
import CreateGroupScreen from './screens/CreateGroupScreen';
import ChatGroup from './components/Message/ChatGroup/Chatnhom';
import Detail_infoChatGroup from './components/Message/ChatGroup/Detail_infoChatGroup';
import MemberGroupScreen from './components/Message/ChatGroup/MemberGroupScreen';
import AddMemberGroupScreen from './components/Message/ChatGroup/AddMemberGroupScreen';
Amplify.configure({
  ...awsConfig,
});

const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer initialRouteName="AuthScreen">
      <Stack.Navigator>
        <Stack.Screen
          name="AuthScreen"
          component={AuthScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ConfirmSignUpScreen"
          component={ConfirmSignUpScreen}
          options={{ headerTitle: 'Xác nhận đăng ký' }}
        />
        <Stack.Screen
          name="MainTabs"
          component={MainTabNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="SettingsScreen"
          component={SettingScreen}
          options={{ headerTitle: 'Cài đặt' }}
        />
        <Stack.Screen
          name="AccountSecurityScreen"
          component={AccountSecurityScreen}
          options={{ headerTitle: 'Tài khoản và bảo mật' }}
        />
        <Stack.Screen
          name="PersonalInfoScreen"
          component={PersonalInfoScreen}
          options={{ headerTitle: 'Thông tin cá nhân' }}
        />
        <Stack.Screen
          name="EditPersonalInfoScreen"
          component={EditPersonalInfoScreen}
          options={{ headerTitle: 'Chỉnh sửa thông tin' }}
        />
        <Stack.Screen
          name="Chat"
          component={Chat}
          options={{ headerShown: false }}
        />
          <Stack.Screen
          name="ChatGroup"
          component={ChatGroup}
          options={{ headerShown: false }}
        />
         <Stack.Screen
          name="Detail_infoChatGroup"
          component={Detail_infoChatGroup}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="DetailChat"
          component={Detail_infoChat}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ImageChat"
          component={ImageChat}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ScreenCloud"
          component={ScreenCloud}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="CloudStorageScreen"
          component={CloudStorageScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="FriendInvitesScreen"
          component={FriendInvitesScreen}
          options={{ headerTitle: 'Lời mời kết bạn' }}
        />
        <Stack.Screen
          name="ForgotPasswordScreen"
          component={ForgotPasswordScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ChangePasswordScreen"
          component={ChangePasswordScreen}
          options={{ headerTitle: 'Thay đổi mật khẩu' }}
        />
        <Stack.Screen
          name="CreateGroupScreen"
          component={CreateGroupScreen}
          options={{ headerTitle: 'Nhóm mới' }}
        />
        <Stack.Screen
          name="MemberGroupScreen"
          component={MemberGroupScreen}
          options={{ headerTitle: 'Thành viên nhóm' }}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AddMemberGroupScreen"
          component={AddMemberGroupScreen}
          options={{ headerTitle: 'Thêm thành viên' }}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const App = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <UserProvider>
        <WebSocketProvider>
          <AppNavigator />
        </WebSocketProvider>
      </UserProvider>
    </GestureHandlerRootView>
  );
};

export default App;
