import React, { useState } from 'react';
import { View, Text, Modal, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { CustomButton } from '@/components/ui/CustomButton';
import { useTheme } from '@/contexts/ThemeContext';

interface ScheduleData {
  monday: { 
    am: { start: string; end: string }; 
    pm: { start: string; end: string }; 
  };
  tuesday: { 
    am: { start: string; end: string }; 
    pm: { start: string; end: string }; 
  };
  wednesday: { 
    am: { start: string; end: string }; 
    pm: { start: string; end: string }; 
  };
  thursday: { 
    am: { start: string; end: string }; 
    pm: { start: string; end: string }; 
  };
  friday: { 
    am: { start: string; end: string }; 
    pm: { start: string; end: string }; 
  };
  saturday: { 
    am: { start: string; end: string }; 
    pm: { start: string; end: string }; 
  };
}

interface TimePickerModalProps {
  selectedDay: string; // Format: "day-timeframe" (e.g., "monday-am")
  scheduleData: ScheduleData;
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
  const { colors } = useTheme();

  // Parse the day and timeframe from the selectedDay string
  const [day, timeFrame] = selectedDay.split('-');
  
  // Get the existing time for the selected day and timeframe
  const existingStartTime = scheduleData[day as keyof typeof scheduleData][timeFrame as 'am' | 'pm'].start;
  const existingEndTime = scheduleData[day as keyof typeof scheduleData][timeFrame as 'am' | 'pm'].end;

  const [startHour, setStartHour] = useState<number>(
    existingStartTime ? parseInt(existingStartTime.split(':')[0], 10) : 12
  );
  
  const [startMinute, setStartMinute] = useState<number>(
    existingStartTime ? parseInt(existingStartTime.split(':')[1]?.split(' ')[0] || '0', 10) : 0
  );
  
  const [startPeriod, setStartPeriod] = useState<string>(
    existingStartTime ? existingStartTime.split(' ')[1] || 'AM' : timeFrame === 'am' ? 'AM' : 'PM'
  );
  
  const [endHour, setEndHour] = useState<number>(
    existingEndTime ? parseInt(existingEndTime.split(':')[0] || '12', 10) : 12
  );
  
  const [endMinute, setEndMinute] = useState<number>(
    existingEndTime ? parseInt(existingEndTime.split(':')[1]?.split(' ')[0] || '0', 10) : 0
  );
  
  const [endPeriod, setEndPeriod] = useState<string>(
    existingEndTime ? existingEndTime.split(' ')[1] || 'AM' : timeFrame === 'am' ? 'AM' : 'PM'
  );

  // Format the display name for the selected day and time frame
  const displayName = `${day.charAt(0).toUpperCase() + day.slice(1)} ${timeFrame.toUpperCase()}`;

  return (
    <Modal transparent={true} visible={!!selectedDay} animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalView, { backgroundColor: colors.backgroundColor }]}>
          <Text style={[styles.modalTitle, { color: colors.textColor }]}>Set Time for {displayName}</Text>

          {/* Start Time Picker */}
          <View style={styles.timePickerContainer}>
            <Text style={[styles.timeLabel, { color: colors.textColor }]}>Start Time</Text>
            <View style={styles.timePickerGroup}>
              <Text style={[styles.timeLabel, { color: colors.textColor }]}>HH</Text>
              <Picker
                style={[styles.timePicker, { backgroundColor: colors.backgroundColor, color: colors.textColor }]}
                selectedValue={startHour}
                onValueChange={(value: number) => setStartHour(value)}
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <Picker.Item key={i} label={String(i + 1).padStart(2, '0')} value={i + 1} />
                ))}
              </Picker>
            </View>

            <Text style={[styles.separator, { color: colors.textColor }]}>:</Text>

            <View style={styles.timePickerGroup}>
              <Text style={[styles.timeLabel, { color: colors.textColor }]}>MM</Text>
              <Picker
                style={[styles.timePicker, { backgroundColor: colors.backgroundColor, color: colors.textColor }]}
                selectedValue={startMinute}
                onValueChange={(value: number) => setStartMinute(value)}
              >
                {Array.from({ length: 60 }, (_, i) => (
                  <Picker.Item key={i} label={String(i).padStart(2, '0')} value={i} />
                ))}
              </Picker>
            </View>

            <View style={styles.timePickerGroup}>
              <Text style={[styles.timeLabel, { color: colors.textColor }]}>Period</Text>
              <Picker
                style={[styles.periodPicker, { backgroundColor: colors.backgroundColor, color: colors.textColor }]}
                selectedValue={startPeriod}
                onValueChange={(value: string) => setStartPeriod(value)}
              >
                <Picker.Item label="AM" value="AM" />
                <Picker.Item label="PM" value="PM" />
              </Picker>
            </View>
          </View>

          {/* End Time Picker */}
          <View style={styles.timePickerContainer}>
            <Text style={[styles.timeLabel, { color: colors.textColor }]}>End Time</Text>
            <View style={styles.timePickerGroup}>
              <Text style={[styles.timeLabel, { color: colors.textColor }]}>HH</Text>
              <Picker
                style={[styles.timePicker, { backgroundColor: colors.backgroundColor, color: colors.textColor }]}
                selectedValue={endHour}
                onValueChange={(value: number) => setEndHour(value)}
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <Picker.Item key={i} label={String(i + 1).padStart(2, '0')} value={i + 1} />
                ))}
              </Picker>
            </View>

            <Text style={[styles.separator, { color: colors.textColor }]}>:</Text>

            <View style={styles.timePickerGroup}>
              <Text style={[styles.timeLabel, { color: colors.textColor }]}>MM</Text>
              <Picker
                style={[styles.timePicker, { backgroundColor: colors.backgroundColor, color: colors.textColor }]}
                selectedValue={endMinute}
                onValueChange={(value: number) => setEndMinute(value)}
              >
                {Array.from({ length: 60 }, (_, i) => (
                  <Picker.Item key={i} label={String(i).padStart(2, '0')} value={i} />
                ))}
              </Picker>
            </View>

            <View style={styles.timePickerGroup}>
              <Text style={[styles.timeLabel, { color: colors.textColor }]}>Period</Text>
              <Picker
                style={[styles.periodPicker, { backgroundColor: colors.backgroundColor, color: colors.textColor }]}
                selectedValue={endPeriod}
                onValueChange={(value: string) => setEndPeriod(value)}
              >
                <Picker.Item label="AM" value="AM" />
                <Picker.Item label="PM" value="PM" />
              </Picker>
            </View>
          </View>

          {/* Save and Close Buttons */}
          <View style={styles.buttonContainer}>
            <CustomButton
              title="Save"
              onPress={() => {
                updateTimeForSelectedDay(startHour, startMinute, startPeriod, endHour, endMinute, endPeriod);
                closeModal();
              }}
              color={colors.accentColor}
            />
            <CustomButton
              title="Close"
              onPress={closeModal}
              color="#045657"
            />
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
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  timePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  timePickerGroup: {
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 14,
    marginBottom: 5,
  },
  timePicker: {
    width: 60,
    height: 50,
  },
  periodPicker: {
    width: 60,
    height: 50,
  },
  separator: {
    fontSize: 20,
    marginHorizontal: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    width: '100%',
  },
});

export default TimePickerModal;
