import { View, ImageBackground, StyleSheet, TextInput } from 'react-native'
import React, { useState, useEffect } from 'react'
import { collection, doc, onSnapshot, updateDoc } from 'firebase/firestore'
import { auth, db } from '@/firebaseConfig';
import { FacultyItem } from '@/app(tabs)/interfaces';
import { FacultyView } from '@/app(tabs)/components/FacultyView';
import { StudentView } from '@/app(tabs)/components/StudentView';


export default function List() {
  const [facultyData, setFacultyData] = useState<FacultyItem[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [activeSearch, setActiveSearch] = useState(false);
  const [userType, setUserType] = useState('');
  const [displayedTicket, setDisplayedTicket] = useState(0);  

  const handleSearch = () => {
    setActiveSearch(true);
  };

  const filteredFacultyData = !activeSearch 
    ? facultyData 
    : facultyData.filter(faculty =>
        faculty.name.toLowerCase().includes(inputValue.toLowerCase())
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
          if (currentUserDoc.data().userType === 'FACULTY') {
            setDisplayedTicket(currentUserDoc.data().displayedTicket || 0);
          }
        }
      }
    });
  
    return () => unsubscribe();
  }, []);

  return (
    <ImageBackground
      source={require('../../assets/green p2.jpg')}
      style={styles.background}
    >
      {userType === 'FACULTY' ? (
        <FacultyView styles={styles} displayedTicket={displayedTicket} />
      ) : (
        <StudentView 
          facultyData={facultyData} 
          filteredFacultyData={filteredFacultyData} 
          styles={styles} 
        />
      )}
    </ImageBackground>
  );
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
  appointmentButton: {
    backgroundColor: '#3498db',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
