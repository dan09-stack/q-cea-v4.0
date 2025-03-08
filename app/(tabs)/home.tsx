import { Animated, Easing, ImageBackground, Platform, Text, useWindowDimensions, View } from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import { auth, db } from '@/firebaseConfig';
import { collection, doc, getDoc, getDocs, onSnapshot, updateDoc, query, where, orderBy, limit, increment, setDoc, writeBatch } from 'firebase/firestore';
import { homeStyles as styles } from '@/constants/home.styles';
import { router } from 'expo-router';
import { Alert } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { shadeColor, getContrastTextColor } from '@/utils/themeUtils';
import { ThemedButton } from '@/components/ui/ThemedButton';
// Components
import { FacultyView } from '../../components/HomeFacultyView';
import { StudentView } from '../../components/HomeStudentView';
import { AlertModal } from '@/components/queue/AlertModal';

// Hooks and Services
import { useQueueState } from '@/hooks/useQueueState';
import { getPhoneNumberForTicket, sendNotificationToStudent, sendNotificationToFaculty, sendEmailNotification, getNextStudentDetails } from '@/services/queueService';
import { Colors } from '@/constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';

export default function Home() {
  const { colors } = useTheme();
  const state = useQueueState();
  const backgroundColor = "#008000";
  const textColor = getContrastTextColor(colors.backgroundColor);
  const [proofOfPaymentImage, setProofOfPaymentImage] = useState<string | null>(null);

  // Create gradient colors
  const gradientColors = [
    colors.backgroundColor,
    shadeColor(colors.backgroundColor, -20),
    shadeColor(colors.backgroundColor, -40)
  ] as readonly [string, string, string];
  useEffect(() => {
      const fetchUserData = async () => {
        try {
          const user = auth.currentUser;
          if (user) {
            if (!user.emailVerified) {
              setTimeout(() => {
                router.replace('/verify');
              }, 0);
            } else {
              const userDoc = await db.collection('student').doc(user.uid).get();
            
            }
          } else {
            setTimeout(() => {
              router.replace('/student/login');
            }, 0);
          }
        } finally {
        }
      };
    
      fetchUserData();
    }, []);
  useEffect(() => {
    const loadTickets = async () => {
      if (!state.currentStudent.name && auth.currentUser) {
        const userDoc = await getDoc(doc(db, 'student', auth.currentUser.uid));
        if (userDoc.exists()) {
          state.setCurrentStudent(prevState => ({
            ...prevState,
            name: userDoc.data().fullName || ''
          }));
        }
      }
    };
    
    if (!state.currentStudent.name) {
      loadTickets();
    }
  }, [state.currentStudent.name]);
  
  useEffect(() => {
    const loadNextStudent = async () => {
      const details = await getNextStudentDetails(state.allTickets, state.currentTicketIndex);
      if (details) {
        state.setNextStudentDetails(details);
      } else {
        state.setNextStudentDetails(null);
      }
    };
    loadNextStudent();
  }, [state.currentTicketIndex, state.allTickets]);

  // Fetch concerns from database
  useEffect(() => {
    const fetchConcerns = async () => {
      const concernDoc = await getDoc(doc(db, 'admin', 'concern'));
      if (concernDoc.exists()) {
        state.setConcernsList(concernDoc.data().concern || []);
      }
    };
    fetchConcerns();
  }, []);

  // Track next ticket
  useEffect(() => {
    if (!state.currentStudent.faculty) return;
    const facultyQuery = query(
      collection(db, 'student'),
      where('faculty', '==', state.currentStudent.faculty),
      where('userTicketNumber', '>', state.currentDisplayedTicket),
      orderBy('userTicketNumber', 'asc'),
      limit(1)
    );

    const unsubscribe = onSnapshot(facultyQuery, (snapshot) => {
      if (!snapshot.empty) {
        const nextTicket = snapshot.docs[0].data();
        state.setNextDisplayedTicket(nextTicket.userTicketNumber);
        state.setNextDisplayedProgram(nextTicket.program);
      } else {
        state.setNextDisplayedTicket('');
        state.setNextDisplayedProgram('');
      }
    });

    return () => unsubscribe();
  }, [state.currentDisplayedTicket, state.currentStudent?.faculty]);

  // Track queue position
  useEffect(() => {
    const queueQuery = query(
      collection(db, 'student'),
      where('faculty', '==', state.currentStudent.faculty),
      where('userTicketNumber', '>', Number(state.currentDisplayedTicket)),
      where('userTicketNumber', '<', Number(state.userTicketNumber)),
      where('status', '==', 'waiting')
    );

    const unsubscribe = onSnapshot(queueQuery, (snapshot) => {
      state.setPeopleAhead(snapshot.size);
    });

    return () => unsubscribe();
  }, [state.userTicketNumber, state.currentDisplayedTicket, state.currentStudent.faculty]);

  // Initialize student data
  useEffect(() => {
    if (!state.currentStudent?.name) return;
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const userRef = doc(db, 'student', currentUser.uid);
    const unsubscribe = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        const userData = doc.data();
        
        state.setCurrentStudent(prevState => ({
          ...prevState,
          faculty: userData.faculty
        }));
        state.setIsInitialLoad(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Store all tickets
  useEffect(() => {
    const storeAllTickets = async () => {
      try {
        const allTicketsRef = doc(db, 'allTicketNumber', 'tickets');
        await updateDoc(allTicketsRef, {
          tickets: state.allTickets,
          lastUpdated: new Date()
        });
      } catch (error) {
        // If document doesn't exist, create it
        const allTicketsRef = doc(db, 'allTicketNumber', 'tickets');
        await setDoc(allTicketsRef, {
          tickets: state.allTickets,
          lastUpdated: new Date()
        });
      }
    };

    if (state.allTickets.length > 0) {
      storeAllTickets();
    }
  }, [state.allTickets]);

  // Authentication and user data
  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'student', user.uid));
        if (userDoc.exists()) {
          if (!user.emailVerified) {
            router.push('/verify');
            return;
          }
          const userData = userDoc.data();
          if (!userData.isVerified) {
            router.push('/verifyByAdmin');
            return;
          }

          state.setUserType(userData.userType);
          state.setUserData({ phoneNumber: userData.phoneNumber || '' });
          state.setCurrentStudent(prevState => ({
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
            where('faculty', '==', state.currentStudent.name),
            orderBy('userTicketNumber', 'asc'),
          ), 
          (snapshot) => {
            const tickets = snapshot.docs
              .filter(doc => doc.data().userTicketNumber)
              .map(doc => `${String(doc.data().userTicketNumber).padStart(4, '0')}`);
             
            state.setAllTickets(tickets);
            state.setCurrentQueue(tickets.length);
          }
        );
        
        // Listen for user's ticket status
        const userRef = doc(db, 'student', user.uid);
        const userUnsubscribe = onSnapshot(userRef, (doc) => {
          if (doc.exists()) {
            const userData = doc.data();
            // Only set isRequested to true if status is not cancelled and there's a ticket number
            state.setIsRequested(userData.status !== 'cancelled' && userData.userTicketNumber != null);
            state.setUserTicketNumber(userData.userTicketNumber);
            state.setUserProgram(userData.program);
          }
          state.setIsTicketLoading(false);
          state.setIsCheckingRequest(false);  
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
          state.setFacultyList(faculty);
        });

        // Track ticket counter
        const ticketRef = doc(db, 'ticketNumberCounter', 'ticket');
        const ticketUnsubscribe = onSnapshot(ticketRef, (doc) => {
          if (doc.exists()) {
            state.setTicketNumber(doc.data().ticketNum);
          }
        });
        
        return () => {
          userUnsubscribe();
          facultyUnsubscribe();
          ticketUnsubscribe();
          ticketsUnsubscribe();
        };
      } else {
        state.setIsCheckingRequest(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Fetch student data for ticket display
  useEffect(() => {
    const fetchStudentData = async () => {
      if (state.allTickets[state.currentTicketIndex]) {
        const studentQuery = query(
          collection(db, 'student'),
          where('userTicketNumber', '==', parseInt(state.allTickets[state.currentTicketIndex].replace('CPE-', '')))
        );
        const querySnapshot = await getDocs(studentQuery);
        if (!querySnapshot.empty) {
          const studentData = querySnapshot.docs[0].data();
          state.setTicketStudentData({
            name: studentData.fullName,
            concern: studentData.concern ,
            program: studentData.program,
            otherConcern: studentData.otherConcern,
            specificDetails: studentData.specificDetails
          });
        }
      }
    };
    fetchStudentData();
  }, [state.currentTicketIndex, state.allTickets]);

  // Load saved ticket index for faculty
  useEffect(() => {
    const loadSavedIndex = async () => {
      const currentUser = auth.currentUser;
      if (currentUser && state.userType === 'FACULTY') {
        const userDoc = await getDoc(doc(db, 'student', currentUser.uid));
        if (userDoc.exists() && userDoc.data().currentTicketIndex !== undefined) {
          state.setCurrentTicketIndex(userDoc.data().currentTicketIndex);
        }
      }
    };
    loadSavedIndex();
  }, [state.userType]);

  // Track tickets for faculty queue
  useEffect(() => {
    if (state.currentStudent.name) {
      const ticketsUnsubscribe = onSnapshot(
        query(
          collection(db, 'student'),
          where('faculty', '==', state.currentStudent.name),
          orderBy('userTicketNumber', 'asc'),
        ), 
        async (snapshot) => {
          const tickets = snapshot.docs
            .filter(doc => doc.data().userTicketNumber)
            .map(doc => `${String(doc.data().userTicketNumber).padStart(4, '0')}`);
          state.setAllTickets(tickets);
          state.setCurrentQueue(tickets.length);

          // Reset displayed ticket if no tickets
          if (tickets.length === 0) {
            const currentUser = auth.currentUser;
            if (currentUser && state.userType === 'FACULTY') {
              const userRef = doc(db, 'student', currentUser.uid);
              await updateDoc(userRef, {
                displayedTicket: null
              });
            }
          }
        }
      );

      return () => ticketsUnsubscribe();
    }
  }, [state.currentStudent.name]);

  // Track displayed ticket for student
  useEffect(() => {
    const facultyQuery = query(
      collection(db, 'student'),
      where('userType', '==', 'FACULTY'),
      where('fullName', '==', state.currentStudent.faculty)
    );

    const unsubscribe = onSnapshot(facultyQuery, async (snapshot) => {
      for (const doc of snapshot.docs) {
        if (doc.data().displayedTicket) {
          const displayedTicket = doc.data().displayedTicket;
          state.setCurrentDisplayedTicket(displayedTicket);
          
          // Fetch student program for the displayed ticket
          const studentQuery = query(
            collection(db, 'student'),
            where('userTicketNumber', '==', displayedTicket)
          );
          const studentSnapshot = await getDocs(studentQuery);
          if (!studentSnapshot.empty) {
            state.setCurrentDisplayedProgram(studentSnapshot.docs[0].data().program);
          }
        }
      }
    });

    return () => unsubscribe();
  }, [state.currentStudent.faculty]);

  // Fetch student data for currently displayed ticket
  useEffect(() => {
    if (state.allTickets[state.currentTicketIndex]) {
      const fetchStudentData = async () => {
        const studentQuery = query(
          collection(db, 'student'),
          where('userTicketNumber', '==', parseInt(state.allTickets[state.currentTicketIndex].replace('CPE-', '')))
        );
        const querySnapshot = await getDocs(studentQuery);
        if (!querySnapshot.empty) {
          const studentData = querySnapshot.docs[0].data();
          state.setTicketStudentData({
            name: studentData.fullName,
            concern: studentData.concern || studentData.otherConcern,
            program: studentData.program,
            otherConcern: studentData.otherConcern,
            specificDetails: studentData.specificDetails

            
          });

          // Save displayed ticket number as integer
          const currentUser = auth.currentUser;
          if (currentUser && state.userType === 'FACULTY') {
            const userRef = doc(db, 'student', currentUser.uid);
            const numberOnly = parseInt(state.allTickets[state.currentTicketIndex].replace('CPE-', ''));
            await updateDoc(userRef, {
              displayedTicket: numberOnly,
            });
          }
        }
      };
      fetchStudentData();
    }
  }, [state.currentTicketIndex, state.allTickets]);

  // Update queue number when student's turn is up
  useEffect(() => {
    const updateQueueNumber = async () => {
      if (state.userTicketNumber === state.currentDisplayedTicket) {
        const currentUser = auth.currentUser;
        if (currentUser) {
          const userRef = doc(db, 'student', currentUser.uid);
          const userDoc = await getDoc(userRef);
          const facultyName = userDoc.data()?.faculty;

          if (facultyName) {
            const facultyQuery = query(
              collection(db, 'student'),
              where('fullName', '==', facultyName),
              where('userType', '==', 'FACULTY')
            );

            const facultySnapshot = await getDocs(facultyQuery);
            if (!facultySnapshot.empty) {
              const facultyDoc = facultySnapshot.docs[0];
              const currentQueueCount = facultyDoc.data().numOnQueue || 0;
              
              if (currentQueueCount > 0) {
                await updateDoc(doc(db, 'student', facultyDoc.id), {
                  numOnQueue: currentQueueCount - 1
                });
              }
            }
          }
        }
      }
    };

    updateQueueNumber();
  }, [state.userTicketNumber, state.currentDisplayedTicket]);

  // Handler functions
  const handleNext = async () => {
    if (state.allTickets.length === 0) {
      state.setAlertTitle('Queue Status');
      state.setAlertMessage('No ticket on queue');
      state.setAlertButtons([{
        text: 'OK',
        onPress: () => state.setIsAlertModalVisible(false),
      }]);
      state.setIsAlertModalVisible(true);
      return;
    }
    const newIndex = state.currentTicketIndex < state.allTickets.length - 1 ? state.currentTicketIndex + 1 : state.currentTicketIndex;
    
    // Get the next ticket number (the one after newIndex)
    const nextTicketNumber = state.allTickets[newIndex + 1];
    if (nextTicketNumber) {
      const studentQuery = query(
        collection(db, 'student'),
        where('userTicketNumber', '==', parseInt(nextTicketNumber))
      );
      
      const querySnapshot = await getDocs(studentQuery);
      if (!querySnapshot.empty) {
        const studentData = querySnapshot.docs[0].data();
        sendNotificationToStudent(studentData.phoneNumber);
        
        // Send email notification
       sendEmailNotification(
          'template_v5us19b',
          studentData.email,
          studentData.fullName
        );
      }
    }
    
    if (newIndex === state.currentTicketIndex && state.currentTicketIndex === state.allTickets.length - 1) {
      state.setAlertTitle('Queue Status');
      state.setAlertMessage('No ticket in queue. Would you like to finish the consultation?');
      state.setAlertButtons([
        {
          text: 'No',
          onPress: () => state.setIsAlertModalVisible(false),
          color: Colors.light.tint
        },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              const currentUser = auth.currentUser;
              let facultyName = '';

              if (currentUser) {
                // Get faculty name from Firestore
                const userDoc = await getDoc(doc(db, 'student', currentUser.uid));
                if (userDoc.exists()) {
                  facultyName = userDoc.data().fullName || '';
                }
                // Update faculty's numOnQueue to 0
                const userRef = doc(db, 'student', currentUser.uid);
                await updateDoc(userRef, {
                  numOnQueue: 0
                });
              }
              // Get all waiting students in queues
              const studentsCollectionRef = collection(db, 'student');
              const waitingStudentsQuery = query(
                studentsCollectionRef,
                where('faculty', '==', facultyName),
                where('userType', '==', 'STUDENT'),
                where('status', '==', 'waiting'),
              );
              
              const waitingStudentsSnapshot = await getDocs(waitingStudentsQuery);
              
              // Batch update to cancel all queues
              if (!waitingStudentsSnapshot.empty) {
                const batch = writeBatch(db);
                
                waitingStudentsSnapshot.docs.forEach((docSnapshot) => {
                  const studentRef = doc(db, 'student', docSnapshot.id);
                  batch.update(studentRef, {
                    status: 'completed',
                    userTicketNumber: null,
                    faculty: null,
                    concern: null,
                    otherConcern: null,
                    requestDate: null,
                    queuePosition: null
                  });
                });
                
                await batch.commit();
                state.setIsAlertModalVisible(false);
                
                // Show confirmation after completion
                setTimeout(() => {
                  state.setAlertTitle('Success');
                  state.setAlertMessage(`Completed ${waitingStudentsSnapshot.size} queues successfully`);
                  state.setAlertButtons([{
                    text: 'OK',
                    onPress: () => state.setIsAlertModalVisible(false),
                    color: Colors.light.tint
                  }]);
                  state.setIsAlertModalVisible(true);
                }, 500);
              } else {
                state.setIsAlertModalVisible(false);
                
                // Show info message
                setTimeout(() => {
                  state.setAlertTitle('Info');
                  state.setAlertMessage('No active queues to cancel');
                  state.setAlertButtons([{
                    text: 'OK',
                    onPress: () => state.setIsAlertModalVisible(false),
                  }]);
                  state.setIsAlertModalVisible(true);
                }, 500);
              }
            } catch (error) {
              console.error('Error cancelling all queues:', error);
              state.setIsAlertModalVisible(false);
              
              // Show error message
              setTimeout(() => {
                state.setAlertTitle('Error');
                state.setAlertMessage('Failed to cancel all queues');
                state.setAlertButtons([{
                  text: 'OK',
                  onPress: () => state.setIsAlertModalVisible(false),
                }]);
                state.setIsAlertModalVisible(true);
              }, 500);
            }
          },
          color: '#FF3B30' // Red color for destructive action
        }
      ]);
      state.setIsAlertModalVisible(true);
      return;
    }
  
    

    const ticketToSave = state.allTickets[newIndex];
    if (!ticketToSave) {
      state.setAlertTitle('Queue Status');
      state.setAlertMessage('No ticket on queue');
      state.setAlertButtons([{
        text: 'OK',
        onPress: () => state.setIsAlertModalVisible(false),
      }]);
      state.setIsAlertModalVisible(true);
      return;
    }

    const numberOnly = parseInt(ticketToSave.replace('CPE-', ''));
    
    const currentUser = auth.currentUser;
    if (currentUser && state.userType === 'FACULTY' && ticketToSave) {
      const userRef = doc(db, 'student', currentUser.uid);
      await updateDoc(userRef, {
        displayedTicket: numberOnly,
      });
    }
    
    state.setCurrentTicketIndex(newIndex);
    await updateFacultyTicketIndex(newIndex);
  };

  const handleBack = async () => {
    if (state.currentTicketIndex === 0) return;
    const newIndex = state.currentTicketIndex > 0 ? state.currentTicketIndex - 1 : state.allTickets.length - 1;
    
    const ticketToSave = state.allTickets[newIndex];
    const numberOnly = ticketToSave ? parseInt(ticketToSave.replace('CPE-', '')) : null;
    
    const currentUser = auth.currentUser;
    if (currentUser && state.userType === 'FACULTY' && ticketToSave) {
      const userRef = doc(db, 'student', currentUser.uid);
      await updateDoc(userRef, {
        displayedTicket: numberOnly,
      });
    }

    state.setCurrentTicketIndex(newIndex);
    await updateFacultyTicketIndex(newIndex);
  };

  const handleRequest = async () => {
    if (!state.selectedFaculty) {
      state.setAlertTitle('Error');
      state.setAlertMessage('Please select a faculty');
      state.setAlertButtons([{
        text: 'OK',
        onPress: () => state.setIsAlertModalVisible(false),
      }]);
      state.setIsAlertModalVisible(true);
      return;
    }
    
    if (!state.selectedConcern && !state.otherConcern) {
      state.setAlertTitle('Select Concern');
      state.setAlertMessage('Please select a concern');
      state.setAlertButtons([{
        text: 'OK',
        onPress: () => state.setIsAlertModalVisible(false),
      }]);
      state.setIsAlertModalVisible(true);
      return;
    }
    
    const selectedFacultyData = state.facultyList.find(faculty => faculty.fullName === state.selectedFaculty);
    if (selectedFacultyData?.status !== 'ONLINE') {
      state.setAlertTitle('Faculty Unavailable');
      state.setAlertMessage('The faculty is currently unavailable. Your request has been cancelled.');
      state.setAlertButtons([{
        text: 'OK',
        onPress: () => state.setIsAlertModalVisible(false),
      }]);
      state.setIsAlertModalVisible(true);
      return;
    }

    state.setIsLoading(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }
      
      const facultyQuery = query(
        collection(db, 'student'),
        where('fullName', '==', state.selectedFaculty),
        where('userType', '==', 'FACULTY')
      );
      
      const facultySnapshot = await getDocs(facultyQuery);
      if (!facultySnapshot.empty) {
        const facultyDoc = facultySnapshot.docs[0];
        const facultyData = facultyDoc.data();
        
        // If queue is empty, send notification to faculty
        if (facultyData.numOnQueue === 0) {
          sendNotificationToFaculty(facultyData.phoneNumber);
          sendEmailNotification(
            'template_jbfj8p6',
            facultyData.email,
            facultyData.fullName
          );
        }
        
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
          faculty: state.selectedFaculty,
          concern: state.selectedConcern,
          otherConcern: state.otherConcern,
          specificDetails: state.specificDetails,
          requestDate: new Date(),    
          status: 'waiting'
        });
        
       
            // Force refresh the display by triggering state updates
            state.setTicketNumber(newNumber);
            state.setIsRequested(true);
            state.setCurrentStudent(prev => ({
              ...prev, 
              faculty: state.selectedFaculty || null  // Ensure null fallback
            }));
          }
        } catch (error) {
          console.log('Error updating ticket number:', error);
          Alert.alert('Error', 'Failed to create ticket request');
        } finally {
          state.setIsLoading(false);
        }
      };
    
      const handleDone = async () => {
        const currentUser = auth.currentUser;
        if (currentUser) {
          const userRef = doc(db, 'student', currentUser.uid);
          const userDoc = await getDoc(userRef);
          const facultyName = userDoc.data()?.faculty;
    
          if (facultyName) {
            const facultyQuery = query(
              collection(db, 'student'),
              where('fullName', '==', facultyName),
              where('userType', '==', 'FACULTY')
            );
            
            const facultySnapshot = await getDocs(facultyQuery);
            if (!facultySnapshot.empty) {
              const facultyDoc = facultySnapshot.docs[0];
              const currentQueueCount = facultyDoc.data().numOnQueue || 0;
              
              if (currentQueueCount > 0) {
                await updateDoc(doc(db, 'student', facultyDoc.id), {
                  numOnQueue: currentQueueCount - 1
                });
              }
            }
          }
        }
        
        router.push('/rating');
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
              concern: null,
              otherConcern: null,
              specificDetails: null,
            });
          }
          state.setIsRequested(false);
        } catch (error) {
          console.error('Error cancelling ticket:', error);
          Alert.alert('Error', 'Failed to cancel ticket');
        }
      };
    
      // Helper functions
      const updateFacultyTicketIndex = async (newIndex: number) => {
        const currentUser = auth.currentUser;
        if (currentUser && state.userType === 'FACULTY') {
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
      const waveAnim = useRef(new Animated.Value(0)).current;
  
  // Start continuous waving animation when component mounts
  useEffect(() => {
    // Create a waving sequence
    const waveSequence = Animated.sequence([
      Animated.timing(waveAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
        easing: Easing.sin
      }),
      Animated.timing(waveAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
        easing: Easing.sin
      })
    ]);
    
    // Loop the animation indefinitely
    Animated.loop(waveSequence, {
      iterations: -1 // Infinite iterations
    }).start();
    
    // Cleanup animation when component unmounts
    return () => waveAnim.stopAnimation();
  }, []);
  
  // Create wave rotation transform
  const waveRotation = waveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '20deg']
  });
  const { width } = useWindowDimensions();
