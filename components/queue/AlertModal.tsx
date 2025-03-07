import React from 'react';
import { View, Text, Modal, Button, TouchableOpacity } from 'react-native';
import { homeStyles as styles } from '@/constants/home.styles';

interface ButtonProps {
  text: string;
  onPress: () => void;
  color?: string;
  width?: number;
}

interface AlertModalProps {
  isVisible: boolean;
  title: string;
  message: string;
  onClose: () => void;
  onOk?: () => void;
  style?: object;
  buttons?: ButtonProps[]; // New prop for multiple buttons
}

export const AlertModal = ({ 
  isVisible, 
  title, 
  message, 
  onClose, 
  onOk, 
  style, 
  buttons 
}: AlertModalProps) => (
  <Modal
    animationType="fade"
    transparent={true}
    visible={isVisible}
    onRequestClose={onClose}
  >
    <View style={styles.modalContainer}>
      <View style={[styles.modalContent, {maxWidth: 500, alignSelf: 'center'}, style]}>
        <Text style={styles.modalTitle}>{title}</Text>
        <Text style={styles.modalItemText}>{message}</Text>
        
        {buttons ? (
          <View style={{flexDirection: 'row', justifyContent: 'space-around', marginTop: 15}}>
            {buttons.map((button, index) => (
              <Button
                key={index}
                title={button.text}
                onPress={button.onPress}
                color={button.color || "#004000"}
              />
            ))}
          </View>
        ) : (
          <Button
            
            title="OK"
            onPress={() => {
              onClose();
              if (onOk) onOk();
            }}
            color="#004000"

          />
        )}
      </View>
    </View>
  </Modal>
);
