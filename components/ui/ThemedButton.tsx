import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { getContrastTextColor } from '@/utils/themeUtils';

interface ThemedButtonProps {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  type?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}

export const ThemedButton: React.FC<ThemedButtonProps> = ({
  title,
  onPress,
  style,
  textStyle,
  type = 'primary',
  disabled = false
}) => {
  const { colors } = useTheme();
  
  // Determine button background color based on type
  let backgroundColor = colors.buttonColor;
  if (type === 'secondary') {
    backgroundColor = '#777777';
  } else if (type === 'danger') {
    backgroundColor = '#f44336';
  }
  
  // Calculate text color based on button background
  const textColor = getContrastTextColor(backgroundColor);
  
  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: disabled ? '#cccccc' : backgroundColor },
        style
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.text, { color: textColor }, textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 5,
  },
  text: {
    fontSize: 16,
    fontWeight: 'bold',
  }
});
