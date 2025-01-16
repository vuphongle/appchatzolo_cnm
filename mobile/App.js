// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import { Amplify } from 'aws-amplify';
import awsConfig from './Auth/aws-exports';
import AuthScreen from './Auth/AuthScreen';
import SettingScreen from './screens/SettingScreen';
import ConfirmSignUpScreen from './Auth/ConfirmSignUpScreen';
import MainTabNavigator from './navigation/MainTabNavigator';
import { UserProvider } from './context/UserContext';


Amplify.configure({
  ...awsConfig,
});

const Stack = createStackNavigator();

const App = () => {
  return (
    <UserProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="AuthScreen">
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
            options={{ headerShown: false}}
          />
          <Stack.Screen
            name="SettingsScreen"
            component={SettingScreen}
            options={{ headerTitle: 'Cài đặt' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </UserProvider>
  );
};

export default App;
