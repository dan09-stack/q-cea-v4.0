import React from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, Modal, Button, Pressable, TextInput } from 'react-native';
import { homeStyles as styles } from '@/constants/home.styles';
import { CustomButton } from '@/components/ui/CustomButton';

interface StudentViewProps {
  isCheckingRequest: boolean;
  isRequested: boolean;
  peopleAhead: number;
  userProgram: string;
  userTicketNumber: string | number;
  nextDisplayedProgram: string;
  nextDisplayedTicket: string;
  currentDisplayedProgram: string;
  currentDisplayedTicket: string;
  selectedFaculty: string;
  selectedConcern: string;
  otherConcern: string;
  specificDetails: string; // New property for "Other" concern input
  isLoading: boolean;
  facultyList: Array<{id: string, fullName: string, status: string}>;
  concernsList: string[];
  facultyModalVisible: boolean;
  concernModalVisible: boolean;
  handleDone: () => void;
  handleCancel: () => void;
  handleRequest: () => void;
  setFacultyModalVisible: (visible: boolean) => void;
  setConcernModalVisible: (visible: boolean) => void;
  setSelectedFaculty: (faculty: string) => void;
  setSelectedConcern: (concern: string) => void;
  setOtherConcern: (concern: string) => void;
  setSpecificDetails: (details: string) => void; // New setter for "Other" concern input
}

