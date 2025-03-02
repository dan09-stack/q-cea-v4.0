import React, { useEffect, useState } from 'react';
import { Stack, useRouter, usePathname } from 'expo-router';
import { auth } from '../firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import { ThemeProvider } from '../contexts/ThemeContext'; // Import ThemeProvider
import { StatusBar } from 'react-native';
import { useTheme } from '../contexts/ThemeContext'; // Will be used in a child component

// Optional: Theme-aware StatusBar component
const ThemedStatusBar = () => {
  const { colors } = useTheme();
  return (
    <StatusBar 
      backgroundColor={colors.backgroundColor}
      barStyle={getContrastForStatusBar(colors.backgroundColor)}
    />
  );
};

// Helper function to determine status bar style based on background color
const getContrastForStatusBar = (hexColor: string) => {
  // Convert hex to RGB
  const r = parseInt(hexColor.substring(1,3),16);
  const g = parseInt(hexColor.substring(3,5),16);
  const b = parseInt(hexColor.substring(5,7),16);
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  return luminance > 0.5 ? 'dark-content' : 'light-content';
};

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
                router.replace(lastRoute as any);
              } else {
                router.replace('/(tabs)/home');
              }
            } else {
              router.replace('/verify');
            }
          } else {
            setIsAuthenticated(false);
            router.replace('/');
          }
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

  // Wrap your entire app with ThemeProvider
  return (
    <ThemeProvider>
      {/* Optional: Add ThemedStatusBar if you want the status bar to match your theme */}
      <ThemedStatusBar />
      
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
    </ThemeProvider>
  );
}