const isLargeScreen = width >= 768;
      return (
        <LinearGradient colors={gradientColors} style={styles.container}>
          <View style={styles.greetingContainer}>
  <View style={styles.greetingRow}>
    <Text style={[
      styles.greetingText, 
      { color: textColor },
      isLargeScreen && { fontSize: 32, marginRight: 12 } // Larger text on larger screens
    ]}>
      Hello, {state.currentStudent.name || 'User'}!
    </Text>
    
    <Animated.View style={[
      styles.iconContainer, 
      { transform: [{ rotate: waveRotation }] },
      isLargeScreen && { transform: [{ rotate: waveRotation }, { scale: 1.5 }] } // Larger icon on larger screens
    ]}>
      <FontAwesome5 
        name="hand-paper" 
        size={isLargeScreen ? 36 : 24} // Larger icon size on larger screens
        color={'#FFC107'} 
      />
    </Animated.View>
  </View>
</View>

          {state.userType === 'FACULTY' ? (
            <FacultyView 
              allTickets={state.allTickets}
              currentTicketIndex={state.currentTicketIndex}
              ticketStudentData={state.ticketStudentData}
              handleBack={handleBack}
              handleNext={handleNext}
            />
          ) : (
            <StudentView 
              isCheckingRequest={state.isCheckingRequest}
              isRequested={state.isRequested}
              peopleAhead={state.peopleAhead}
              userProgram={state.userProgram}
              userTicketNumber={state.userTicketNumber}
              nextDisplayedProgram={state.nextDisplayedProgram}
              nextDisplayedTicket={state.nextDisplayedTicket}
              currentDisplayedProgram={state.currentDisplayedProgram}
              currentDisplayedTicket={state.currentDisplayedTicket}
              selectedFaculty={state.selectedFaculty}
              selectedConcern={state.selectedConcern}
              otherConcern={state.otherConcern}
              isLoading={state.isLoading}
              facultyList={state.facultyList}
              concernsList={state.concernsList}
              facultyModalVisible={state.facultyModalVisible}
              concernModalVisible={state.concernModalVisible}
              specificDetails={state.specificDetails}
              handleDone={handleDone}
              handleCancel={handleCancel}
              handleRequest={handleRequest}
              setFacultyModalVisible={state.setFacultyModalVisible}
              setConcernModalVisible={state.setConcernModalVisible}
              setSelectedFaculty={state.setSelectedFaculty}
              setSelectedConcern={state.setSelectedConcern}
              setOtherConcern={state.setOtherConcern}
              setSpecificDetails={state.setSpecificDetails}
              proofOfPaymentImage={proofOfPaymentImage}
               setProofOfPaymentImage={setProofOfPaymentImage}
            />
          )}
          <AlertModal 
            isVisible={state.isAlertModalVisible}
            title={state.alertTitle}
            message={state.alertMessage}
            buttons={state.alertButtons}
            onClose={() => {
              state.setIsAlertModalVisible(false);
              state.setAlertButtons([]); // Reset buttons when closing
              if (state.alertTitle === 'Faculty Unavailable') {
                state.setSelectedFaculty('');
                state.setSelectedConcern('');
                state.setOtherConcern('');
                state.setSpecificDetails('');
              }
            }}
          />
        </LinearGradient>
      );
    }
