import React, { useEffect, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { auth } from '../firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Layout() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkFirstLaunch = async () => {
      const hasLaunched = await AsyncStorage.getItem('hasLaunched');
      
      if (!hasLaunched) {
        await AsyncStorage.setItem('hasLaunched', 'true');
        router.replace('/');
        return;
      }

      const unsubscribe = auth.onAuthStateChanged((user) => {
        if (user) {
          setIsAuthenticated(true);
          router.replace('/(tabs)/profile');
        } else {
          setIsAuthenticated(false);
          router.replace('/student/login');
        }
      });
      return unsubscribe;
    };

    checkFirstLaunch();
  }, []);

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ title: "Tabs" }} />
      <Stack.Screen name="verify" options={{ title: "Verify Email" }} />
      <Stack.Screen name="index" options={{ title: "Loading" }} />
      <Stack.Screen name="onboarding" options={{ title: "Loading" }} />
    </Stack>
  );
}
