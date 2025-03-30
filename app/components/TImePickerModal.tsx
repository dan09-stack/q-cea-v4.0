import React, { useState, useEffect } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { CustomButton } from '@/components/ui/CustomButton';

interface TimePickerModalProps {
  selectedDay: string;
  scheduleData: any;
  updateTimeForSelectedDay: (
    startHour: number,
    startMinute: number,
    startPeriod: string,
    endHour: number,
    endMinute: number,
    endPeriod: string
  ) => void;
  closeModal: () => void;
}

const TimePickerModal: React.FC<TimePickerModalProps> = ({
  selectedDay,
  scheduleData,
  updateTimeForSelectedDay,
  closeModal,
}) => {
  // Parse the selected day and time frame (e.g., "monday-am")
  const [day, timeFrame] = selectedDay ? selectedDay.split('-') : ['', ''];
  
  // Safely access the schedule data with fallbacks
  const daySchedule = scheduleData[day as keyof typeof scheduleData] || { am: { start: '', end: '' }, pm: { start: '', end: '' } };
  const timeFrameData = daySchedule[timeFrame as 'am' | 'pm'] || { start: '', end: '' };
  
  // Parse existing time values or set defaults
  const parseTimeString = (timeString: string) => {
    if (!timeString) return { hour: 8, minute: 0, period: 'AM' };
    
    const match = timeString.match(/(\d+):(\d+)\s+(AM|PM)/i);
    if (match) {
      return {
        hour: parseInt(match[1], 10),
        minute: parseInt(match[2], 10),
        period: match[3].toUpperCase(),
      };
    }
    return { hour: 8, minute: 0, period: 'AM' };
  };
  
  const startTime = parseTimeString(timeFrameData.start);
  const endTime = parseTimeString(timeFrameData.end);
  
  // State for time picker values
  const [startHour, setStartHour] = useState(startTime.hour);
  const [startMinute, setStartMinute] = useState(startTime.minute);
  const [startPeriod, setStartPeriod] = useState(startTime.period);
  
  const [endHour, setEndHour] = useState(endTime.hour);
  const [endMinute, setEndMinute] = useState(endTime.minute);
  const [endPeriod, setEndPeriod] = useState(endTime.period);
  
  // Generate hour options (1-12)
  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  
  // Generate minute options (0-59)
  const minutes = Array.from({ length: 60 }, (_, i) => i);
  
  const handleSave = () => {
    updateTimeForSelectedDay(
      startHour,
      startMinute,
      startPeriod,
      endHour,
      endMinute,
      endPeriod
    );
    closeModal();
  };
  
  const handleClear = () => {
    updateTimeForSelectedDay(0, 0, 'AM', 0, 0, 'AM');
    closeModal();
  };
  
  return (
    <Modal
      visible={true}
      transparent={true}
      animationType="fade"
      onRequestClose={closeModal}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>
            Set {timeFrame.toUpperCase()} Time for {day.charAt(0).toUpperCase() + day.slice(1)}
          </Text>
          
          <View style={styles.timePickerContainer}>
            <View style={styles.timeSection}>
              <Text style={styles.timeLabel}>Start Time</Text>
              <View style={styles.pickerRow}>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={startHour}
                    onValueChange={(value) => setStartHour(value)}
                    style={styles.picker}
                  >
                    {hours.map((hour) => (
                      <Picker.Item key={`start-hour-${hour}`} label={hour.toString()} value={hour} />
                    ))}
                  </Picker>
                </View>
                
                <Text style={styles.pickerSeparator}>:</Text>
                
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={startMinute}
                    onValueChange={(value) => setStartMinute(value)}
                    style={styles.picker}
                  >
                    {minutes.map((minute) => (
                      <Picker.Item 
                        key={`start-minute-${minute}`} 
                        label={minute.toString().padStart(2, '0')} 
                        value={minute} 
                      />
                    ))}
                  </Picker>
                </View>
                
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={startPeriod}
                    onValueChange={(value) => setStartPeriod(value)}
                    style={styles.picker}
                  >
                    <Picker.Item label="AM" value="AM" />
                    <Picker.Item label="PM" value="PM" />
                  </Picker>
                </View>
              </View>
            </View>
            
            <View style={styles.timeSection}>
              <Text style={styles.timeLabel}>End Time</Text>
              <View style={styles.pickerRow}>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={endHour}
                    onValueChange={(value) => setEndHour(value)}
                    style={styles.picker}
                  >
                    {hours.map((hour) => (
                      <Picker.Item key={`end-hour-${hour}`} label={hour.toString()} value={hour} />
                    ))}
                  </Picker>
                </View>
                
                <Text style={styles.pickerSeparator}>:</Text>
                
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={endMinute}
                    onValueChange={(value) => setEndMinute(value)}
                    style={styles.picker}
                  >
                    {minutes.map((minute) => (
                      <Picker.Item 
                        key={`end-minute-${minute}`} 
                        label={minute.toString().padStart(2, '0')} 
                        value={minute} 
                      />
                    ))}
                  </Picker>
                </View>
                
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={endPeriod}
                    onValueChange={(value) => setEndPeriod(value)}
                    style={styles.picker}
                  >
                    <Picker.Item label="AM" value="AM" />
                    <Picker.Item label="PM" value="PM" />
                  </Picker>
                </View>
              </View>
            </View>
          </View>
          
          <View style={styles.buttonContainer}>
            <CustomButton title="Save" onPress={handleSave} color="#008000" />
            <CustomButton title="Clear" onPress={handleClear} color="#FF0000" />
            <CustomButton title="Cancel" onPress={closeModal} color="#333333" />
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
  modalView: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '90%',
    maxWidth: 500,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  timePickerContainer: {
    width: '100%',
  },
  timeSection: {
    marginBottom: 20,
  },
  timeLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerContainer: {
    width: 80,
    height: 150,
    marginHorizontal: 5,
  },
  picker: {
    height: 150,
  },
  pickerSeparator: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
  },
});

export default TimePickerModal;
