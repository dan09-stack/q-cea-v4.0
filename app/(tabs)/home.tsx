import { View, Text, TextInput, Button, ActivityIndicator, Alert, ImageBackground, Modal, TouchableOpacity, Pressable, Platform } from 'react-native';
import React, { useEffect, useState } from 'react';
import { auth, db } from '@/firebaseConfig';
import { collection, doc, getDoc, getDocs, onSnapshot, updateDoc, query, where, orderBy, limit, increment } from 'firebase/firestore';
import { homeStyles as styles } from '@/constants/home.styles';
import { CustomButton } from '@/components/ui/CustomButton';
import { setDoc } from 'firebase/firestore';
import NetInfo from '@react-native-community/netinfo';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function Home() {
  
  const [isAlertModalVisible, setIsAlertModalVisible] = useState(false);
const [alertMessage, setAlertMessage] = useState('');
const [alertTitle, setAlertTitle] = useState('');
  const [concernsList, setConcernsList] = useState<string[]>([]);

const [nextDisplayedTicket, setNextDisplayedTicket] = useState('');
const [nextDisplayedProgram, setNextDisplayedProgram] = useState('');
// User related states
const [userType, setUserType] = useState('');
const [currentStudent, setCurrentStudent] = useState<{ 
  name: string; 
  concern: string; 
  faculty: string | null; 
}>({ 
  name: '', 
  concern: '', 
  faculty: null 
});
const [isInitialized, setIsInitialized] = useState(false);
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
const [peopleAhead, setPeopleAhead] = useState(0);
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
const [ticketStudentData, setTicketStudentData] = useState({ name: '', concern: '', program:'' });

const [userData, setUserData] = useState({ phoneNumber: '' });
const [isInitialLoad, setIsInitialLoad] = useState(true);

// error handling
const [errorModalVisible, setErrorModalVisible] = useState(false);
const [errorMessage, setErrorMessage] = useState('');
const [nextStudentDetails, setNextStudentDetails] = useState<{fullName: string, phoneNumber: string} | null>(null);


useEffect(() => {
  const loadNextStudent = async () => {
    const details = await getNextStudentDetails();
    if (details) {
      setNextStudentDetails(details);
    } else {
      setNextStudentDetails(null);
    }
  };
  loadNextStudent();
}, [currentTicketIndex, allTickets]);

const AlertModal = () => (
  <Modal
    animationType="fade"
    transparent={true}
    visible={isAlertModalVisible}
    onRequestClose={() => setIsAlertModalVisible(false)}
  >
    <View style={styles.modalContainer}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>{alertTitle}</Text>
        <Text style={styles.modalItemText}>{alertMessage}</Text>
        <Button 
          title="OK" 
          onPress={() => {
            setIsAlertModalVisible(false);
            if (alertTitle === 'Faculty Unavailable') {
              setSelectedFaculty('');
              setSelectedConcern('');
              setOtherConcern('');
            }
          }} 
          color="#004000" 
        />
      </View>
    </View>
  </Modal>
);
const getPhoneNumberForTicket = async (ticketNumber: string) => {
  try {
    const studentQuery = query(
      collection(db, 'student'),
      where('userTicketNumber', '==', parseInt(ticketNumber))
    );
    
    const querySnapshot = await getDocs(studentQuery);
    if (!querySnapshot.empty) {
      const studentData = querySnapshot.docs[0].data();
      return studentData.phoneNumber;
    }
    return null;
  } catch (error) {
    console.error('Error fetching phone number:', error);
    return null;
  }
};
const handleSendSMS = async (phoneNumber: string) => {
  try {
    const formattedPhone = phoneNumber
      .replace(/\D/g, '')
      .replace(/^0+/, '+63');
    
    const response = await fetch('https://app.philsms.com/api/v3/sms/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': 'Bearer 1308|QzHqnNuiO7xjeEzknr6f1lBKEkbhDBF08Wsrx90l'
      },
      body: JSON.stringify({
        recipient: formattedPhone,
        sender_id: 'PhilSMS',
        type: 'plain',
        message: 'Get READY! Your turn is up next. Please stand by at the waiting area. Thank you!',
      })
    });

    const data = await response.json();
    console.log('SMS Response:', data);
  } catch (error) {
    console.error('SMS Error:', error);
  }
};


useEffect(() => {
  const fetchConcerns = async () => {
    const concernDoc = await getDoc(doc(db, 'admin', 'concern'));
    if (concernDoc.exists()) {
      setConcernsList(concernDoc.data().concern || []);
    }
  };
  fetchConcerns();
}, []);
// to track next ticket
useEffect(() => {
  if (!currentStudent.faculty) return; // Add this guard
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
}, [currentDisplayedTicket, currentStudent?.faculty]);


//  to track queue position
useEffect(() => {

  const queueQuery = query(
    collection(db, 'student'),
    where('faculty', '==', currentStudent.faculty),
    where('userTicketNumber', '>', Number(currentDisplayedTicket)),
    where('userTicketNumber', '<', Number(userTicketNumber)),
    where('status', '==', 'waiting')
  );

  const unsubscribe = onSnapshot(queueQuery, (snapshot) => {
    setPeopleAhead(snapshot.size);
  });

  return () => unsubscribe();
}, [userTicketNumber, currentDisplayedTicket, currentStudent.faculty]);

