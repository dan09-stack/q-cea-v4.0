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
        const hasLaunched = await AsyncStorage.getItem('hasLaunched');
        const lastRoute = await AsyncStorage.getItem('lastRoute');
        
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
          if (user) {
            if (user.emailVerified) {
              setIsAuthenticated(true);
              // Only navigate if lastRoute exists and user is authenticated
              if (lastRoute && lastRoute !== '/') {
                router.replace(lastRoute as any );
              } else {
                router.replace('/(tabs)/home' );
              }
            } else {
              router.replace('/verify' );
            }
          } else {
            setIsAuthenticated(false);
            router.replace('/student/login'  );
          }
          // console.log('Last route:', await AsyncStorage.getItem('lastRoute'));
          // console.log('Current auth state:', auth.currentUser);

        });
        return unsubscribe;
      } catch (error) {
        console.error('Route restoration error:', error);
      }
    };
  
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
     
      
    </Stack>
  );
}