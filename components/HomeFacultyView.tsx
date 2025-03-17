import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Alert, ScrollView, Dimensions, useWindowDimensions, TouchableOpacity, Image, Modal, FlatList } from 'react-native';
import { homeStyles as styles } from '@/constants/home.styles';
import { CustomButton } from '@/components/ui/CustomButton';
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db, auth } from '@/firebaseConfig';
import { CommentSection } from './HomeCommentSection';
import { AlertModal } from '@/components/queue/AlertModal';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { StudentInfoSection } from './StudentInfoSection';

interface FacultyViewProps {
  allTickets: string[];
  currentTicketIndex: number;
  ticketStudentData: { 
    name: string; 
    concern: string; 
    program: string;
    otherConcern?: string;
    specificDetails?: string;
    proofOfPaymentImage?: string | null; 
  };
  handleBack: () => void;
  handleNext: () => void;
  updateTickets?: (tickets: string[]) => void; // Added prop for updating tickets
}

interface Comment {
  id: string;
  comment: string;
  timestamp: any;
  duration?: number;
  durationFormatted?: string;
  faculty: string;
}

interface Faculty {
  id: string;
  fullName: string;
  status: string;
  program?: string;
}

interface FacultyItem {
  id: string;
  fullName: string;
  status: string;
  program?: string;
  numOnQueue: number;
  userType: string;
}


