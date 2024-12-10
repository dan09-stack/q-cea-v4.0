import { View, Text, TextInput, StyleSheet, Button, ActivityIndicator, Alert, ImageBackground } from 'react-native';
import React, { useEffect, useState } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Picker } from '@react-native-picker/picker';
import { auth, db } from '@/firebaseConfig';
import { collection, doc, getDoc, getDocs, onSnapshot, updateDoc } from 'firebase/firestore';
export default function Home() {
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [selectedConcern, setSelectedConcern] = useState('');
  const [otherConcern, setOtherConcern] = useState('');
  const [isRequested, setIsRequested] = useState(false); // Track whether the request was made
  const [ticketNumber, setTicketNumber] = useState('');
  const [userTicketNumber, setUserTicketNumber] = useState('');
  const [facultyList, setFacultyList] = useState<Array<{id: string, fullName: string, status: string}>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingRequest, setIsCheckingRequest] = useState(true);

  useEffect(() => {
    const currentUser = auth.currentUser;
    setIsCheckingRequest(true);
    // Replace the fetchFaculty function with real-time listener
    const facultyCollectionRef = collection(db, 'faculty');
    const unsubscribeFaculty = onSnapshot(facultyCollectionRef, (snapshot) => {
      const faculty = snapshot.docs.map(doc => ({
        id: doc.id,
        fullName: doc.data().fullName || '',
        status: doc.data().status || 'OFFLINE'
      }));
      setFacultyList(faculty);
    });
  
    // Existing ticket number listeners...
    if (currentUser) {
      // Add this listener to check ticket status
      const userRef = doc(db, 'student', currentUser.uid);
      const userUnsubscribe = onSnapshot(userRef, (doc) => {
        if (doc.exists()) {
          const userData = doc.data();
          // If user has an active ticket (status is 'waiting'), show ticket container
          if (userData.status === 'waiting') {
            setIsRequested(true);
          } else {
            setIsRequested(false);
          }
          setUserTicketNumber(userData.userTicketNumber);
        }
        setIsCheckingRequest(false);
      });
  
      const ticketRef = doc(db, 'ticketNumberCounter', 'ticket');
      const ticketUnsubscribe = onSnapshot(ticketRef, (doc) => {
        if (doc.exists()) {
          setTicketNumber(doc.data().ticketNum);
        }
      });
  
      // Clean up all listeners
      return () => {
        userUnsubscribe();
        unsubscribeFaculty();
        userUnsubscribe();
        ticketUnsubscribe();
      };
    }else {
      setIsCheckingRequest(false); // Stop loading if no user
    }
    
    // Clean up faculty listener if no user
    return () => unsubscribeFaculty();
  }, []);
  
  

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
      // Get current user ID from Firebase Auth
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }
  
      // Update ticket counter
      const ticketRef = doc(db, 'ticketNumberCounter', 'ticket');
      const ticketSnap = await getDoc(ticketRef);
      
      if (ticketSnap.exists()) {
        const currentNumber = ticketSnap.data().ticketNum;
        const newNumber = currentNumber + 1;
        
        // Update ticket counter
        await updateDoc(ticketRef, {
          ticketNum: newNumber
        });
  
        // Add ticket data to user's document
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
  

  return (
    <ImageBackground
      source={require('../../assets/green p2.jpg')}
      style={styles.background}
    >
      <View style={styles.container}>
        {isCheckingRequest ? (
          <ActivityIndicator size="large" color="#004000" />
        ) : (
          isRequested ? (
            <View style={styles.ticketContainer}>
              <Text style={styles.headerText}>{ticketNumber}</Text>
              <Text style={styles.subHeaderText}>People in front of you: 2</Text>
              <View style={styles.ticketDetails}>
                <Text style={styles.ticketLabel}>YOUR TICKET NUMBER</Text>
                <Text style={styles.ticketNumber}>{`CPE-${String(userTicketNumber).padStart(4, '0')}`}</Text>
                <View style={styles.ticketInfoContainer}>
                  <View>
                    <Text style={styles.ticketLabel}>NEXT SERVING</Text>
                    <Text style={styles.ticketInfo}>ECE-0009</Text>
                  </View>
                  <View>
                    <Text style={styles.ticketLabel}>NOW SERVING</Text>
                    <Text style={styles.ticketInfo}>ARC-0008</Text>
                  </View>
                </View>
                <Text style={styles.waitText}>PLEASE WAIT</Text>
              </View>
              <View style={styles.buttonContainer}>
                <Button title="Cancel" onPress={handleCancel} color="#004000" />
              </View>
            </View>
          ) : (
            <View style={styles.formGroup}>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedFaculty}
                  onValueChange={(itemValue) => setSelectedFaculty(itemValue)}
                  style={styles.picker}
                >
                  <Picker.Item label="Select Faculty" value="" />
                  {facultyList
                    .sort((a, b) => a.fullName.localeCompare(b.fullName))
                    .map((faculty) => (
                      <Picker.Item 
                        key={faculty.id}
                        label={faculty.fullName}
                        value={faculty.fullName}
                        color={faculty.status === 'ONLINE' ? '#4CAF50' : '#757575'}
                      />
                    ))}
                </Picker>
              </View>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedConcern}
                  onValueChange={(itemValue) => setSelectedConcern(itemValue)}
                  style={styles.picker}
                >
                  <Picker.Item label="Select your concern" value="" />
                  <Picker.Item label="Concern A" value="concernA" />
                  <Picker.Item label="Concern B" value="concernB" />
                </Picker>
              </View>
              <TextInput
                style={styles.input}
                placeholder="Other concern:"
                placeholderTextColor="#cccccc"
                value={otherConcern}
                onChangeText={(text) => setOtherConcern(text)}
              />
              <View style={styles.buttonContainer}>
                {isLoading ? (
                  <ActivityIndicator size="small" color="#004000" />
                ) : (
                  <Button 
                    title="Request" 
                    onPress={handleRequest} 
                    color="#004000"
                    disabled={isLoading}
                  />
                )}
              </View>
            </View>
          )
        )}
      </View>
    </ImageBackground>
  );
  
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ticketInfoContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  formGroup: {
    padding: 20,
    borderRadius: 10,
    width: 360,
    marginBottom: 20,
    backgroundColor: '#ffffff',
  },
  pickerContainer: {
    backgroundColor: '#004000',
    borderRadius: 5,
    overflow: 'hidden',
    marginVertical: 5,
  },
  picker: {
    width: '100%',
    color: '#ffffff',
  },
  input: {
    backgroundColor: '#004000',
    color: '#ffffff',
    padding: 10,
    marginTop: 5,
    marginBottom: 10,
    borderRadius: 5,
    height: 100,
    textAlignVertical: 'top', 
  },
  buttonContainer: {
    marginTop: 10,
    width: '100%',
    borderRadius: 5,
  },
  ticketContainer: {
    
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 10,
    width: 360,

  },
  headerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 5,
  },
  subHeaderText: {
    fontSize: 14,
    color: '#555555',
    marginBottom: 10,
  },
  ticketDetails: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 10,
  },
  ticketLabel: {
    fontSize: 14,
    color: '#777777',
  },
  ticketNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#004000',
    marginVertical: 5,
  },
  ticketInfo: {
    fontSize: 18,
    color: '#333333',
    marginVertical: 2,
  },
  waitText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#004000',
    marginTop: 15,
  },
});
