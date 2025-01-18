import { View, Text, TextInput, StyleSheet, Button, ActivityIndicator, Alert, ImageBackground, Modal, TouchableOpacity, Pressable, Platform } from 'react-native';
import React, { useEffect, useState } from 'react';
import { auth, db } from '@/firebaseConfig';
import { collection, doc, getDoc, getDocs, onSnapshot, updateDoc, query, where, orderBy, limit } from 'firebase/firestore';
import { homeStyles as styles } from '@/constants/home.styles';
import { CustomButton } from '@/components/ui/CustomButton';
import { setDoc } from 'firebase/firestore';
export default function Home() {
  
  // Add this state at the top with other states
const [nextDisplayedTicket, setNextDisplayedTicket] = useState('');
const [nextDisplayedProgram, setNextDisplayedProgram] = useState('');
// User related states
const [userType, setUserType] = useState('');
const [currentStudent, setCurrentStudent] = useState({ name: '', concern: '', faculty: '' });

// Queue and ticket states
const [ticketNumber, setTicketNumber] = useState('');
const [userTicketNumber, setUserTicketNumber] = useState('');
const [userProgram, setUserProgram] = useState('');
const [allTickets, setAllTickets] = useState<string[]>([]);
const [currentTicketIndex, setCurrentTicketIndex] = useState(0);
const [currentQueue, setCurrentQueue] = useState(0);
const [servingTickets, setServingTickets] = useState<string[]>([]);
const [currentDisplayedTicket, setCurrentDisplayedTicket] = useState('');
const [currentDisplayedProgram, setCurrentDisplayedProgram] = useState('');

// Form states
const [selectedFaculty, setSelectedFaculty] = useState('');
const [selectedConcern, setSelectedConcern] = useState('');
const [otherConcern, setOtherConcern] = useState('');

// UI states
const [isRequested, setIsRequested] = useState(false);
const [isLoading, setIsLoading] = useState(false);
const [isCheckingRequest, setIsCheckingRequest] = useState(true);
const [isTicketLoading, setIsTicketLoading] = useState(true);
const [facultyModalVisible, setFacultyModalVisible] = useState(false);
const [concernModalVisible, setConcernModalVisible] = useState(false);

// Data states
const [facultyList, setFacultyList] = useState<Array<{id: string, fullName: string, status: string}>>([]);
const [ticketStudentData, setTicketStudentData] = useState({ name: '', concern: '', program:'',email:'' });


// Add this effect to track next ticket
useEffect(() => {
  const facultyQuery = query(
    collection(db, 'student'),
    where('faculty', '==', currentStudent.faculty),
    where('userTicketNumber', '>', currentDisplayedTicket),
    orderBy('userTicketNumber', 'asc'),
    limit(1)
  );

  const unsubscribe = onSnapshot(facultyQuery, (snapshot) => {
    if (!snapshot.empty) {
      const nextTicket = snapshot.docs[0].data();
      setNextDisplayedTicket(nextTicket.userTicketNumber);
      setNextDisplayedProgram(nextTicket.program);
    } else {
      setNextDisplayedTicket('');
      setNextDisplayedProgram('');
    }
  });

  return () => unsubscribe();
}, [currentDisplayedTicket, currentStudent.faculty]);




useEffect(() => {
  const currentUser = auth.currentUser;
  if (currentUser) {
    const userRef = doc(db, 'student', currentUser.uid);
    const unsubscribe = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        const userData = doc.data();
        setCurrentStudent(prevState => ({
          ...prevState,
          faculty: userData.faculty,
        }));
      }
    });

    return () => unsubscribe();
  }
}, []);

