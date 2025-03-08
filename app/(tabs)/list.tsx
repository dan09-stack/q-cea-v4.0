import { View, ImageBackground, StyleSheet, TextInput } from 'react-native'
import React, { useState, useEffect } from 'react'
import { collection, doc, onSnapshot, updateDoc } from 'firebase/firestore'
import { auth, db } from '@/firebaseConfig';
import { FacultyItem } from '@/utils/interfaces';
import { FacultyView } from '@/components/FacultyView';
import { StudentView } from '@/components/StudentView';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { getContrastTextColor, shadeColor } from '@/utils/themeUtils';
import { GradientBackgroundContainer } from '@/components/ui/GradientBackgroundContainer';


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
// Get theme colors from the context
  const { colors } = useTheme();
    
  // Calculate text color based on background color
  const textColor = getContrastTextColor(colors.backgroundColor);

  // Create gradient colors
  const gradientColors = [
    colors.backgroundColor,
    shadeColor(colors.backgroundColor, -20),
    shadeColor(colors.backgroundColor, -40)
  ] as readonly [string, string, string];
  return (
    <GradientBackgroundContainer style={styles.container}>
      {userType === 'FACULTY' ? (
        <FacultyView styles={styles} displayedTicket={displayedTicket} />
      ) : (
        <StudentView 
          facultyData={facultyData} 
          filteredFacultyData={filteredFacultyData} 
          styles={styles} 
        />
      )}
      </GradientBackgroundContainer>
  );
}

const styles = StyleSheet.create({
  backButton: {
    padding: 8,
    borderRadius: 5,
  },
  backButtonText: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'black',
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'black',
  },
  modalBody: {
    maxHeight: '70%',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  detailLabel: {
    fontWeight: 'bold',
    width: 80,
    color: '#687076',
  },
  detailText: {
    flex: 1,
    color: '#11181C',
  },
  commentContainer: {
    marginTop: 10,
    marginBottom: 15,
  },
  commentText: {
    marginTop: 5,
    color: '#11181C',
    fontSize: 16,
    lineHeight: 22,
  },
  closeButton: {
    backgroundColor: '#008000',
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
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
    backgroundColor: '#034041', 
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    paddingBottom:32,
    backgroundColor: '#1f4e21',
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
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
    borderColor: 'black',
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
