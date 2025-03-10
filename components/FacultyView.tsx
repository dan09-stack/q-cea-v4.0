import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { collection, doc, getDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { auth, db } from '@/firebaseConfig';
import { StudentItem, CommentItem } from '../utils/interfaces';
import { formatFullDateTime } from '../utils/formatters';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { formatDate } from '../utils/formatters';

interface FacultyViewProps {
  styles: any;
  displayedTicket: number;
}

export const FacultyView = ({ styles, displayedTicket }: FacultyViewProps) => {
  const [currentFacultyName, setCurrentFacultyName] = useState('');
  const [studentData, setStudentData] = useState<StudentItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [historyData, setHistoryData] = useState<CommentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedComment, setSelectedComment] = useState<CommentItem | null>(null);
  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const userDocRef = doc(db, 'student', currentUser.uid);
      getDoc(userDocRef).then((docSnap) => {
        if (docSnap.exists()) {
          setCurrentFacultyName(docSnap.data().fullName || '');
        }
      });
    }

    const studentCollectionRef = collection(db, 'student');
    const unsubscribe = onSnapshot(studentCollectionRef, (snapshot) => {
      const students: StudentItem[] = snapshot.docs
        .map(doc => {
          const timestamp = doc.data().requestDate;
          const formattedDate = timestamp ? formatFullDateTime(timestamp) : '';
      
          return {
            id: doc.id,
            name: doc.data().fullName || '',
            faculty: doc.data().faculty || '',
            concerns: doc.data().concern || '',
            otherConcern: doc.data().otherConcern|| '',
            ticketNumber: doc.data().userTicketNumber || 0,
            program: doc.data().program ||'',
            requestDate: formattedDate
          };
        })
        .filter(student => 
          student.faculty === currentFacultyName && 
          student.ticketNumber >= displayedTicket
        )
        .sort((a,b) => a.ticketNumber - b.ticketNumber);
      
      setStudentData(students);
    });

    return () => unsubscribe();
  }, [currentFacultyName, displayedTicket]);
  
  useEffect(() => {
    if (showHistory && currentFacultyName) {
      setIsLoading(true);
      const historyQuery = query(
        collection(db, 'ticketComments'),
        orderBy('timestamp', 'desc')
      );
      
      const unsubscribeHistory = onSnapshot(historyQuery, (snapshot) => {
        const comments: CommentItem[] = snapshot.docs
          .map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              comment: data.comment || '',
              timestamp: data.timestamp ? data.timestamp.toDate() : new Date(),
              faculty: data.faculty || '',
              ticketNumber: data.ticketNumber || '',
              studentName: data.studentName || '',
              concern: data.concern || '',
              otherConcern: data.otherConcern || '',
              specificDetails: data.specificDetails || '',
              duration: data.duration || 0,
              durationFormatted: data.durationFormatted || '',
            };
          })
          .filter(comment => comment.faculty === currentFacultyName);
          
        setHistoryData(comments);
        setIsLoading(false);
      });
      
      return () => unsubscribeHistory();
    }
  }, [showHistory, currentFacultyName]);

  const renderStudent = ({ item }: { item: StudentItem }) => (
    <View style={styles.row}>
      <Text style={[styles.name, { flex: 1 }]}>
        {String(item.ticketNumber).padStart(4, '0')}{'\n'}
        {item.concerns !== "Other" ? <Text>{item.concerns}</Text> : null}
        <Text>{item.otherConcern ? `${item.concerns !== "Other" ? "   " : ""}${item.otherConcern}` : ''}</Text>
      </Text>
      <View style={styles.verticalSeparator} />
      <Text style={[styles.name,{flex: 1.5, width: 100, textAlign: 'center'}]} >{item.name}</Text>
      
      <View style={styles.verticalSeparator} />
      <Text style={[styles.name, { flex: 1.5, textAlign: 'center' }]}>{item.requestDate}</Text>
    </View>
  );
  
  const renderHistoryItem = ({ item }: { item: CommentItem }) => (
    <View style={styles.row}>
      <Text style={[styles.concerns,{ flex: 1.5, textAlign: 'center' }]}>
        {item.concern !== "Other" ? <Text>{item.concern}</Text> : null}
        <Text>{item.otherConcern ? `${item.concern !== "Other" ? "   " : ""}${item.otherConcern}` : ''}</Text>
        - {item.specificDetails || 'N/A'}
      </Text>
      <View style={styles.verticalSeparator} />
      <Text style={[styles.name, { flex: 1, textAlign: 'center' }]}>
        {item.studentName || 'Unknown'}
      </Text>
      
      <View style={styles.verticalSeparator} />
      <Text style={[styles.name, { flex: .5, textAlign: 'center' }]}>
        {formatDate(item.timestamp, "MM/dd/yyyy")}  
      </Text>

      <View style={styles.verticalSeparator} />
      <TouchableOpacity 
        style={[styles.name, { flex: .3,  alignItems: 'center', paddingHorizontal: 10 }]}
        onPress={() => {
          setSelectedComment(item);
          setModalVisible(true);
        }}
      >
        <Ionicons name="chatbubble-ellipses" size={20} color="#07643d" />
      </TouchableOpacity>
    </View>
  );
  

  const navigateToAppointments = () => {
    router.push('../appointment');
  };

  return (
    <View style={styles.listContainer}>
      <View style={styles.headerWithButtons}>
        <Text style={styles.title}>
          {showHistory ? 'COMMENT HISTORY' : 'LIST OF STUDENT CONCERN'}
        </Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.toggleButton, !showHistory ? styles.activeButton : null]}
            onPress={() => setShowHistory(false)}
          >
            <Text style={[styles.buttonText, !showHistory ? styles.activeButtonText : null]}>Queue</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, showHistory ? styles.activeButton : null]}
            onPress={() => setShowHistory(true)}
          >
            <Text style={[styles.buttonText, showHistory ? styles.activeButtonText : null]}>History</Text>
          </TouchableOpacity>
          {/* <TouchableOpacity
            style={[
              styles.appointmentButton, 
              { 
                marginLeft: 'auto', 
                paddingHorizontal: 15,
                paddingVertical: 8,
                borderRadius: 5
              }
            ]}
            onPress={navigateToAppointments}
          >
            <Text style={[styles.buttonText, { color: 'black' }]}>Appointments</Text>
          </TouchableOpacity> */}
         
        </View>
      </View>
      
      {showHistory ? (
        <>
          <View style={styles.header}>
            <Text style={[styles.headerText, { flex: 1.5 }]}>CONCERN</Text>
            <Text style={[styles.headerText, { flex: 1 }]}>STUDENT</Text>
            <Text style={[styles.headerText, { flex: .5}]}>DATE</Text>
            <Text style={[styles.headerText, { flex: .5 }]}>COMMENT</Text>
          </View>
                  <View style={{ height: 2, backgroundColor: 'black' }} />
          
          <FlatList
            data={historyData}
            keyExtractor={(item) => item.id}
            renderItem={renderHistoryItem}
            style={styles.list}
            ListEmptyComponent={() => (
              <View style={styles.noResultsContainer}>
                <Text style={styles.noResultsText}>
                  {isLoading ? 'Loading history...' : 'No comment history found'}
                </Text>
              </View>
            )}
          />
        </>
      ) : (
        <>
          <View style={styles.header}>
            <Text style={[styles.headerText, { flex: 1 }]}>TICKET & CONCERN</Text>
            <Text style={[styles.headerText, { flex: 1.5 }]}>STUDENT</Text>
            <Text style={[styles.headerText, { flex: 1.5 }]}>DATE & TIME</Text>
          </View>
          <View style={{ height: 2, backgroundColor: 'black' }} />
          
          <FlatList
            data={studentData}
            keyExtractor={(item) => item.id}
            renderItem={renderStudent}
            style={styles.list}
            ListEmptyComponent={() => (
              <View style={styles.noResultsContainer}>
                <Text style={styles.noResultsText}>No students in queue</Text>
              </View>
            )}
          />
        </>
      )}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Comment Details</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            
            {selectedComment && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Student:</Text>
                  <Text style={styles.detailText}>{selectedComment.studentName}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Concern:</Text>
                  <Text style={styles.detailText}>
                    {selectedComment.concern !== "Other" ? selectedComment.concern : selectedComment.otherConcern}
                  </Text>
                </View>
                
                {selectedComment.specificDetails && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Details:</Text>
                    <Text style={styles.detailText}>{selectedComment.specificDetails}</Text>
                  </View>
                )}
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Date:</Text>
                  <Text style={styles.detailText}>{formatDate(selectedComment.timestamp, "MM/dd/yyyy HH:mm")}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Duration:</Text>
                  <Text style={styles.detailText}>{selectedComment.durationFormatted}</Text>
                </View>
                
                <View style={styles.commentContainer}>
                  <Text style={styles.detailLabel}>Comment:</Text>
                  <Text style={styles.commentText}>{selectedComment.comment}</Text>
                </View>
              </ScrollView>
            )}
            
 
          </View>
        </View>
      </Modal>
    </View>
  );
};