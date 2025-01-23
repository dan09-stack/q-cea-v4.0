import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, View } from 'react-native';

export default function TabsLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Tabs screenOptions={{ 
        headerShown: false,
        tabBarShowLabel: false, // This line hides the tab labels
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: '#fff',
        tabBarInactiveTintColor: '#0009',
        tabBarStyle: {
          backgroundColor: Platform.OS === 'web' ? '' : 'transparent',
          elevation: 0,
          borderTopWidth: 0,
          position: 'absolute',
          bottom: 10,
          paddingLeft: Platform.OS === 'web' ? '20%' : 0,
          paddingRight: Platform.OS === 'web' ? '20%' : 0,
        },
        tabBarVisibilityAnimationConfig: {
          show: {
            animation: 'timing',
            config: { duration: 0 }
          },
          hide: {
            animation: 'timing',
            config: { duration: 0 }
          }
        }
      }}>
        <Tabs.Screen 
          name="profile" 
          options={{ 
            title: "Profile",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person" size={Platform.OS === 'web' ? 32 : 24}  color={color} />
            )
          }} 
        />
        <Tabs.Screen 
          name="home" 
          options={{ 
            title: "Home",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home" size={Platform.OS === 'web' ? 32 : 24}  color={color} />
            )
          }} 
        />
        <Tabs.Screen 
          name="list" 
          options={{ 
            title: "List",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="list" size={Platform.OS === 'web' ? 32 : 24}  color={color} />
            )
          }} 
        />
      </Tabs>
    </View>
  );
}
