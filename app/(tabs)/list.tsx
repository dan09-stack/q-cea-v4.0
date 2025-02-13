import { View, Text, ImageBackground, StyleSheet, FlatList, TouchableOpacity, Image, TextInput } from 'react-native'
import React, { useState, useEffect } from 'react'
import { collection, doc, getDoc, onSnapshot } from 'firebase/firestore'
import { auth, db } from '@/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';

export default function List() {
  const [facultyData, setFacultyData] = useState<FacultyItem[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [activeSearch, setActiveSearch] = useState(false);
  const [userType, setUserType] = useState('');
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
        .map(doc => ({
          id: doc.id,
          name: doc.data().fullName || '',
          status: doc.data().status || 'OFFLINE',
          userType: doc.data().userType || '',
          numOnQueue: doc.data().numOnQueue|| 0
        }))
        .filter(user => user.userType === 'FACULTY')
        .sort((a, b) => a.name.localeCompare(b.name));
      
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
        <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search faculty..."
              placeholderTextColor="#999"
              value={inputValue}
              onChangeText={(text) => {
                setInputValue(text);
                if (text === '') {
                  setActiveSearch(false);
                }
              }}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
          <TouchableOpacity onPress={handleSearch}>
            <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          </TouchableOpacity>
        </View>
        <View style={styles.header}>
          <Text style={[styles.headerText, { flex: 1 }]}>NAME</Text>
          <Text style={[styles.headerText, { flex: 1 }]}>STATUS</Text>
          <Text style={[styles.headerText, { flex: 1 }]}>IN QUEUE</Text>
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
    const [studentData, setStudentData] = useState<StudentItem[]>([]);
    const [currentFacultyName, setCurrentFacultyName] = useState('');
  
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
  
    useEffect(() => {
      // Get current faculty name
      const currentUser = auth.currentUser;
      if (currentUser) {
        const userDocRef = doc(db, 'student', currentUser.uid);
        getDoc(userDocRef).then((docSnap) => {
          if (docSnap.exists()) {
            setCurrentFacultyName(docSnap.data().fullName || '');
          }
        });
      }
  
      // Listen for students with matching faculty
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
          .filter(student => student.faculty === currentFacultyName)
          .sort((b,a) => a.ticketNumber - b.ticketNumber); // Sort by ticket number
        
        setStudentData(students);
      });
  
      return () => unsubscribe();
    }, [currentFacultyName]);
  
    const renderStudent = ({ item }: { item: StudentItem }) => (
      <View style={styles.row}>
        <Text style={[styles.name, { flex: 1 }]}>
          {/* {item.program}- */}
          {String(item.ticketNumber).padStart(4, '0')}
        </Text>
        <View style={styles.verticalSeparator} />
        <Text style={[styles.name,{flex: 1.5, width: 100,  textAlign: 'center'}]} >{item.name}</Text>
        <View style={styles.verticalSeparator} />
        <Text style={styles.concerns}>
          <Text>{item.concerns}</Text>
          <Text>{item.otherConcern ? `   ${item.otherConcern}` : ''}</Text>
        </Text>
        <View style={styles.verticalSeparator} />
        <Text style={[styles.name, { flex: 1.5, textAlign: 'center' }]}>{item.requestDate}</Text>
      </View>
    );
  
    return (
      <View style={styles.listContainer}>
        <Text style={styles.title}>LIST OF STUDENT CONCERN</Text>
        <View style={styles.header}>
          <Text style={[styles.headerText, { flex: 1 }]}>TICKET</Text>
          <Text style={[styles.headerText, { flex: 1.5 }]}>STUDENT NAME</Text>
          <Text style={[styles.headerText, { flex: 1 }]}>CONCERN</Text>
          <Text style={[styles.headerText, { flex: 1.5 }]}>QUEUE TIME</Text>
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
  verticalSeparator: {
    width: 1,
    height: '100%',
    backgroundColor: '#ccc',
  },
  concerns: {
    flex: 1,
    flexDirection: 'row',
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    alignSelf: 'center',
    width: 100,
  },
  studentCount: {
    flex: 1,
    fontSize: 16,
    color: '#f3f3f3',
    textAlign: 'center',
    
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 20,
  },
  noResultsText: {
    color: '#f3f3f3',
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
    backgroundColor: '#1f4e21',
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
    color: '#DAF7A6',
    fontSize: 25,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 15,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#f3f3f3',
    paddingBottom: 5,
    marginBottom: 10,
  },
  headerText: {
    color: '#d9ab0e',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 5,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f3f3',
  },
  name: {
    flex: 1,
    fontSize: 16,
    color: '#f3f3f3',
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
