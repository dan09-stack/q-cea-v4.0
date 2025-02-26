import React from 'react';
import { View, Text } from 'react-native';
import { homeStyles as styles } from '@/constants/home.styles';
import { CustomButton } from '@/components/ui/CustomButton';

interface FacultyViewProps {
  allTickets: string[];
  currentTicketIndex: number;
  ticketStudentData: { name: string; concern: string; program: string };
  handleBack: () => void;
  handleNext: () => void;
}

export const FacultyView = ({ 
  allTickets, 
  currentTicketIndex, 
  ticketStudentData, 
  handleBack, 
  handleNext 
}: FacultyViewProps) => (
  <View style={[styles.container, {width: '100%', maxWidth: 500}]}>
    <View style={[styles.ticketBox,{width: '100%'}]}>
      <Text style={styles.queueText}>
        <Text style={styles.boldText}>Students in line:</Text> 
        <Text style={styles.ticketInfo}>
          {allTickets.length > 0 ? 
            ` ${(allTickets.length - (currentTicketIndex + 1)) < 0 ? 0 : allTickets.length - (currentTicketIndex + 1)}` 
            : ' No tickets in line'}
        </Text>
      </Text>
      <Text style={[styles.ticketNumber, {color:'#d9ab0e', fontSize: 22}]}>STUDENT TICKET NUMBER</Text>
      {allTickets.length === 0 ? (
        <View style={[styles.notificationContainer, { alignItems: 'center', padding: 10, backgroundColor: '#f8d7da', borderRadius: 5, margin: 10 }]}>
          <Text style={[styles.ticketCode, { color: '#721c24', fontSize: 16 }]}>
            No tickets in queue
          </Text>
        </View>
      ) : allTickets[currentTicketIndex] ? (
        <Text style={[styles.ticketCode, {color: '#07643d', fontSize: 30}]}>
          {ticketStudentData.program}-{allTickets[currentTicketIndex]}
        </Text>
      ) : (
        <View style={[styles.notificationContainer, { alignItems: 'center', padding: 10, backgroundColor: '#f8d7da', borderRadius: 5, margin: 10 }]}>
          <Text style={[styles.ticketCode, { color: '#721c24', fontSize: 16 }]}>
            Ticket Number has been cancelled by student. 
          </Text>
        </View>
      )}
      <Text style={[styles.boldText, {fontSize: 18}]}>Student Name</Text>
      <Text style={[styles.details, {fontSize: 20}]}>{allTickets.length === 0 ? 'No students in queue' : ticketStudentData.name}</Text>
      <Text style={[styles.boldText, {fontSize: 18 , marginTop: 20}]}>Concern</Text>
      <Text style={[styles.details, {fontSize: 20}]}>{allTickets.length === 0 ? 'No concerns to display' : ticketStudentData.concern}</Text>
      <View style={styles.buttonContainer}>
        <CustomButton title="BACK" onPress={handleBack} color="white" disabled={currentTicketIndex === 0} />
        <CustomButton title="NEXT" onPress={handleNext} />
      </View>
    </View>
  </View>
);
