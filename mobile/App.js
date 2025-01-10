// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import { Amplify } from 'aws-amplify';
import awsConfig from './Auth/aws-exports';
import AuthScreen from './Auth/AuthScreen';
import ConfirmSignUpScreen from './Auth/ConfirmSignUpScreen';
import MainTabNavigator from './navigation/MainTabNavigator';
import SearchHeader from './components/SearchHeader';
import { SearchProvider } from './context/SearchContext';

Amplify.configure({
  ...awsConfig,
});

const Stack = createStackNavigator();

const App = () => {
  return (
    <SearchProvider>
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
            options={{
              headerTitle: () => <SearchHeader />,
              headerStyle: {
                backgroundColor: '#0699f9',
              },
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SearchProvider>
  );
};

export default App;
