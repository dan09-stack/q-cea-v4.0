import React, { useEffect, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { auth } from '../firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';

export default function Layout() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    'Poppins-Regular': require('../assets/fonts/Poppins-Regular.ttf'),
    'Poppins-Medium': require('../assets/fonts/Poppins-Medium.ttf'),
    'Poppins-SemiBold': require('../assets/fonts/Poppins-SemiBold.ttf'),
    'Poppins-Bold': require('../assets/fonts/Poppins-Bold.ttf'),
  });

  useEffect(() => {
    const checkAuthAndSession = async () => {
      const hasLaunched = await AsyncStorage.getItem('hasLaunched');
      const lastSession = await AsyncStorage.getItem('userSession');
      
      if (!hasLaunched) {
        await AsyncStorage.setItem('hasLaunched', 'true');
        router.replace('/');
        return;
      }

      const unsubscribe = auth.onAuthStateChanged(async (user) => {
        if (user) {
          setIsAuthenticated(true);
          await AsyncStorage.setItem('userSession', JSON.stringify({
            uid: user.uid,
            email: user.email,
            lastAccess: new Date().toISOString()
          }));
          router.replace('/(tabs)/profile');
        } else if (lastSession) {
          try {
            const sessionData = JSON.parse(lastSession);
            if (sessionData && sessionData.uid) {
              setIsAuthenticated(true);
              router.replace('/(tabs)/profile');
              return;
            }
          } catch (error) {
            await AsyncStorage.removeItem('userSession');
          }
          setIsAuthenticated(false);
          router.replace('/student/login');
        } else {
          setIsAuthenticated(false);
          router.replace('/student/login');
        }
      });
      return unsubscribe;
    };

    checkAuthAndSession();
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <Stack 
    screenOptions={{ 
    headerShown: false,
    headerTitleStyle: {
      fontFamily: 'Poppins-Regular'
        },
        
      }}
    >
      <Stack.Screen 
        name="(tabs)" 
        options={{ 
        title: "Tabs",
        headerTitleStyle: {
        fontFamily: 'Poppins-SemiBold'
          }
        }} 
      />
      <Stack.Screen 
        name="verify" 
        options={{ 
          headerTitleStyle: {
            fontFamily: 'Poppins-SemiBold'
          }
        }} 
      />
      <Stack.Screen 
        name="index" 
        
      />
      
    </Stack>
  );
}
