import React, { useEffect, useState } from 'react';
import { Stack, useRouter, usePathname } from 'expo-router';
import { auth } from '../firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';

export default function Layout() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const [isVerified, setIsVerified] = useState(false);

  const [fontsLoaded] = useFonts({
    'Poppins-Regular': require('../assets/fonts/Poppins-Regular.ttf'),
    'Poppins-Medium': require('../assets/fonts/Poppins-Medium.ttf'),
    'Poppins-SemiBold': require('../assets/fonts/Poppins-SemiBold.ttf'),
    'Poppins-Bold': require('../assets/fonts/Poppins-Bold.ttf'),
  });

  useEffect(() => {
  const checkAuthAndRoute = async () => {
    try {
      const lastLoginRole = await AsyncStorage.getItem('lastLoginRole'); 

      const unsubscribe = auth.onAuthStateChanged(async (user) => {
        if (user) {
          if (user.emailVerified) {
            setIsAuthenticated(true);
            
            // Directly route to the correct menu based on the role
            if (lastLoginRole === 'faculty') {
              router.replace('/(tab)/profile'); 
            } else if (lastLoginRole === 'student') {
              router.replace('/(tabs)/home'); 
            }
          } else {
            router.replace('/verify');
          }
<<<<<<< HEAD
        } else {
          setIsAuthenticated(false);
          router.replace('/student/login'); 
        }
      });
      return unsubscribe;
    } catch (error) {
      console.error('Route restoration error:', error);
    }
  };
=======
          // console.log('Last route:', await AsyncStorage.getItem('lastRoute'));
          // console.log('Current auth state:', auth.currentUser);
>>>>>>> test

  checkAuthAndRoute();
}, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerTitleStyle: {
          fontFamily: 'Poppins-Regular',
        },
      }}
    >
      <Stack.Screen
        name="(tabs)"
        options={{
          title: "Tabs",
          headerTitleStyle: {
            fontFamily: 'Poppins-SemiBold',
          },
        }}
      />
<<<<<<< HEAD
      <Stack.Screen
        name="verify"
        options={{
          headerTitleStyle: {
            fontFamily: 'Poppins-SemiBold',
          },
        }}
      />
      <Stack.Screen name="index" />
=======
     
      
>>>>>>> test
    </Stack>
  );
}
