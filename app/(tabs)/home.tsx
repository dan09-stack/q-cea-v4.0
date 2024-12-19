import { View, Text, TextInput, StyleSheet, Button, ActivityIndicator, Alert, ImageBackground, Modal, TouchableOpacity, Pressable } from 'react-native';
import React, { useEffect, useState } from 'react';
import { auth, db } from '@/firebaseConfig';
import { collection, doc, getDoc, getDocs, onSnapshot, updateDoc, query, where, orderBy, limit } from 'firebase/firestore';
import { homeStyles as styles } from '@/constants/home.styles';
export default function Home() {
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [selectedConcern, setSelectedConcern] = useState('');
  const [otherConcern, setOtherConcern] = useState('');
  const [isRequested, setIsRequested] = useState(false);
  const [ticketNumber, setTicketNumber] = useState('');
  const [userTicketNumber, setUserTicketNumber] = useState('');
  const [facultyList, setFacultyList] = useState<Array<{id: string, fullName: string, status: string}>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingRequest, setIsCheckingRequest] = useState(true);
  const [facultyModalVisible, setFacultyModalVisible] = useState(false);
  const [concernModalVisible, setConcernModalVisible] = useState(false);
  const [isTicketLoading, setIsTicketLoading] = useState(true);
  const [userType, setUserType] = useState('');
  const [currentStudent, setCurrentStudent] = useState({ name: '', concern: '' });
  const [allTickets, setAllTickets] = useState<string[]>([]);
  const [currentTicketIndex, setCurrentTicketIndex] = useState(0);
  const [currentQueue, setCurrentQueue] = useState(0);

  const handleBack = () => {
    setCurrentTicketIndex(prev => 
      prev > 0 ? prev - 1 : allTickets.length - 1
    );
  };
  
  const handleNext = () => {
    setCurrentTicketIndex(prev => 
      prev < allTickets.length - 1 ? prev + 1 : 0
    );
  };

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'student', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserType(userData.userType);
          setCurrentStudent(prevState => ({
            ...prevState,
            name: userData.fullName
          }));
        }

        // Query for waiting tickets
        const ticketsQuery = query(
          collection(db, 'student'),
        );

        // Listen for ticket updates
        const ticketsUnsubscribe = onSnapshot(
          query(
            collection(db, 'student'),
            where('faculty', '==', currentStudent.name),
            orderBy('userTicketNumber', 'asc'),
          ), 
          (snapshot) => {
            const tickets = snapshot.docs
              .filter(doc => doc.data().userTicketNumber)
              .map(doc => `CPE-${String(doc.data().userTicketNumber).padStart(4, '0')}`);
            setAllTickets(tickets);
            setCurrentQueue(tickets.length);
          }
        );

        // Listen for user's ticket status
        const userRef = doc(db, 'student', user.uid);
        const userUnsubscribe = onSnapshot(userRef, (doc) => {
          if (doc.exists()) {
            const userData = doc.data();
              setIsRequested(true);
              setUserTicketNumber(userData.userTicketNumber);
           
          }
          setIsTicketLoading(false);
          setIsCheckingRequest(false);  
        });

        // Get faculty list
        const facultyCollectionRef = collection(db, 'student');
        const facultyUnsubscribe = onSnapshot(facultyCollectionRef, (snapshot) => {
          const faculty = snapshot.docs
            .filter(doc => doc.data().userType === 'FACULTY')
            .map(doc => ({
              id: doc.id,
              fullName: doc.data().fullName || '',
              status: doc.data().status || 'OFFLINE'
            }));
          setFacultyList(faculty);
        });

        // Track ticket counter
        const ticketRef = doc(db, 'ticketNumberCounter', 'ticket');
        const ticketUnsubscribe = onSnapshot(ticketRef, (doc) => {
          if (doc.exists()) {
            setTicketNumber(doc.data().ticketNum);
          }
        });

        return () => {
          userUnsubscribe();
          facultyUnsubscribe();
          ticketUnsubscribe();
          ticketsUnsubscribe();
        };
      } else {
        setIsCheckingRequest(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const handleRequest = async () => {
    if (!selectedFaculty) {
      Alert.alert('Error', 'Please select a faculty');
      return;
    }
  
    if (!selectedConcern && !otherConcern) {
      Alert.alert('Error', 'Please select a concern or provide details in Other field');
      return;
    }
  
    setIsLoading(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }
  
      const ticketRef = doc(db, 'ticketNumberCounter', 'ticket');
      const ticketSnap = await getDoc(ticketRef);
      
      if (ticketSnap.exists()) {
        const currentNumber = ticketSnap.data().ticketNum;
        const newNumber = currentNumber + 1;
        
        await updateDoc(ticketRef, {
          ticketNum: newNumber
        });
  
        const userRef = doc(db, 'student', currentUser.uid);
        await updateDoc(userRef, {
          userTicketNumber: newNumber,
          faculty: selectedFaculty,
          concern: selectedConcern,
          otherConcern: otherConcern,
          requestDate: new Date(),
          status: 'waiting'
        });
        
        setTicketNumber(newNumber);
        setIsRequested(true);
      }
    } catch (error) {
      console.log('Error updating ticket number:', error);
      Alert.alert('Error', 'Failed to create ticket request');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const userRef = doc(db, 'student', currentUser.uid);
        await updateDoc(userRef, {
          status: 'cancelled',
          userTicketNumber: null
        });
      }
      setIsRequested(false);
    } catch (error) {
      console.error('Error cancelling ticket:', error);
      Alert.alert('Error', 'Failed to cancel ticket');
    }
  };

  return (
    <ImageBackground
      source={require('../../assets/images/green.png')}
      style={styles.background}
    >
      {userType === 'FACULTY' ? (
        <View style={styles.container}>
          <View style={styles.ticketBox}>
            <Text style={styles.queueText}>
              <Text style={styles.boldText}>Student in line:</Text> 10
            </Text>
            <Text style={styles.ticketNumber}>STUDENT TICKET NUMBER</Text>
                        {allTickets.length > 0 && (
                        <Text style={styles.ticketCode}>
                              {allTickets[currentTicketIndex]}
                        </Text>
                      )}

            <Text style={styles.boldText}>Student Name</Text>
            <Text style={styles.details}>{currentStudent.name}</Text>
            <Text style={styles.boldText}>Concern</Text> 
            <Text style={styles.details}>{currentStudent.concern}</Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.button} onPress={handleBack}>
                <Text style={styles.buttonText}>BACK</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={handleNext}>
                <Text style={styles.buttonText}>NEXT</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>) : (
        <View style={styles.container}>
          {isCheckingRequest ? (
            <ActivityIndicator size="large" color="#004000" />
          ) : (
            isRequested ? (
              <View style={styles.ticketContainer}>
                <Text style={styles.headerText}>{ticketNumber}</Text>
                <Text style={styles.subHeaderText}>People in front of you: 2</Text>
                <View style={styles.ticketDetails}>
                  <Text style={styles.ticketLabel}>YOUR TICKET NUMBER</Text>
                  <Text style={styles.ticketNumber}>{`CPE-${String(userTicketNumber).padStart(4, '0')}`}</Text>
                  <View style={styles.ticketInfoContainer}>
                    <View>
                      <Text style={styles.ticketLabel}>NEXT SERVING</Text>
                      <Text style={styles.ticketInfo}>ECE-0009</Text>
                    </View>
                    <View>
                      <Text style={styles.ticketLabel}>NOW SERVING</Text>
                      <Text style={styles.ticketInfo}>ARC-0008</Text>
                    </View>
                  </View>
                  <Text style={styles.waitText}>PLEASE WAIT</Text>
                </View>
                <View style={styles.buttonContainer}>
                  <Button title="Cancel" onPress={handleCancel} color="#004000" />
                </View>
              </View>
            ) : (
              <View style={styles.formGroup}>
                <TouchableOpacity 
                  style={styles.pickerButton}
                  onPress={() => setFacultyModalVisible(true)}
                >
                  <Text style={styles.pickerButtonText}>
                    {selectedFaculty || "Select Faculty"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.pickerButton}
                  onPress={() => setConcernModalVisible(true)}
                >
                  <Text style={styles.pickerButtonText}>
                    {selectedConcern || "Select your concern"}
                  </Text>
                </TouchableOpacity>

                <TextInput
                  style={styles.input}
                  placeholder="Other concern:"
                  placeholderTextColor="#cccccc"
                  value={otherConcern}
                  onChangeText={(text) => setOtherConcern(text)}
                />
                <View style={styles.buttonContainer}>
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#004000" />
                  ) : (
                    <Button 
                      title="Request" 
                      onPress={handleRequest} 
                      color="#004000"
                      disabled={isLoading}
                    />
                  )}
                </View>

                <Modal
                  animationType="slide"
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
                  animationType="slide"
                  transparent={true}
                  visible={concernModalVisible}
                  onRequestClose={() => setConcernModalVisible(false)}
                >
                  <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                      <Text style={styles.modalTitle}>Select Concern</Text>
                      <Pressable
                        style={styles.modalItem}
                        onPress={() => {
                          setSelectedConcern('concernA');
                          setConcernModalVisible(false);
                        }}
                      >
                        <Text style={styles.modalItemText}>Concern A</Text>
                      </Pressable>
                      <Pressable
                        style={styles.modalItem}
                        onPress={() => {
                          setSelectedConcern('concernB');
                          setConcernModalVisible(false);
                        }}
                      >
                        <Text style={styles.modalItemText}>Concern B</Text>
                      </Pressable>
                      <Button title="Close" onPress={() => setConcernModalVisible(false)} color="#004000" />
                    </View>
                  </View>
                </Modal>
              </View>
            )
          )}
        </View>
      )}
    </ImageBackground>
  );
}

