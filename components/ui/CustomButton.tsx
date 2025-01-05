import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface CustomButtonProps {
  title: string;
  onPress: () => void;
  color?: string;
}

export const CustomButton = ({ title, onPress, color = '#005000' }: CustomButtonProps) => {
  return (
    <TouchableOpacity 
      onPress={onPress}
      style={[styles.button, { backgroundColor: color }]}
    >
      <Text style={[
        styles.buttonText,
        { color: color === 'white' ? '#0009' : 'white' }
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};


const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  }
});
