import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Alert, Switch } from 'react-native';
import { homeStyles as styles } from '@/constants/home.styles';
import { Ionicons } from '@expo/vector-icons';

interface StudentInfoSectionProps {
  isSmallScreen: boolean;
  ticketStudentData: {
    name: string;
    concern: string;
    program: string;
    otherConcern?: string;
    specificDetails?: string;
    proofOfPaymentImage?: string | null;
  };
  allTickets: string[];
  viewPaymentProof: () => void;
  handleTransferClick: () => void;
  handleNext: () => void;
}

export const StudentInfoSection: React.FC<StudentInfoSectionProps> = ({
  isSmallScreen,
  ticketStudentData,
  allTickets,
  viewPaymentProof,
  handleTransferClick,
  handleNext
}) => {
  const [countdown, setCountdown] = useState<number>(120); // 3 minutes = 180 seconds
  const [timerActive, setTimerActive] = useState<boolean>(false);
  const [timerEnabled, setTimerEnabled] = useState<boolean>(false); // Toggle for enabling/disabling timer
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<boolean>(false);

  // Start countdown when a new student ticket is loaded (only if timer is enabled)
  useEffect(() => {
    if (allTickets.length > 0 && ticketStudentData.name && timerEnabled) {

      setCountdown(120); 
      setTimerActive(true);
      timeoutRef.current = false; // Reset timeout flag
    } else {
      // No tickets, student data, or timer disabled - stop timer
      setTimerActive(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [ticketStudentData.name, allTickets, timerEnabled]);

  // Handle the countdown timer
  useEffect(() => {
    if (timerActive && timerEnabled) {
      timerRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            // Time's up
            clearInterval(timerRef.current!);
            handleNext();
            setTimerActive(false);
            timeoutRef.current = true; // Set flag instead of directly calling handleNext
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (!timerEnabled && timerRef.current) {
      // If timer is disabled while running, clear the interval
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timerActive, timerEnabled]);

  // Handle timeout in a separate effect to avoid render-phase updates
  useEffect(() => {
    if (timeoutRef.current) {
      timeoutRef.current = false; // Reset flag
      
      // Show alert after render is complete
      setTimeout(() => {
        Alert.alert(
          "Student Not Present",
          `${ticketStudentData.name} hasn't arrived after 3 minutes.`,
          [
            {
              text: "Wait Longer",
              onPress: () => {
                setCountdown(180); // Reset to 3 minutes
                setTimerActive(true);
              },
              style: "cancel"
            },
            { 
              text: "Transfer Student", 
              onPress: handleTransferClick 
            },
            {
              text: "Next Student",
              onPress: handleNext
            }
          ]
        );
      }, 0);
    }
  }, [countdown, ticketStudentData.name, handleTransferClick, handleNext]);

  // Format seconds to MM:SS
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  // Toggle timer function
  const toggleTimer = (value: boolean) => {
    setTimerEnabled(value);
    if (value && allTickets.length > 0 && ticketStudentData.name) {
      // If enabling timer and there's a student, start countdown
      setCountdown(180);
      setTimerActive(true);
    } else if (!value) {
      // If disabling timer, stop it
      setTimerActive(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  return (
    <View style={{
      flex: isSmallScreen ? undefined : 1,
      padding: 10,
      borderWidth: 1,
      borderColor: '#eee',
      borderRadius: 5
    }}>
      <Text style={[styles.boldText, {fontSize: 20, marginBottom: 15, textAlign: 'center'}]}>Student Information</Text>
      
      {/* Timer Toggle Switch */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginBottom: 10
      }}>
        <Text style={{marginRight: 8, fontSize: 16}}>Auto-Next Timer:</Text>
        <Switch
          value={timerEnabled}
          onValueChange={toggleTimer}
          trackColor={{ false: "#767577", true: "#81b0ff" }}
          thumbColor={timerEnabled ? "#0a7ea4" : "#f4f3f4"}
        />
      </View>
      
      {/* Countdown Timer */}
      {timerActive && timerEnabled && (
        <View style={{
          alignItems: 'center',
          marginBottom: 10,
          padding: 5,
          backgroundColor: countdown <= 30 ? '#ffebee' : '#e3f2fd', // Red background in last 30 seconds
          borderRadius: 5
        }}>
          <Text style={{
            fontSize: 16,
            fontWeight: 'bold',
            color: countdown <= 30 ? '#d32f2f' : '#1976d2'
          }}>
            Waiting for student: {formatTime(countdown)}
          </Text>
        </View>
      )}
      
      <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', }}>
        <Text style={[styles.boldText, {fontSize: 18}]}>Student Name:</Text>
        <Text style={[styles.details, {fontSize: 18}]}>{allTickets.length === 0 ? '' : ticketStudentData.name}</Text>
      </View>
            
      <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={[styles.boldText, {fontSize: 18}]}>Concern:</Text>
        <Text style={[styles.details, {fontSize: 18}]}>{allTickets.length === 0 ? '' : ticketStudentData.concern}</Text>
      </View>
      
      {/* Display Other Concern if available */}
      {ticketStudentData.otherConcern && (
        <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
          <Text style={[styles.boldText, {fontSize: 18}]}>Other Concern:</Text>
          <Text style={[styles.details, {fontSize: 18}]}>{allTickets.length === 0 ? '' : ticketStudentData.otherConcern}</Text>
        </View>
      )}
            
      {/* Display Specific Details if available */}
      {ticketStudentData.specificDetails && (
        <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={[styles.boldText, {fontSize: 18}]}>Specific Details:</Text>
          <Text style={[styles.details, {fontSize: 18}]}>{allTickets.length === 0 ? '' : ticketStudentData.specificDetails}</Text>
        </View>
      )}
      
      <View style={{marginTop: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 10}}>
        {/* Student Arrived Button */}
        {timerActive && timerEnabled && (
          <TouchableOpacity
            onPress={() => {
              setTimerActive(false);
              if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
              }
            }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#4caf50',
              paddingVertical: 8,
              paddingHorizontal: 15,
              borderRadius: 5
            }}
          >
            <Ionicons name="checkmark-circle" size={20} color="white" style={{marginRight: 8}} />
            <Text style={{color: 'white', fontWeight: 'bold'}}>Student Arrived</Text>
          </TouchableOpacity>
        )}
        
        {/* Payment Proof Button */}
        {ticketStudentData.proofOfPaymentImage && (
          <TouchableOpacity
            onPress={viewPaymentProof}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#0a7ea4',
              paddingVertical: 8,
              paddingHorizontal: 15,
              borderRadius: 5
            }}
          >
            <Ionicons name="document-text" size={20} color="white" style={{marginRight: 8}} />
            <Text style={{color: 'white', fontWeight: 'bold'}}>View Payment Proof</Text>
          </TouchableOpacity>
        )}
        
        {/* Transfer Student Button */}
        {allTickets.length > 0 && ticketStudentData.name && (
          <TouchableOpacity
            onPress={handleTransferClick}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#4a5568',
              paddingVertical: 8,
              paddingHorizontal: 15,
              borderRadius: 5
            }}
          >
            <Ionicons name="swap-horizontal" size={20} color="white" style={{marginRight: 8}} />
            <Text style={{color: 'white', fontWeight: 'bold'}}>Transfer Student</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};
