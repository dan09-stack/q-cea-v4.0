import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { ResetColorsModal } from './ResetColorsModal';
import { ColorPickerModal } from './ColorPicker';

interface ThemeSettingsProps {
  containerStyle?: ViewStyle;
}

export const ThemeSettings: React.FC<ThemeSettingsProps> = ({ containerStyle }) => {
  const { colors } = useTheme();
  const [colorPickerVisible, setColorPickerVisible] = useState(false);
  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [selectedColorKey, setSelectedColorKey] = useState<keyof typeof colors | null>(null);
  const [selectedColorName, setSelectedColorName] = useState('');

  const openColorPicker = (colorKey: keyof typeof colors, colorName: string) => {
    setSelectedColorKey(colorKey);
    setSelectedColorName(colorName);
    setColorPickerVisible(true);
  };

  const colorOptions = [
    { key: 'backgroundColor', name: 'Background Color' },
    { key: 'buttonColor', name: 'Button Color' },
    { key: 'textColor', name: 'Text Color' },
    { key: 'accentColor', name: 'Accent Color' },
  ];

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.title}>Theme Settings</Text>
      
      <View style={styles.colorOptionsContainer}>
        {colorOptions.map((option) => (
          <TouchableOpacity
            key={option.key}
            style={styles.colorOption}
            onPress={() => openColorPicker(option.key as keyof typeof colors, option.name)}
          >
            <Text style={styles.colorOptionText}>{option.name}</Text>
            <View 
              style={[
                styles.colorPreview, 
                { backgroundColor: colors[option.key as keyof typeof colors] || '#cccccc' }
              ]} 
            />
          </TouchableOpacity>
        ))}
      </View>
      
      <TouchableOpacity
        style={styles.resetButton}
        onPress={() => setResetModalVisible(true)}
      >
        <Text style={styles.resetButtonText}>Reset to Default Colors</Text>
      </TouchableOpacity>
      
      {/* Color Picker Modal */}
      {selectedColorKey && (
        <ColorPickerModal
          isVisible={colorPickerVisible}
          onClose={() => setColorPickerVisible(false)}
          initialColor={colors[selectedColorKey] || '#ffffff'}
          colorName={selectedColorName}
          colorKey={selectedColorKey}
        />
      )}
      
      {/* Reset Confirmation Modal */}
      <ResetColorsModal
        visible={resetModalVisible}
        onClose={() => setResetModalVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '100%',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  colorOptionsContainer: {
    marginBottom: 20,
  },
  colorOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  colorOptionText: {
    fontSize: 16,
  },
  colorPreview: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  resetButton: {
    backgroundColor: '#f44336',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  resetButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
