import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Alert, ScrollView, Dimensions, useWindowDimensions } from 'react-native';
import { homeStyles as styles } from '@/constants/home.styles';
import { CustomButton } from '@/components/ui/CustomButton';
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '@/firebaseConfig';
import { CommentSection } from './components/CommentSection';
import { AlertModal } from '@/components/queue/AlertModal';
interface FacultyViewProps {
  allTickets: string[];
  currentTicketIndex: number;
  ticketStudentData: { 
    name: string; 
    concern: string; 
    program: string;
    otherConcern?: string;
    specificDetails?: string;
  };
  handleBack: () => void;
  handleNext: () => void;
}

interface Comment {
  id: string;
  comment: string;
  timestamp: any;
  duration?: number;
  durationFormatted?: string;
  faculty: string;
}

export const FacultyView = ({ 
  allTickets, 
  currentTicketIndex, 
  ticketStudentData, 
  handleBack, 
  handleNext: originalHandleNext 
}: FacultyViewProps) => {
  const [nextClickTime, setNextClickTime] = useState<Date | null>(null);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [comment, setComment] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [facultyName, setFacultyName] = useState('');
  // Get window dimensions for responsive layout
  const { width } = useWindowDimensions();
  const isSmallScreen = width <= 700;
  const handleNext = () => {
    setNextClickTime(new Date());
    originalHandleNext();
  };
  const currentTicketNumber = allTickets[currentTicketIndex] 
    ? `${ticketStudentData.program}-${allTickets[currentTicketIndex]}` 
    : '';

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
  const handleAddComment = async () => {
    if (!comment.trim()) {
      Alert.alert('Error', 'Please enter a comment');
      return;
    }
  
    if (!currentTicketNumber) {
      Alert.alert('Error', 'No active ticket to comment on');
      return;
    }
  
    setIsSaving(true);
    try {
      // Calculate duration since next was clicked
      const saveTime = new Date();
      const duration = nextClickTime ? (saveTime.getTime() - nextClickTime.getTime()) / 1000 : 0; // Duration in seconds
      
      // Create a comment data object with duration information
      const commentData = {
        ticketNumber: currentTicketNumber,
        studentName: ticketStudentData.name,
        comment: comment,
        concern: ticketStudentData.concern || null,
        specificDetails: ticketStudentData.specificDetails || null,
        otherConcern: ticketStudentData.otherConcern || null,
        timestamp: serverTimestamp(),
        duration: duration, // Duration in seconds
        durationFormatted: formatDuration(duration), // Human-readable duration
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
      
      setModalMessage('Comment saved successfully');
      setIsModalVisible(true);
      setComment(''); // Clear the comment field
      
      // Reset the nextClickTime to stop the timer
      setNextClickTime(null);
    } catch (error) {
      console.error('Error saving comment:', error);
      Alert.alert('Error', 'Failed to save comment. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  
  // Format duration from seconds to a human-readable string
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

  // Student information section component
  const StudentInfoSection = () => (
    <View style={{
      flex: isSmallScreen ? undefined : 1, 
      marginRight: isSmallScreen ? 0 : 10, 
      marginBottom: isSmallScreen ? 15 : 0,
      padding: 10, 
      borderWidth: 1, 
      borderColor: '#eee', 
      borderRadius: 5
    }}>
      <Text style={[styles.boldText, {fontSize: 20, marginBottom: 15, textAlign: 'center'}]}>Student Information</Text>
      
      <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', }}>
        <Text style={[styles.boldText, {fontSize: 18}]}>Student Name:</Text>
        <Text style={[styles.details, {fontSize: 18}]}>{allTickets.length === 0 ? 'No students in queue' : ticketStudentData.name}</Text>
      </View>
            
      <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={[styles.boldText, {fontSize: 18}]}>Concern:</Text>
        <Text style={[styles.details, {fontSize: 18}]}>{allTickets.length === 0 ? 'No concerns to display' : ticketStudentData.concern}</Text>
      </View>

      {/* Display Other Concern if available */}
      {ticketStudentData.otherConcern && (
        <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
          <Text style={[styles.boldText, {fontSize: 18}]}>Other Concern:</Text>
          <Text style={[styles.details, {fontSize: 18}]}>{ticketStudentData.otherConcern}</Text>
        </View>
      )}
            
      {/* Display Specific Details if available */}
      {ticketStudentData.specificDetails && (
        <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={[styles.boldText, {fontSize: 18}]}>Specific Details:</Text>
          <Text style={[styles.details, {fontSize: 18}]}>{ticketStudentData.specificDetails}</Text>
        </View>
      )}
    </View>
  );

  // Comment section component
 

  return (
    <View style={[styles.container, {width: '100%', maxWidth: 900, }]}>
      <AlertModal
      isVisible={isModalVisible}
      title="Success"
      message={modalMessage}
      onClose={() => setIsModalVisible(false)}
      style={{ maxWidth: 100, alignSelf: 'center' }}
    />
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
          <Text style={[styles.ticketNumber, {color:'#d9ab0e', fontSize: 22}]}>STUDENT TICKET NUMBER</Text>
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
            <StudentInfoSection />
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
            <CustomButton title="NEXT" onPress={handleNext} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};