useEffect(() => {
  if (!currentStudent?.name) return;
  const currentUser = auth.currentUser;
  if (!currentUser) return;

  const userRef = doc(db, 'student', currentUser.uid);
  const unsubscribe = onSnapshot(userRef, (doc) => {
    if (doc.exists()) {
      const userData = doc.data();
      
      setCurrentStudent(prevState => ({
        ...prevState,
        faculty: userData.faculty
      }));
      setIsInitialLoad(false);
    }
  });

  return () => unsubscribe();
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
        if (!userData.isVerified) {
          router.push('/verifyByAdmin');
          return;
        }

        setUserType(userData.userType);
        setUserData({ phoneNumber: userData.phoneNumber || '' });
        setCurrentStudent(prevState => ({
          ...prevState,
          name: userData.fullName || '',
            faculty: userData.faculty || null
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
          program: studentData.program
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
const getNextStudentDetails = async () => {
  try {
    const nextTicketNumber = allTickets[currentTicketIndex + 1];
    if (!nextTicketNumber) return null;

    const studentQuery = query(
      collection(db, 'student'),
      where('userTicketNumber', '==', parseInt(nextTicketNumber))
    );

    const querySnapshot = await getDocs(studentQuery);
    if (!querySnapshot.empty) {
      const studentData = querySnapshot.docs[0].data();
      
      // if (Platform.OS === 'web') {
      //   // Web notification
      //   if (Notification.permission === 'granted') {
      //     new Notification('Your Turn is Coming Up!', {
      //       body: `Get ready ${studentData.fullName}! You're next in line.`,
      //       icon: '/icon.png'
      //     });
      //   }
      // } else {
      //   // Mobile notification via Expo
      //   if (studentData.expoPushToken) {
      //     await fetch('https://exp.host/--/api/v2/push/send', {
      //       method: 'POST',
      //       headers: {
      //         'Content-Type': 'application/json',
      //       },
      //       body: JSON.stringify({
      //         to: studentData.expoPushToken,
      //         title: 'Your Turn is Coming Up!',
      //         body: `Get ready ${studentData.fullName}! You're next in line.`,
      //         data: { type: 'queue_notification' },
      //       }),
      //     });
      //   }
      // }

      return {
        fullName: studentData.fullName,
        phoneNumber: studentData.phoneNumber
      };
    }
  } catch (error) {
    console.log('Error fetching next student details:', error);
  }
};



// Queue control handlers
const handleNext = async () => {
  if (allTickets.length === 0) {
    showAlert('No ticket on queue');
    return;
  }
  const newIndex = currentTicketIndex < allTickets.length - 1 ? currentTicketIndex + 1 : currentTicketIndex;
  
  // Get the next ticket number (the one after newIndex)
  const nextTicketNumber = allTickets[newIndex + 1];
  if (nextTicketNumber) {
    const studentQuery = query(
      collection(db, 'student'),
      where('userTicketNumber', '==', parseInt(nextTicketNumber))
    );
    
    const querySnapshot = await getDocs(studentQuery);
    if (!querySnapshot.empty) {
      const studentData = querySnapshot.docs[0].data();
       handleSendSMS(studentData.phoneNumber);
    }
  }
  if (newIndex === currentTicketIndex && currentTicketIndex === allTickets.length - 1) {
    showAlert('No ticket on queue');
    return;
  }

  const ticketToSave = allTickets[newIndex];
  if (!ticketToSave) {
    showAlert('No ticket on queue');
    return ;
  }



  const numberOnly = parseInt(ticketToSave.replace('CPE-', ''));
  const studentQuery = query(
    collection(db, 'student'),
    where('userTicketNumber', '==', numberOnly)
  );
  
  const studentSnapshot = await getDocs(studentQuery);
  
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
  const numberOnly = ticketToSave ? parseInt(ticketToSave.replace('CPE-', '')) : null;
  
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
    setAlertTitle('Error');
    setAlertMessage('Please select a faculty');
    setIsAlertModalVisible(true);
    return;
  }
  
  if (!selectedConcern && !otherConcern) {
    showAlert( 'Please select a concern or provide details in Other field');
    return;
  }
  const selectedFacultyData = facultyList.find(faculty => faculty.fullName === selectedFaculty);
  if (selectedFacultyData?.status !== 'ONLINE') {
    setAlertTitle('Faculty Unavailable');
    setAlertMessage('The faculty is currently unavailable. Your request has been cancelled.');
    setIsAlertModalVisible(true);
    return;
  }

  if (!selectedConcern && !otherConcern) {
    setAlertTitle('Error');
    setAlertMessage('Please select a concern or provide details in Other field');
    setIsAlertModalVisible(true);
    return;
  }

  setIsLoading(true);
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }
    const facultyQuery = query(
      collection(db, 'student'),
      where('fullName', '==', selectedFaculty),
      where('userType', '==', 'FACULTY')
    );
    
    const facultySnapshot = await getDocs(facultyQuery);
    if (!facultySnapshot.empty) {
      const facultyDoc = facultySnapshot.docs[0];
      await updateDoc(doc(db, 'student', facultyDoc.id), {
        numOnQueue: increment(1)
      });
    }

    const ticketRef = doc(db, 'ticketNumberCounter', 'ticket');
    const ticketSnap = await getDoc(ticketRef);
    
    if (ticketSnap.exists()) {
      const currentNumber = ticketSnap.data().ticketNum;
      const newNumber = currentNumber + 1;
      
      await updateDoc(ticketRef, {
        ticketNum: newNumber
      });

      // Update user document
      const userRef = doc(db, 'student', currentUser.uid);
      await updateDoc(userRef, {
        userTicketNumber: newNumber,
        faculty: selectedFaculty,
        concern: selectedConcern,
        otherConcern: otherConcern,
        requestDate: new Date(),
        status: 'waiting'
      });
      
      // Force refresh the display by triggering state updates
      setTicketNumber(newNumber);
      setIsRequested(true);
      setCurrentStudent(prev => ({
        ...prev, 
        faculty: selectedFaculty || null  // Ensure null fallback
      }));
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
      // Get the faculty name before updating user status
      const userRef = doc(db, 'student', currentUser.uid);
      const userDoc = await getDoc(userRef);
      const facultyName = userDoc.data()?.faculty;

      // Find and update faculty's numOnQueue
      if (facultyName) {
        const facultyQuery = query(
          collection(db, 'student'),
          where('fullName', '==', facultyName),
          where('userType', '==', 'FACULTY')
        );
        
        const facultySnapshot = await getDocs(facultyQuery);
        if (!facultySnapshot.empty) {
          const facultyDoc = facultySnapshot.docs[0];
          await updateDoc(doc(db, 'student', facultyDoc.id), {
            numOnQueue: increment(-1)
          });
        }
      }

      // Update user status
      await updateDoc(userRef, {
        status: 'cancelled',
        userTicketNumber: null,
        faculty: null,
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
                  Ticket Number has been cancelled by student. Please click next to view available tickets
                </Text>
              </View>
            )}
          {/* {allTickets[currentTicketIndex + 1]} */}
            <Text style={[styles.boldText, {fontSize: 18}]}>Student Name</Text>
            <Text style={[styles.details, {fontSize: 20}]}>{allTickets.length === 0 ? 'No students in queue' : ticketStudentData.name}</Text>
            <Text style={[styles.boldText, {fontSize: 18 , marginTop: 20}]}>Concern</Text>
            <Text style={[styles.details, {fontSize: 20}]}>{allTickets.length === 0 ? 'No concerns to display' : ticketStudentData.concern}</Text>
            {nextStudentDetails && (
  <View>
    <Text>Next Student: {nextStudentDetails.fullName}</Text>
    <Text>Phone: {nextStudentDetails.phoneNumber}</Text>
  </View>
)}

            <View style={styles.buttonContainer}>
              <CustomButton title="BACK" onPress={handleBack} color="white" disabled={currentTicketIndex === 0}   />
              <CustomButton title="NEXT" onPress={handleNext}  />
            </View>
          </View>
        </View>
);
const StudentView = () => (
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
                      {currentDisplayedTicket ? 
                      `${currentDisplayedProgram ? `${currentDisplayedProgram}-` : ''}${String(currentDisplayedTicket).padStart(4, '0')}` 
                      : 'No ticket displayed'}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.waitText,{ marginTop: 30 , marginBottom: -10 , fontSize: 23}]}>
                    {userTicketNumber === currentDisplayedTicket
                      ? "YOUR TURN"
                      : "PLEASE WAIT"
                    }
                  </Text>
                  
                </View>
                <View style={styles.buttonContainer}>
                  <CustomButton title="CANCEL" onPress={handleCancel} color="#c8c4c4" />
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
                </TouchableOpacity> <Text style= {{fontSize: 16, fontWeight: 'bold'}}>Concern</Text>

                <TouchableOpacity 
                  style={styles.pickerButton}
                  onPress={() => setConcernModalVisible(true)}
                >
                  <Text style={styles.pickerButtonText}>
                    {selectedConcern || "Select your concern"}
                  </Text>
                </TouchableOpacity>
                <View style= {{marginTop: 5}}>
                </View>
                {/* <TextInput
                  style={{
                  height: 100, 
                  textAlignVertical: 'top', 
                  padding: 10, 
                  borderWidth: 1, 
                  borderColor: '#005000', 
                  fontSize: 16,
                  borderRadius: 5, 
                  color: '#f3f3f3',
                  backgroundColor: '#005000'
                  }}
                  placeholder="Other concern:"
                  placeholderTextColor="#ccccc"
                  value={otherConcern}
                  onChangeText={(text) => setOtherConcern(text)}
                  multiline={true}

                /> */}
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
  return (
  <ImageBackground source={require('../../assets/images/green.png')} style={styles.background}>

    {userType === 'FACULTY' ? <FacultyView /> : <StudentView />}
    <AlertModal />
    </ImageBackground>
  );
}

