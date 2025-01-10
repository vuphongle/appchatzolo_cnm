// navigation/MainTabNavigator.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';

import TinNhanScreen from '../screens/TinNhanScreen';
import DanhBaScreen from '../screens/DanhBaScreen';
import KhamPhaScreen from '../screens/KhamPhaScreen';
import NhatKyScreen from '../screens/NhatKyScreen';
import CaNhanScreen from '../screens/CaNhanScreen';

const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      initialRouteName="TinNhan"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'TinNhan':
              iconName = 'message';
              break;
            case 'DanhBa':
              iconName = 'contacts';
              break;
            case 'KhamPha':
              iconName = 'explore';
              break;
            case 'NhatKy':
              iconName = 'book';
              break;
            case 'CaNhan':
              iconName = 'person';
              break;
            default:
              iconName = 'circle';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#1E90FF',
        tabBarInactiveTintColor: '#555',
        tabBarStyle: {
          backgroundColor: '#FAFAFA',
          borderTopWidth: 0.5,
          borderColor: '#E0E0E0',
          paddingVertical: 8,
          elevation: 2,
        },
        tabBarLabelStyle: {
          fontSize: 12,
        },
      })}
    >
      <Tab.Screen
        name="TinNhan"
        component={TinNhanScreen}
        options={{ tabBarLabel: 'Tin nhắn' }}
      />
      <Tab.Screen
        name="DanhBa"
        component={DanhBaScreen}
        options={{ tabBarLabel: 'Danh bạ' }}
      />
      <Tab.Screen
        name="KhamPha"
        component={KhamPhaScreen}
        options={{ tabBarLabel: 'Khám phá' }}
      />
      <Tab.Screen
        name="NhatKy"
        component={NhatKyScreen}
        options={{ tabBarLabel: 'Nhật ký' }}
      />
      <Tab.Screen
        name="CaNhan"
        component={CaNhanScreen}
        options={{ tabBarLabel: 'Cá nhân' }}
      />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;
