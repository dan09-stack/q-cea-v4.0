import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeGradient } from '@/hooks/useThemeGradient';

interface ThemedGradientContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
}

export function ThemedGradientContainer({ 
  children, 
  style, 
  intensity = 20 
}: ThemedGradientContainerProps) {
  const { gradientColors } = useThemeGradient(intensity);
  
  return (
    <LinearGradient 
      colors={gradientColors}
      style={[styles.container, style]}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
