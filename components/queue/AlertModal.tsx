import React from 'react';
import { View, Text, Modal, Button } from 'react-native';
import { homeStyles as styles } from '@/constants/home.styles';

interface AlertModalProps {
  isVisible: boolean;
  title: string;
  message: string;
  onClose: () => void;
  onOk?: () => void;
  style?: object;
}

export const AlertModal = ({ isVisible, title, message, onClose, onOk }: AlertModalProps) => (
  <Modal
    animationType="fade"
    transparent={true}
    visible={isVisible}
    onRequestClose={onClose}
  >
    <View style={styles.modalContainer}>
      <View style={[styles.modalContent,{maxWidth: 300, alignSelf: 'center'}]}>
        <Text style={styles.modalTitle}>{title}</Text>
        <Text style={styles.modalItemText}>{message}</Text>
        <Button 
          title="OK" 
          onPress={() => {
            onClose();
            if (onOk) onOk();
          }} 
          color="#004000" 
        />
      </View>
    </View>
  </Modal>
);
