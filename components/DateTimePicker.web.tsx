import React from 'react';
import { View, Modal, Button, StyleSheet } from 'react-native';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface DateTimePickerProps {
  isVisible: boolean;
  mode: 'date' | 'time';
  date: Date;
  onConfirm: (date: Date) => void;
  onCancel: () => void;
}

export default function DateTimePickerWeb({ 
  isVisible, 
  mode, 
  date, 
  onConfirm, 
  onCancel 
}: DateTimePickerProps) {
  if (!isVisible) return null;
  
  const handleDateChange = (
    selectedDate: Date | null,
    event?: React.SyntheticEvent<any> | undefined
  ) => {
    if (selectedDate) {
      onConfirm(selectedDate);
    }
  };
  
  return (
    <Modal visible={isVisible} transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ReactDatePicker
            selected={date}
            onChange={handleDateChange}
            showTimeSelect={mode === 'time'}
            showTimeSelectOnly={mode === 'time'}
            timeIntervals={15}
            dateFormat={mode === 'time' ? "h:mm aa" : "MM/dd/yyyy"}
            inline
          />
          <Button title="Cancel" onPress={onCancel} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '90%',
    maxWidth: 400
  }
});
