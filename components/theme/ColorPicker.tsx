import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import WheelColorPicker from 'react-native-wheel-color-picker';
import { useTheme } from '@/contexts/ThemeContext';

interface ColorPickerProps {
  isVisible: boolean;
  onClose: () => void;
  initialColor: string;
  colorName: string;
  colorKey: 'backgroundColor' | 'buttonColor' | 'textColor' | 'accentColor';
}

export const ColorPickerModal: React.FC<ColorPickerProps> = ({
  isVisible,
  onClose,
  initialColor,
  colorName,
  colorKey
}) => {
  const { updateColor, isUpdating } = useTheme();
  const [selectedColor, setSelectedColor] = useState(initialColor);
  
  // Reset selected color when the modal opens with new initialColor
  useEffect(() => {
    if (isVisible) {
      setSelectedColor(initialColor);
    }
  }, [isVisible, initialColor]);

  const handleApply = async () => {
    try {
      // Wait for the color update to complete
      await updateColor(colorKey, selectedColor);
      Alert.alert('Success', `${colorName} updated successfully`);
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to update color. Please try again.');
    }
  };

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.colorPickerModal}>
          <Text style={styles.modalTitle}>Select {colorName}</Text>
          
          <WheelColorPicker
            color={selectedColor}
            onColorChange={setSelectedColor}
            thumbSize={30}
            sliderSize={30}
            noSnap={true}
            row={false}
          />
          
          <View style={styles.colorPreviewContainer}>
            <Text style={styles.previewLabel}>Preview:</Text>
            <View style={[styles.colorPreview, { backgroundColor: selectedColor }]} />
          </View>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[
                styles.button, 
                { backgroundColor: '#008000', opacity: isUpdating ? 0.7 : 1 }
              ]} 
              onPress={handleApply}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.buttonText}>Apply</Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, { backgroundColor: '#777' }]} 
              onPress={onClose}
              disabled={isUpdating}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  colorPickerModal: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  colorPreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 20,
  },
  previewLabel: {
    marginRight: 10,
    fontSize: 16,
  },
  colorPreview: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginHorizontal: 10,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
