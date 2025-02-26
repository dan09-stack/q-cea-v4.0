import { View, Text, ImageBackground, StyleSheet, FlatList, TouchableOpacity, Image, TextInput, Modal } from 'react-native'
import React, { useState, useEffect } from 'react'
import { collection, doc, getDoc, onSnapshot, updateDoc, query, orderBy } from 'firebase/firestore'
import { auth, db } from '@/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';

export default function List() {
  const [facultyData, setFacultyData] = useState<FacultyItem[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [activeSearch, setActiveSearch] = useState(false);
  const [userType, setUserType] = useState('');
  const [displayedTicket, setDisplayedTicket] = useState(0);  

  interface FacultyItem {
    id: string;
    name: string;
    status: 'ONLINE' | 'OFFLINE';
    numOnQueue: number;
  }

  const handleSearch = () => {
    setActiveSearch(true);
  };

  const NoResults = () => (
    <View style={styles.noResultsContainer}>
      <Text style={styles.noResultsText}>No faculty members found</Text>
    </View>
  );

  const filteredFacultyData = !activeSearch 
    ? facultyData 
    : facultyData.filter(faculty =>
        faculty.name.toLowerCase().includes(inputValue.toLowerCase())
      );

  const renderFaculty = ({ item }: { item: FacultyItem }) => (
    <View style={styles.row}>
      <Text style={styles.name}>{item.name}</Text>
      <Text
        style={[
          styles.status,
          { color: item.status === 'ONLINE' ? '#00FF00' : '#FF0000' },
        ]}
      >
        {item.status}
      </Text>
      <Text style={styles.studentCount}>{item.numOnQueue}</Text>
    </View>
  );

  useEffect(() => {
    const facultyCollectionRef = collection(db, 'student');
    const unsubscribe = onSnapshot(facultyCollectionRef, (snapshot) => {
      const faculty: FacultyItem[] = snapshot.docs
        .map(doc => {
          let queueCount = doc.data().numOnQueue || 0;
          
          if (queueCount < 0) {
            const docRef = doc.ref;
            updateDoc(docRef, { numOnQueue: 0 });
            queueCount = 0;
        }

          return {
            id: doc.id,
            name: doc.data().fullName || '',
            status: doc.data().status || 'OFFLINE',
            userType: doc.data().userType || '',
            numOnQueue: queueCount
          };
        })
        .filter(user => user.userType === 'FACULTY')
        .sort((a, b) => {
          if (a.status !== b.status) {
            return a.status === 'ONLINE' ? -1 : 1;
          }
          return a.name.localeCompare(b.name);
        });
      
      setFacultyData(faculty);
      const currentUser = auth.currentUser;
      if (currentUser) {
        const currentUserDoc = snapshot.docs.find(doc => doc.id === currentUser.uid);
        if (currentUserDoc) {
          setUserType(currentUserDoc.data().userType || '');
        }
      }
    });
  
    return () => unsubscribe();
  }, []);
  
  const StudentView = () => (
    <View style={styles.listContainer}>
        <Text style={styles.title}>LIST OF FACULTY</Text>
        <View style={styles.header}>
          <Text style={[styles.headerText, { flex: 1 }]}>NAME</Text>
          <Text style={[styles.headerText, { flex: 1 }]}>STATUS</Text>
          <Text style={[styles.headerText, { flex: 1 }]}>WAITING</Text>
        </View>
        <FlatList
          data={filteredFacultyData}
          keyExtractor={(item) => item.id}
          renderItem={renderFaculty}
          style={styles.list}
          ListEmptyComponent={NoResults}
        />
      </View>
  )

  const FacultyView = () => {
    const [currentFacultyName, setCurrentFacultyName] = useState('');
    const [studentData, setStudentData] = useState<StudentItem[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [historyData, setHistoryData] = useState<CommentItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
  
    interface StudentItem {
      id: string;
      name: string;
      faculty: string;
      concerns: string;
      otherConcern: string;
      ticketNumber: number;
      program: string;
      requestDate: string;
    }

    interface CommentItem {
      id: string;
      comment: string;
      timestamp: any;
      duration?: number;
      durationFormatted?: string;
      faculty: string;
      ticketNumber?: string;
      studentName?: string;
      concern?: string;
      otherConcern?: string;
      specificDetails?: string;
    }

    // Format timestamp for history items
    const formatDate = (timestamp: any) => {
      if (!timestamp) return '';
      return new Date(timestamp.seconds * 1000).toLocaleString('en-US', {
        timeZone: 'Asia/Manila',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    };
  
    useEffect(() => {
      // Existing effect for faculty data and student queue remains unchanged
      const currentUser = auth.currentUser;
      if (currentUser) {
        const userDocRef = doc(db, 'student', currentUser.uid);
        getDoc(userDocRef).then((docSnap) => {
          if (docSnap.exists()) {
            setCurrentFacultyName(docSnap.data().fullName || '');
            setDisplayedTicket(docSnap.data().displayedTicket || 0);
          }
        });
      }
  
      const studentCollectionRef = collection(db, 'student');
      const unsubscribe = onSnapshot(studentCollectionRef, (snapshot) => {
        const students: StudentItem[] = snapshot.docs
        .map(doc => {
          const timestamp = doc.data().requestDate;
          const formattedDate = timestamp ? new Date(timestamp.seconds * 1000).toLocaleString('en-US', {
            timeZone: 'Asia/Manila',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
          }) : '';
      
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
    
    // New effect to fetch history when showHistory changes
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
                timestamp: data.timestamp,
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
        <Text style={[styles.name,{flex: 1.5, width: 100,  textAlign: 'center'}]} >{item.name}</Text>
        <View style={styles.verticalSeparator} />
        <Text style={styles.concerns}>
        {item.concerns !== "Other" ? <Text>{item.concerns}</Text> : null}
        <Text>{item.otherConcern ? `${item.concerns !== "Other" ? "   " : ""}${item.otherConcern}` : ''}</Text>
        </Text>
        <View style={styles.verticalSeparator} />
        <Text style={[styles.name, { flex: 1.5, textAlign: 'center' }]}>{item.requestDate}</Text>
      </View>
    );
    
    const renderHistoryItem = ({ item }: { item: CommentItem }) => (
      <View style={styles.row}>
       <Text style={styles.concerns}>
        {item.concern !== "Other" ? <Text>{item.concern}</Text> : null}
        <Text>{item.otherConcern ? `${item.concern !== "Other" ? "   " : ""}${item.otherConcern}` : ''}</Text>
        - {item.specificDetails || 'N/A'}
        </Text>
        
        <View style={styles.verticalSeparator} />
        <Text style={[styles.name, { flex: 1.2, textAlign: 'center' }]}>
          {item.studentName || 'Unknown'}
        </Text>
        <View style={styles.verticalSeparator} />
        <Text style={[styles.name, { flex: 1.4, textAlign: 'left', paddingHorizontal: 10 }]}>
          {item.comment}
        </Text>
        <View style={styles.verticalSeparator} />
        <Text style={[styles.name, { flex: 1.5, textAlign: 'center' }]}>
          {formatDate(item.timestamp)}  {'\n'} {item.durationFormatted}
        </Text>
      </View>
    );
  
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
          </View>
        </View>
        
        {showHistory ? (
          <>
            <View style={styles.header}>
              <Text style={[styles.headerText, { flex: 1 }]}>CONCERN</Text>
              <Text style={[styles.headerText, { flex: 1.2 }]}>STUDENT</Text>
              <Text style={[styles.headerText, { flex: 1.5 }]}>COMMENT</Text>
              <Text style={[styles.headerText, { flex: 1.5 }]}>TIME</Text>
            </View>
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
              <Text style={[styles.headerText, { flex: 1 }]}>TICKET</Text>
              <Text style={[styles.headerText, { flex: 1.5 }]}>STUDENT</Text>
              <Text style={[styles.headerText, { flex: 1 }]}>CONCERN</Text>
              <Text style={[styles.headerText, { flex: 1.5 }]}>TIME</Text>
            </View>
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
      </View>
    );
  };

  return (
    <ImageBackground
      source={require('../../assets/green p2.jpg')}
      style={styles.background}
    >
       {userType === 'FACULTY' ? <FacultyView /> : <StudentView />}
    </ImageBackground>
  )
}

const styles = StyleSheet.create({
  headerWithButtons: {
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  toggleButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginHorizontal: 5,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'black',
  },
  activeButton: {
    backgroundColor: 'lightgrey',
  },
  buttonText: {
    color: 'black',
    fontWeight: 'bold',
    fontSize: 14,
  },
  activeButtonText: {
    color: 'black',
  },

  verticalSeparator: {
    width: 1,
    height: '100%',
    backgroundColor: 'black',
  },
  concerns: {
    flex: 1,
    flexDirection: 'row',
    fontSize: 16,
    color: 'black',
    textAlign: 'center',
    alignSelf: 'center',
    width: 100,
  },
  studentCount: {
    flex: 1,
    fontSize: 16,
    color: 'black',
    textAlign: 'center',
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 20,
  },
  noResultsText: {
    color: 'black',
    fontSize: 16,
    textAlign: 'center',
  },
  searchContainer: {
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 5,
    marginBottom: 10,
    width: '100%',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    padding: 10,
    color: '#000',
  },
  background: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: '5%',
    paddingVertical: '5%',
  },
  listContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 10,
    marginTop: 0,
    marginBottom: 20,
    maxWidth: 1000,
    width: '95%',
    height: '85%',
    alignSelf: 'center',
  },
  title: {
    fontSize: 25,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 15,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: 'black',
    paddingBottom: 5,
    marginBottom: 10,
  },
  headerText: {
    color: 'black',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 5,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'black',
  },
  name: {
    flex: 1,
    fontSize: 16,
    color: 'black',
    textAlign: 'center',
    alignSelf: 'center' 
  },
  status: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  list: {
    flex: 1,
  },
  iconContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 20,
    width: '100%',
    paddingHorizontal: 20,
  },
  iconImage: {
    width: 50,
    height: 35,
    resizeMode: 'contain',
  },
  icon: {
    marginHorizontal: 50,
    marginVertical: 10,
  },
});