useEffect(() => {
  const storeAllTickets = async () => {
    try {
      const allTicketsRef = doc(db, 'allTicketNumber', 'tickets');
      await updateDoc(allTicketsRef, {
        tickets: allTickets,
        lastUpdated: new Date()
      });
    } catch (error) {
      // If document doesn't exist, create it
      const allTicketsRef = doc(db, 'allTicketNumber', 'tickets');
      await setDoc(allTicketsRef, {
        tickets: allTickets,
        lastUpdated: new Date()
      });
    }
  };

  if (allTickets.length > 0) {
    storeAllTickets();
  }
}, [allTickets]);
// Authentication and user data effect
useEffect(() => {
  const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
    if (user) {
      const userDoc = await getDoc(doc(db, 'student', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserType(userData.userType);
        setCurrentStudent(prevState => ({
          ...prevState,
          name: userData.fullName,
          faculty: userData.faculty
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
            .map(doc => `${String(doc.data().userTicketNumber).padStart(4, '0')}`);
           
          setAllTickets(tickets);
          setCurrentQueue(tickets.length);
        }
      );
      
      

      // Listen for user's ticket status
      const userRef = doc(db, 'student', user.uid);
      const userUnsubscribe = onSnapshot(userRef, (doc) => {
        if (doc.exists()) {
          const userData = doc.data();
          // Only set isRequested to true if status is not cancelled and there's a ticket number
          setIsRequested(userData.status !== 'cancelled' && userData.userTicketNumber != null);
          setUserTicketNumber(userData.userTicketNumber);
          setUserProgram(userData.program);
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
useEffect(() => {
  const fetchStudentData = async () => {
    if (allTickets[currentTicketIndex]) {
      const studentQuery = query(
        collection(db, 'student'),
        where('userTicketNumber', '==', parseInt(allTickets[currentTicketIndex].replace('CPE-', '')))
      );
      const querySnapshot = await getDocs(studentQuery);
      if (!querySnapshot.empty) {
        const studentData = querySnapshot.docs[0].data();
        setTicketStudentData({
          name: studentData.fullName,
          concern: studentData.concern || studentData.otherConcern,
          program: studentData.program,
          email: studentData.email
        });
      }
    }
  };
  fetchStudentData();
  
  
  
}, [currentTicketIndex, allTickets]);
useEffect(() => {
  const loadSavedIndex = async () => {
    const currentUser = auth.currentUser;
    if (currentUser && userType === 'FACULTY') {
      const userDoc = await getDoc(doc(db, 'student', currentUser.uid));
      if (userDoc.exists() && userDoc.data().currentTicketIndex !== undefined) {
        setCurrentTicketIndex(userDoc.data().currentTicketIndex);
      }
    }
  };
  loadSavedIndex();
}, [userType]);
useEffect(() => {
  if (currentStudent.name) {
    const ticketsUnsubscribe = onSnapshot(
      query(
        collection(db, 'student'),
        where('faculty', '==', currentStudent.name),
        orderBy('userTicketNumber', 'asc'),
      ), 
      (snapshot) => {
        const tickets = snapshot.docs
          .filter(doc => doc.data().userTicketNumber)
          .map(doc => `${String(doc.data().userTicketNumber).padStart(4, '0')}`);
        setAllTickets(tickets);
        setCurrentQueue(tickets.length);
      }
    );

    return () => ticketsUnsubscribe();
  }
}, [currentStudent.name]);

// Ticket display effects
useEffect(() => {
  const facultyQuery = query(
    collection(db, 'student'),
    where('userType', '==', 'FACULTY'),
    where('fullName', '==', currentStudent.faculty)
  );

  const unsubscribe = onSnapshot(facultyQuery, async (snapshot) => {
    for (const doc of snapshot.docs) {
      if (doc.data().displayedTicket) {
        const displayedTicket = doc.data().displayedTicket;
        setCurrentDisplayedTicket(displayedTicket);
        
        // Fetch student program for the displayed ticket
        const studentQuery = query(
          collection(db, 'student'),
          where('userTicketNumber', '==', displayedTicket)
        );
        const studentSnapshot = await getDocs(studentQuery);
        if (!studentSnapshot.empty) {
          setCurrentDisplayedProgram(studentSnapshot.docs[0].data().program);
        }
      }
    }
  });

  return () => unsubscribe();
}, [currentStudent.faculty]);


// Student data effects
useEffect(() => {
  if (allTickets[currentTicketIndex]) {
    const fetchStudentData = async () => {
      const studentQuery = query(
        collection(db, 'student'),
        where('userTicketNumber', '==', parseInt(allTickets[currentTicketIndex].replace('CPE-', '')))
      );
      const querySnapshot = await getDocs(studentQuery);
      if (!querySnapshot.empty) {
        const studentData = querySnapshot.docs[0].data();
        setTicketStudentData({
          name: studentData.fullName,
          concern: studentData.concern || studentData.otherConcern,
          program: studentData.program,
          email: studentData.email
        });

        // Save displayed ticket number as integer
        const currentUser = auth.currentUser;
        if (currentUser && userType === 'FACULTY') {
          const userRef = doc(db, 'student', currentUser.uid);
          const numberOnly = parseInt(allTickets[currentTicketIndex].replace('CPE-', ''));
          await updateDoc(userRef, {
            displayedTicket: numberOnly,
          });
        }
      }
    };
    fetchStudentData();
  }
}, [currentTicketIndex, allTickets]);

// Queue control handlers
const handleNext = async () => {
  if (allTickets.length === 0) {
    showAlert('No ticket on queue');
    return;
  }

  const newIndex = currentTicketIndex < allTickets.length - 1 ? currentTicketIndex + 1 : currentTicketIndex;
  
  if (newIndex === currentTicketIndex && currentTicketIndex === allTickets.length - 1) {
    showAlert('No ticket on queue');
    return;
  }

  const ticketToSave = allTickets[newIndex];
  const numberOnly = parseInt(ticketToSave.replace('CPE-', ''));
  
  const currentUser = auth.currentUser;
  if (currentUser && userType === 'FACULTY' && ticketToSave) {
    const userRef = doc(db, 'student', currentUser.uid);
    await updateDoc(userRef, {
      displayedTicket: numberOnly,
    });
  }
  
  setCurrentTicketIndex(newIndex);
  await updateFacultyTicketIndex(newIndex);
};
const handleBack = async () => {
  if (currentTicketIndex === 0) return;
  const newIndex = currentTicketIndex > 0 ? currentTicketIndex - 1 : allTickets.length - 1;
  
  const ticketToSave = allTickets[newIndex];
  const numberOnly = parseInt(ticketToSave.replace('CPE-', ''));
  
  const currentUser = auth.currentUser;
  if (currentUser && userType === 'FACULTY' && ticketToSave) {
    const userRef = doc(db, 'student', currentUser.uid);
    await updateDoc(userRef, {
      displayedTicket: numberOnly,
    });
  }

  setCurrentTicketIndex(newIndex);
  await updateFacultyTicketIndex(newIndex);
};

// Ticket management handlers
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

// Helper functions
const saveDisplayedTicket = async () => {
    const currentUser = auth.currentUser;
    if (currentUser && userType === 'FACULTY' && allTickets[currentTicketIndex]) {
      const userRef = doc(db, 'student', currentUser.uid);
      await updateDoc(userRef, {
        displayedTicket: allTickets[currentTicketIndex],
      });
    }
};
const updateFacultyTicketIndex = async (newIndex: number) => {
  const currentUser = auth.currentUser;
  if (currentUser && userType === 'FACULTY') {
    const userRef = doc(db, 'student', currentUser.uid);
    await updateDoc(userRef, {
      currentTicketIndex: newIndex
    });
  }
};
const showAlert = (message: string) => {
  if (Platform.OS === 'web') {
    window.alert(message);
  } else {
    Alert.alert('Queue Status', message);
  }
};
const FacultyView = () => (
  <View style={styles.container}>
          <View style={styles.ticketBox}>
            <Text style={styles.queueText}>
              <Text style={styles.boldText}>Student in line:</Text> 
              <Text style={styles.ticketInfo}>
                {allTickets.length > 0 ? 
                  ` ${allTickets.length - (currentTicketIndex + 1)}` 
                  : 'No tickets in line'}
              </Text>

            </Text>
            <Text style={styles.ticketNumber}>STUDENT TICKET NUMBER</Text>
            {allTickets.length === 0 ? (
              <View style={[styles.notificationContainer, { alignItems: 'center', padding: 10, backgroundColor: '#f8d7da', borderRadius: 5, margin: 10 }]}>
                <Text style={[styles.ticketCode, { color: '#721c24', fontSize: 16 }]}>
                  No ticket on queue
                </Text>
              </View>
            ) : allTickets[currentTicketIndex] ? (
              <Text style={styles.ticketCode}>
               {ticketStudentData.program}-{allTickets[currentTicketIndex]}
              </Text>
            ) : (
              <View style={[styles.notificationContainer, { alignItems: 'center', padding: 10, backgroundColor: '#f8d7da', borderRadius: 5, margin: 10 }]}>
                <Text style={[styles.ticketCode, { color: '#721c24', fontSize: 16 }]}>
                  Ticket Number has been cancelled by the student. Please NEXT/BACK to view available tickets.
                </Text>
              </View>
            )}

            <Text style={styles.boldText}>Student Name</Text>
            <Text style={styles.details}>{allTickets.length === 0 ? 'No student in queue' : ticketStudentData.name}</Text>
            <Text style={styles.details}>{allTickets.length === 0 ? 'No student in queue' : ticketStudentData.email}</Text>
            <Text style={styles.boldText}>Concern</Text>
            <Text style={styles.details}>{allTickets.length === 0 ? 'No concern to display' : ticketStudentData.concern}</Text>

            <View style={styles.buttonContainer}>
              <CustomButton title="BACK" onPress={handleBack} color="white" disabled={currentTicketIndex === 0}   />
              <CustomButton title="NEXT" onPress={handleNext}  />
            </View>
          </View>
        </View>
);
const StudentView = () => (
  <View style={styles.container}>
          {isCheckingRequest ? (
            <ActivityIndicator size="large" color="#004000" />
          ) : (
            isRequested ? (
              <View style={styles.ticketContainer}>
                <Text style={styles.subHeaderText}>
                  People in front of you: {userTicketNumber && currentDisplayedTicket ? 
                    Math.max(0, Number(userTicketNumber) - Number(currentDisplayedTicket)-1 ) : 
                    0}
                </Text>
                <View style={styles.ticketDetails}>
                  <Text style={styles.ticketLabel}>YOUR TICKET NUMBER</Text>
                  <Text style={styles.ticketNumber}>{`${userProgram}-${String(userTicketNumber).padStart(4, '0')}`}</Text>
                  <View style={styles.ticketInfoContainer}>
                    <View>
                      <Text style={styles.ticketLabel}>NEXT SERVING</Text>
                      <Text style={styles.ticketInfo}>
                        {nextDisplayedTicket ? 
                          `${nextDisplayedProgram ? `${nextDisplayedProgram}-` : ''}${String(nextDisplayedTicket).padStart(4, '0')}` 
                          : 'No Next Ticket'}
                      </Text>

                    </View>
                    <View>
                      <Text style={styles.ticketLabel}>NOW SERVING</Text>
                      <Text style={styles.ticketInfo}>
                      {currentDisplayedTicket ? 
                      `${currentDisplayedProgram ? `${currentDisplayedProgram}-` : ''}${String(currentDisplayedTicket).padStart(4, '0')}` 
                      : 'No ticket displayed'}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.waitText}>
                    {userTicketNumber === currentDisplayedTicket
                      ? "YOUR TURN"
                      : "PLEASE WAIT"
                    }
                  </Text>
                  
                </View>
                <View style={styles.buttonContainer}>
                  <CustomButton title="CANCEL" onPress={handleCancel} color="white" />
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
                  placeholderTextColor="#ccccc"
                  value={otherConcern}
                  onChangeText={(text) => setOtherConcern(text)}
                />
                <View style={styles.buttonContainer}>
                  {isLoading ? (
                    <ActivityIndicator size="large" color="#004000" />
                  ) : (
                    <CustomButton title="REQUEST" onPress={handleRequest}  />
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
);
  return (
    <ImageBackground source={require('../../assets/green p2.jpg')} style={styles.background}>
    {userType === 'FACULTY' ? <FacultyView /> : <StudentView />}
  </ImageBackground>
  );
}