export const FacultyView = ({ 
  allTickets, 
  currentTicketIndex, 
  ticketStudentData, 
  handleBack, 
  handleNext: originalHandleNext,
  updateTickets
}: FacultyViewProps) => {
  const [nextClickTime, setNextClickTime] = useState<Date | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [comment, setComment] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [facultyName, setFacultyName] = useState('');
  const [ticketCancelled, setTicketCancelled] = useState(false);
  const { colors } = useTheme();
  // Get window dimensions for responsive layout
  const { width } = useWindowDimensions();
  const isSmallScreen = width <= 700;
  
  // New state for transfer student functionality
  const [transferModalVisible, setTransferModalVisible] = useState(false);
  const [facultyList, setFacultyList] = useState<FacultyItem[]>([]);
  const [isTransferring, setIsTransferring] = useState(false);
  const [studentToTransferId, setStudentToTransferId] = useState('');
  const [ticketLoadTime, setTicketLoadTime] = useState<Date | null>(null);

  const handleNext = () => {
    setNextClickTime(new Date());
    originalHandleNext();
  };
  
  const currentTicketNumber = allTickets[currentTicketIndex] 
    ? `${ticketStudentData.program}-${allTickets[currentTicketIndex]}` 
    : '';

    useEffect(() => {
      if (!transferModalVisible) return;
      
      setIsLoading(true);
      
      const facultyCollectionRef = collection(db, 'student');
      
      const unsubscribe = onSnapshot(facultyCollectionRef, (snapshot) => {
        const facultyItems: FacultyItem[] = snapshot.docs
          .map(doc => {
            const data = doc.data();
            let queueCount = data.numOnQueue || 0;
            
            if (queueCount < 0) {
              queueCount = 0;
            }
            
            return {
              id: doc.id,
              fullName: data.fullName || '',
              status: data.status || 'OFFLINE',
              program: data.program || '',
              userType: data.userType || 'FACULTY',
              numOnQueue: queueCount
            };
          })
          // Filter to include only faculty with valid fullName
          .filter(user => 
            user.userType === 'FACULTY' && 
            user.fullName && 
            user.fullName.trim() !== ''
          )
          .sort((a, b) => {
            if (a.status !== b.status) {
              return a.status === 'ONLINE' ? -1 : 1;
            }
            if (a.numOnQueue !== b.numOnQueue) {
              return a.numOnQueue - b.numOnQueue;
            }
            return a.fullName.localeCompare(b.fullName);
          });
          
        setFacultyList(facultyItems);
        setIsLoading(false);
      });
      
      return () => unsubscribe();
    }, [transferModalVisible]);
    
    useEffect(() => {
      if (ticketStudentData.name && !ticketLoadTime) {
        setTicketLoadTime(new Date());
      } else if (!ticketStudentData.name) {
        setTicketLoadTime(null);
      }
    }, [ticketStudentData.name]);
  // Add real-time listener for tickets
  useEffect(() => {
    // Only set up the listener if we need to
    const shouldListenForTickets = 
      allTickets.length > 0 && 
      !allTickets[currentTicketIndex];
    
    if (!shouldListenForTickets) {
      setTicketCancelled(false);
      return;
    }
    
    setTicketCancelled(true);
    
    // Set up a listener for new tickets in the queue collection
    const ticketsQuery = query(collection(db, 'queue'), orderBy('timestamp', 'asc'));
    
    const unsubscribe = onSnapshot(ticketsQuery, (snapshot) => {
      const newTickets: string[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.ticketNumber) {
          newTickets.push(data.ticketNumber);
        }
      });
      
      // If we have new tickets and the updateTickets prop exists
      if (newTickets.length !== allTickets.length && updateTickets) {
        updateTickets(newTickets);
        
        // If current ticket was cancelled and there are new tickets
        if (ticketCancelled && newTickets.length > 0) {
          setModalMessage('New tickets have been added to the queue');
          setIsModalVisible(true);
        }
      }
    });
    
    // Clean up listener
    return () => unsubscribe();
  }, [allTickets, currentTicketIndex, ticketCancelled, updateTickets]);

  // Fetch previous comments when ticket changes
  useEffect(() => {
    if (!currentTicketNumber) return;
    
    const fetchComments = async () => {
      setIsLoading(true);
      try {
        const q = query(
          collection(db, 'ticketComments'),
          where('ticketNumber', '==', currentTicketNumber),
          orderBy('timestamp', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        const fetchedComments: Comment[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          fetchedComments.push({
            id: doc.id,
            comment: data.comment,
            timestamp: data.timestamp,
            faculty: data.faculty
          });
        });
        
        setComments(fetchedComments);
      } catch (error) {
        console.error("Error fetching comments:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchComments();
  }, [currentTicketNumber]);

  // Get faculty information when component mounts
  useEffect(() => {
    const fetchFacultyInfo = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        try {
          const facultyDoc = await getDoc(doc(db, 'student', currentUser.uid));
          if (facultyDoc.exists()) {
            const facultyData = facultyDoc.data();
            setFacultyName(facultyData.fullName);
          }
        } catch (error) {
          console.error("Error fetching faculty information:", error);
        }
      }
    };
    
    fetchFacultyInfo();
  }, []);

  useEffect(() => {
    if (allTickets.length > 0 && !allTickets[currentTicketIndex]) {
      handleBack();
    }
  }, [allTickets, currentTicketIndex]);
  
  // Fetch faculty list for transfer functionality
  const fetchFacultyList = async () => {
    try {
      setIsLoading(true);
      const q = query(
        collection(db, 'student'),
        where('userType', '==', 'FACULTY')
      );
      
      const querySnapshot = await getDocs(q);
      const facultyItems: FacultyItem[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        facultyItems.push({
          id: doc.id,
          fullName: data.fullName || '',
          status: data.status || 'OFFLINE',
          program: data.program || '',
          numOnQueue: data.numOnQueue || 0,
          userType: data.userType || 'FACULTY'
        });
      });
      
      setFacultyList(facultyItems);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching faculty list:", error);
      setIsLoading(false);
      Alert.alert('Error', 'Failed to load faculty list. Please try again.');
    }
  };
  
  const handleTransferClick = async () => {
    if (!ticketStudentData.name) {
      Alert.alert('Error', 'No student information available');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Find student by name
      const q = query(
        collection(db, 'student'),
        where('fullName', '==', ticketStudentData.name)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        Alert.alert('Error', 'Student not found in database');
        setIsLoading(false);
        return;
      }
      
      // Get the first matching student
      querySnapshot.forEach((doc) => {
        setStudentToTransferId(doc.id);
      });
      
      // Show transfer modal - the faculty list will be loaded by the useEffect
      setTransferModalVisible(true);
      
    } catch (error) {
      console.error("Error preparing transfer:", error);
      Alert.alert('Error', 'Failed to prepare transfer. Please try again.');
      setIsLoading(false);
    }
  };
  
  
  // Handle faculty selection and transfer
  const handleTransferStudent = async (selectedFacultyId: string) => {
    if (!studentToTransferId || !selectedFacultyId) {
      Alert.alert('Error', 'Student or faculty information missing');
      return;
    }
    
    try {
      setIsTransferring(true);
      
      // Get selected faculty info
      const selectedFaculty = facultyList.find(f => f.id === selectedFacultyId);
      
      if (!selectedFaculty) {
        throw new Error('Selected faculty not found');
      }
      
      // Update student's faculty assignment
      const ticketRef = doc(db, 'ticketNumberCounter', 'ticket');
      const ticketSnap = await getDoc(ticketRef);
      const currentNumber = ticketSnap.data()?.ticketNum;
        const newNumber = currentNumber + 1;

      const studentRef = doc(db, 'student', studentToTransferId);
      await updateDoc(ticketRef, {
        ticketNum: newNumber
      });
      await updateDoc(studentRef, {
        assignedFaculty: selectedFacultyId,
        faculty: selectedFaculty.fullName,
        userTicketNumber: newNumber
      });
      
      // Add a record of the transfer
      await addDoc(collection(db, 'transferLogs'), {
        studentId: studentToTransferId,
        studentName: ticketStudentData.name,
        fromFacultyId: auth.currentUser?.uid || '',
        fromFacultyName: facultyName,
        toFacultyId: selectedFacultyId,
        toFacultyName: selectedFaculty.fullName,
        timestamp: serverTimestamp(),
        ticketNumber: allTickets[currentTicketIndex] || ''
      });
      
      // Close modal and show success message
      setTransferModalVisible(false);
      setModalMessage(`Student transferred to ${selectedFaculty.fullName} successfully`);
      setIsModalVisible(true);
      
    } catch (error) {
      console.error("Error transferring student:", error);
      Alert.alert('Error', 'Failed to transfer student. Please try again.');
    } finally {
      setIsTransferring(false);
    }
  };
  
  const handleAddComment = async () => {
    // if (!comment.trim()) {
    //   Alert.alert('Error', 'Please enter a comment');
    //   return;
    // }
  
    if (!currentTicketNumber) {
      Alert.alert('Error', 'No active ticket to comment on');
      return;
    }
    if (ticketStudentData.name == null) {
      return;
    }
  
    setIsSaving(true);
    try {
      // Calculate duration since next was clicked
      const saveTime = new Date();
      const duration = ticketLoadTime ? (saveTime.getTime() - ticketLoadTime.getTime()) / 1000 : 0;
      const commentData = {
        ticketNumber: currentTicketNumber,
        studentName: ticketStudentData.name,
        comment: comment,
        concern: ticketStudentData.concern || null,
        specificDetails: ticketStudentData.specificDetails || null,
        otherConcern: ticketStudentData.otherConcern || null,
        timestamp: serverTimestamp(),
        duration: duration, // Duration in seconds
        durationFormatted: formatDuration(duration), 
        faculty: facultyName,
        createdAt: saveTime.toISOString()
      };
      
      const docRef = await addDoc(collection(db, 'ticketComments'), commentData);
      
      // Add the new comment to the local state with duration information
      const newComment = {
        id: docRef.id,
        comment: comment,
        timestamp: { toDate: () => saveTime },
        duration: duration,
        durationFormatted: formatDuration(duration),
        faculty: facultyName
      };
      
      setComments([newComment, ...comments]);
      
      // setModalMessage('Comment saved successfully');
      // setIsModalVisible(true);
      setComment(''); // Clear the comment field

      setTicketLoadTime(new Date());
    } catch (error) {
      console.error('Error saving comment:', error);
      Alert.alert('Error', 'Failed to save comment. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  const formatDuration = (seconds: number): string => {
    if (!seconds) return 'N/A';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    
    if (minutes === 0) {
      return `${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''}`;
    }
    
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''}`;
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleString();
    } catch (e) {
      return 'Date unavailable';
    }
  };
  const [paymentProofVisible, setPaymentProofVisible] = useState(false);
  const [paymentProofUrl, setPaymentProofUrl] = useState('');

  const viewPaymentProof = async () => {
    console.log("Button clicked", ticketStudentData.proofOfPaymentImage);

    if (!currentTicketNumber) return;
    
    try {
      // Add console logs to troubleshoot
      console.log("Looking for ticket:", allTickets[currentTicketIndex]);
      console.log("Current full ticket number:", currentTicketNumber);
      
      // Try querying with just the number part first
      let queueRef = query(
        collection(db, 'student'), 
        where('ticketNumber', '==', allTickets[currentTicketIndex])
      );
      setPaymentProofUrl(ticketStudentData.proofOfPaymentImage || '');
      setPaymentProofVisible(true);
      console.log("Modal should be visible now");

    } catch (error) {
      console.error('Error fetching payment proof:', error);
      Alert.alert('Error', 'Failed to load payment proof.');
    }
  };

  const PaymentProofModal = () => (
    <Modal
      visible={paymentProofVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setPaymentProofVisible(false)}
    >
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
      }}>
        <View style={{
          backgroundColor: 'white',
          borderRadius: 10,
          padding: 15,
          width: '100%',
          maxWidth: 600,
          maxHeight: '80%'
        }}>
          <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15}}>
            <Text style={{fontSize: 18, fontWeight: 'bold'}}>Payment Proof</Text>
            <TouchableOpacity onPress={() => setPaymentProofVisible(false)}>
              <Ionicons name="close" size={24} color="black" />
            </TouchableOpacity>
          </View>
          
          <ScrollView>
            {paymentProofUrl ? (
              <Image
                source={{uri: paymentProofUrl}}
                style={{width: '100%', height: 400, resizeMode: 'contain'}}
              />
            ) : (
              <Text style={{color: 'gray', fontStyle: 'italic', textAlign: 'center'}}>No payment proof image available</Text>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
  
  // New Transfer Modal Component
  const TransferModal = () => (
    <Modal
      visible={transferModalVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setTransferModalVisible(false)}
    >
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
      }}>
        <View style={{
          backgroundColor: 'white',
          borderRadius: 10,
          padding: 15,
          width: '100%',
          maxWidth: 600,
          maxHeight: '80%'
        }}>
          <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15}}>
            <Text style={{fontSize: 18, fontWeight: 'bold'}}>Transfer Student: {ticketStudentData.name}</Text>
            <TouchableOpacity onPress={() => setTransferModalVisible(false)}>
              <Ionicons name="close" size={24} color="black" />
            </TouchableOpacity>
          </View>
          
          {isLoading ? (
            <Text style={{textAlign: 'center', padding: 20}}>Loading faculty list...</Text>
          ) : (
            <ScrollView>
              <Text style={{marginBottom: 10, fontWeight: 'bold'}}>Select faculty to transfer to:</Text>
              
              {facultyList.length === 0 ? (
                <Text style={{textAlign: 'center', fontStyle: 'italic', color: 'gray'}}>
                  No faculty members available
                </Text>
              ) : (
                facultyList.map((faculty) => (
                  <TouchableOpacity
                    key={faculty.id}
                    style={{
                      padding: 15,
                      borderBottomWidth: 1,
                      borderBottomColor: '#eee',
                      backgroundColor: faculty.id === auth.currentUser?.uid ? '#f0f0f0' : 'white'
                    }}
                    disabled={faculty.id === auth.currentUser?.uid || isTransferring}
                    onPress={() => handleTransferStudent(faculty.id)}
                  >
                    <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                      <View>
                        <Text style={{
                          fontWeight: 'bold',
                          color: faculty.id === auth.currentUser?.uid ? 'gray' : 'black'
                        }}>
                          {faculty.fullName} {faculty.id === auth.currentUser?.uid ? '(Current Faculty)' : ''}
                        </Text>
                        {faculty.program && (
                          <Text style={{color: faculty.id === auth.currentUser?.uid ? 'gray' : '#666'}}>
                            Program: {faculty.program}
                          </Text>
                        )}
                      </View>
                      <View style={{
                        backgroundColor: faculty.status === 'ONLINE' ? '#4CAF50' : '#9E9E9E',
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 12
                      }}>
                        <Text style={{color: 'white', fontSize: 12}}>{faculty.status}</Text>
                      </View>
                    </View>
                    <Text style={{marginTop: 5, color: '#666'}}>
                      Students in queue: {faculty.numOnQueue}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          )}
          
          {isTransferring && (
            <View style={{padding: 15, alignItems: 'center'}}>
              <Text>Transferring student...</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
  

  // Modify the StudentInfoSection component to conditionally show the payment proof button


  const updateQueueCountInFirebase = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    
    const numOnQueue = (allTickets.length - (currentTicketIndex + 1)) < 0 ? 0 : allTickets.length - (currentTicketIndex + 1);
    
    try {
      const userRef = doc(db, 'student', currentUser.uid);
      await updateDoc(userRef, {
        numOnQueue: numOnQueue
      });
      console.log('Updated queue count in Firebase:', numOnQueue);
    } catch (error) {
      console.error('Error updating queue count in Firebase:', error);
    }
  };
  
  useEffect(() => {
    updateQueueCountInFirebase();
  }, [allTickets, currentTicketIndex]);

  return (
    <View style={[styles.container, {width: '100%', maxWidth: 900, }]}>
      <AlertModal
        isVisible={isModalVisible}
        title="Success"
        message={modalMessage}
        onClose={() => setIsModalVisible(false)}
        style={{ maxWidth: 600, alignSelf: 'center' }}
      />
      <PaymentProofModal />
      <TransferModal />
      <ScrollView style={{width: '100%'}}>
        <View style={[styles.ticketBox, {width: '100%'}]}>
          <Text style={styles.queueText}>
            <Text style={styles.boldText}>Students in line:</Text> 
            <Text style={styles.ticketInfo}>
              {allTickets.length > 0 ? 
                ` ${(allTickets.length - (currentTicketIndex + 1)) < 0 ? 0 : allTickets.length - (currentTicketIndex + 1)}` 
                : ' No tickets in line'}
            </Text>
          </Text>
          <Text style={[styles.ticketNumber, {color:'black', fontSize: 22}]}>STUDENT TICKET NUMBER</Text>
          {allTickets.length === 0 ? (
            <View style={[styles.notificationContainer, { alignItems: 'center', padding: 10, backgroundColor: '#f8d7da', borderRadius: 5, margin: 10 }]}>
              <Text style={[styles.ticketCode, { color: '#721c24', fontSize: 16 }]}>
                No tickets in queue
              </Text>
            </View>
          ) : allTickets[currentTicketIndex] ? (
            <Text style={[styles.ticketCode, {color: '#07643d', fontSize: 30}]}>
              {currentTicketNumber}
            </Text>
          ) : (
            <View style={[styles.notificationContainer, { alignItems: 'center', padding: 10, backgroundColor: '#f8d7da', borderRadius: 5, margin: 10 }]}>
              <Text style={[styles.ticketCode, { color: '#721c24', fontSize: 16 }]}>
                Ticket Number has been cancelled by student. 
              </Text>
            </View>
          )}
          
          {/* Responsive layout based on screen width */}
          <View style={{
            flexDirection: isSmallScreen ? 'column' : 'row', 
            width: '100%', 
            marginTop: 10
          }}>
            <StudentInfoSection  
            handleNext={handleNext} 
              isSmallScreen={isSmallScreen}
              ticketStudentData={ticketStudentData}
              allTickets={allTickets}
              viewPaymentProof={viewPaymentProof}
              handleTransferClick={handleTransferClick}
            />
            <CommentSection 
              isSmallScreen={isSmallScreen}
              comment={comment}
              setComment={setComment}
              isSaving={isSaving}
              handleAddComment={handleAddComment}
              allTickets={allTickets}
              isLoading={isLoading}
              comments={comments}
              formatDate={formatDate}
            />
          </View>
          
          <View style={styles.buttonContainer}>
            <CustomButton title="BACK" onPress={handleBack} color="white" disabled={currentTicketIndex === 0} />
            <CustomButton title="NEXT" onPress={() => {
              handleAddComment();
  handleNext();
}} color={colors.accentColor} />
  </View>
        </View>
      </ScrollView>
    </View>
  );
};