export const StudentView = ({
  isCheckingRequest,
  isRequested,
  peopleAhead,
  userProgram,
  userTicketNumber,
  nextDisplayedProgram,
  nextDisplayedTicket,
  currentDisplayedProgram,
  currentDisplayedTicket,
  selectedFaculty,
  selectedConcern,
  otherConcern,
 specificDetails,
  isLoading,
  facultyList,
  concernsList,
  facultyModalVisible,
  concernModalVisible,
  handleDone,
  handleCancel,
  handleRequest,
  setFacultyModalVisible,
  setConcernModalVisible,
  setSelectedFaculty,
  setSelectedConcern,
  setOtherConcern,
  setSpecificDetails
}: StudentViewProps) => (
  <View style={[styles.container, {width: '100%' , maxWidth: 600}]}>
    {isCheckingRequest ? (
      <ActivityIndicator size="large" color="#004000" />
    ) : (
      isRequested ? (
        <View style={[styles.ticketContainer, {width: '100%'}]}>
          <Text style={[styles.subHeaderText, {fontWeight: 'bold'}]}>
            People in front of you: {peopleAhead}
          </Text>
          <View style={styles.ticketDetails}>
            <Text style={[styles.ticketLabel, { color: '#d9ab0e' , fontWeight: 'bold' , fontSize: 22}]}>YOUR TICKET NUMBER</Text>
            <Text style={[styles.ticketNumber, { fontSize: 25 , marginBottom: 20}]}>{`${userProgram}-${String(userTicketNumber).padStart(4, '0')}`}</Text>
            <View style={styles.ticketInfoContainer}>
              <View>
                <Text style={[styles.ticketLabel, { color: '#000000' , fontWeight: 'bold', fontSize: 16 }]}>NEXT SERVING</Text>
                <Text style={[styles.ticketInfo, {fontSize: 20}]}>
                  {nextDisplayedTicket ? 
                    `${nextDisplayedProgram ? `${nextDisplayedProgram}-` : ''}${String(nextDisplayedTicket).padStart(4, '0')}` 
                    : 'No Next Ticket'}
                </Text>
              </View>
              <View>
                <Text style={[styles.ticketLabel, { color: '#000000' , fontWeight: 'bold', fontSize: 16 }]}>NOW SERVING</Text>
                <Text style={[styles.ticketInfo, {fontSize: 20}]}>
                  {currentDisplayedTicket && currentDisplayedProgram ? 
                    `${currentDisplayedProgram}-${String(currentDisplayedTicket).padStart(4, '0')}` 
                    : '-'}
                </Text>
              </View>
            </View>
            <Text style={[styles.waitText,{ marginTop: 30 , marginBottom: -10 , fontSize: 23}]}>
              {userTicketNumber === currentDisplayedTicket
                ? "YOUR TURN"
                : userTicketNumber < currentDisplayedTicket
                ? ""
                : "PLEASE WAIT"
              }
            </Text>
          </View>
          <View style={styles.buttonContainer}>
            <CustomButton 
              title={userTicketNumber <= currentDisplayedTicket || currentDisplayedTicket === null ? "DONE" : "CANCEL"} 
              onPress={userTicketNumber <= currentDisplayedTicket || currentDisplayedTicket === null ? handleDone : handleCancel} 
              color={userTicketNumber <= currentDisplayedTicket || currentDisplayedTicket === null ? "#004000" : "#c8c4c4"} 
            />
          </View>
        </View>
      ) : (
        <View style={[styles.formGroup, {width: '100%'}]}>
          <Text style= {{fontSize: 16, fontWeight: 'bold' }}>Faculty</Text>
          <TouchableOpacity 
            style={styles.pickerButton}
            onPress={() => setFacultyModalVisible(true)}
          >
            <Text style={styles.pickerButtonText}>
              {selectedFaculty || "Select Faculty"}
            </Text>
          </TouchableOpacity> 
          <Text style= {{fontSize: 16, fontWeight: 'bold'}}>Concern</Text>
          <TouchableOpacity 
            style={styles.pickerButton}
            onPress={() => setConcernModalVisible(true)}
          >
            <Text style={styles.pickerButtonText}>
              {selectedConcern || "Select your concern"}
            </Text>
          </TouchableOpacity>
          
          {/* Special input field for "Other" concern */}
          {selectedConcern === "Other" && (
            <View>
              <Text style={{fontSize: 16, fontWeight: 'bold', marginTop: 10}}>Please specify your concern</Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: '#ccc',
                  borderRadius: 5,
                  padding: 10,
                  marginTop: 5,
                  backgroundColor: '#fff'
                }}
                placeholder="Enter your specific concern..."
                value={otherConcern}
                onChangeText={setOtherConcern}
              />
            </View>
          )}
          
          {/* General details field for all concerns */}
          <Text style={{fontSize: 16, fontWeight: 'bold', marginTop: 10}}>Specific Details</Text>
          <TextInput
            style={{
              borderWidth: 1,
              borderColor: '#ccc',
              borderRadius: 5,
              padding: 10,
              marginTop: 5,
              height: 100,
              textAlignVertical: 'top',
              backgroundColor: '#fff'
            }}
            placeholder="Please enter the specific details of your concern..."
            multiline={true}
            numberOfLines={4}
            value={specificDetails}
            onChangeText={setSpecificDetails}
          />
          
          <View style= {{marginTop: 15}}></View>
          <View style={styles.buttonContainer}>
            {isLoading ? (
              <ActivityIndicator size="large" color="#004000" />
            ) : (
              <CustomButton title="REQUEST" onPress={handleRequest} />
            )}
          </View>

          <Modal
            animationType="fade"
            transparent={true}
            visible={facultyModalVisible}
            onRequestClose={() => setFacultyModalVisible(false)}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Select Faculty</Text>
                {facultyList
                  .sort((a, b) => a.fullName.localeCompare(b.fullName))
                  .map((faculty) => (
                    <Pressable
                      key={faculty.id}
                      style={styles.modalItem}
                      onPress={() => {
                        setSelectedFaculty(faculty.fullName);
                        setFacultyModalVisible(false);
                      }}
                    >
                      <Text style={[
                        styles.modalItemText,
                        { color: faculty.status === 'ONLINE' ? '#4CAF50' : '#757575' }
                      ]}>
                        {faculty.fullName}
                      </Text>
                    </Pressable>
                  ))}
                <Button title="Close" onPress={() => setFacultyModalVisible(false)} color="#004000" />
              </View>
            </View>
          </Modal>

          <Modal
            animationType="fade"
            transparent={true}
            visible={concernModalVisible}
            onRequestClose={() => setConcernModalVisible(false)}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Select Concern</Text>
                {concernsList.map((concern) => (
                  <Pressable
                    key={concern}
                    style={styles.modalItem}
                    onPress={() => {
                      setSelectedConcern(concern);
                      setConcernModalVisible(false);
                    }}
                  >
                    <Text style={styles.modalItemText}>{concern}</Text>
                  </Pressable>
                ))}
                <Button title="Close" onPress={() => setConcernModalVisible(false)} color="#004000" />
              </View>
            </View>
          </Modal>
        </View>
      )
    )}
  </View>
);
