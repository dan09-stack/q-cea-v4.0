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
  handleNextNotArrived: () => void;
  handleAddCommentNotArrived: () => void; 
}

export const StudentInfoSection: React.FC<StudentInfoSectionProps> = ({
  isSmallScreen,
  ticketStudentData,
  allTickets,
  viewPaymentProof,
  handleTransferClick,
  handleNext,
  handleNextNotArrived,
  handleAddCommentNotArrived, 
}) => {
  const [countdown, setCountdown] = useState<number>(120); // 3 minutes = 180 seconds
  const [timerActive, setTimerActive] = useState<boolean>(false);
  const [timerEnabled, setTimerEnabled] = useState<boolean>(false); // Toggle for enabling/disabling timer
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<boolean>(false);

   // First useEffect - handles starting the timer
   useEffect(() => {
    if (allTickets.length > 0 && ticketStudentData.name && timerEnabled) {
      setCountdown(60); 
      setTimerActive(true);
      timeoutRef.current = false;
    } else {
      setTimerActive(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [ticketStudentData.name, allTickets, timerEnabled]);

  // Second useEffect - handles the countdown
  useEffect(() => {
    if (timerActive && timerEnabled) {
      timerRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setTimerActive(false);
            timeoutRef.current = true;
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (!timerEnabled && timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timerActive, timerEnabled]);

  // Third useEffect - handles when countdown reaches zero
  useEffect(() => {
    if (countdown === 0 && timeoutRef.current) {
      handleNextNotArrived();
      handleAddCommentNotArrived();
      timeoutRef.current = false;
    }
  }, [countdown, handleNextNotArrived, handleAddCommentNotArrived]);
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
      setCountdown(60);
      setTimerActive(true);
    } else if (!value) {
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
