import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { View } from 'react-native';

export default function TabsLayout() {
  return (
    <View style={{ flex: 1 }}>
      
      <Tabs screenOptions={{ 
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: '#fff', // Active tab color (green)
        tabBarInactiveTintColor: '#666', // Optional: color for inactive tabs
        tabBarStyle: {
          backgroundColor: 'transparent',
          elevation: 0,
          borderTopWidth: 0,
          position: 'absolute',
          bottom: 0
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
              <Ionicons name="person" size={size} color={color} />
            )
          }} 
        />
        <Tabs.Screen 
          name="home" 
          options={{ 
            title: "Home",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home" size={size} color={color} />
            )
          }} 
        />
        <Tabs.Screen 
          name="list" 
          options={{ 
            title: "List",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="list" size={size} color={color} />
            )
          }} 
        />
      </Tabs>
    </View>
  );
}
