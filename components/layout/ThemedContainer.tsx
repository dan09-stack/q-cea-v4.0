import React, { useMemo } from 'react';
import { View, StyleSheet, ViewStyle, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { shadeColor } from '@/utils/themeUtils';

interface ThemedContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  useGradient?: boolean;
}

export const ThemedContainer: React.FC<ThemedContainerProps> = ({
  children,
  style,
  useGradient = true
}) => {
  const { colors, isUpdating } = useTheme();
  
  // Use useMemo to create gradient colors only when the background color changes
  const gradientColors = useMemo(() => {
    return [
      colors.backgroundColor,
      shadeColor(colors.backgroundColor, -15),
      shadeColor(colors.backgroundColor, -30)
    ] as readonly [string, string, string];
  }, [colors.backgroundColor]);
  
  if (useGradient) {
    return (
      <LinearGradient
        colors={gradientColors}
        style={[styles.container, style]}
      >
        {isUpdating && (
          <View style={styles.updatingOverlay}>
            <ActivityIndicator size="large" color="#ffffff" />
          </View>
        )}
        {children}
      </LinearGradient>
    );
  }
  
  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundColor }, style]}>
      {isUpdating && (
        <View style={styles.updatingOverlay}>
          <ActivityIndicator size="large" color="#ffffff" />
        </View>
      )}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  updatingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  }
});
