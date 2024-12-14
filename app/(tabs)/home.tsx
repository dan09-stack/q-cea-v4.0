import { View, Text, TextInput, StyleSheet, Button, ActivityIndicator, Alert, ImageBackground, Modal, TouchableOpacity, Pressable } from 'react-native';
import React, { useEffect, useState } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { auth, db } from '@/firebaseConfig';
import { collection, doc, getDoc, getDocs, onSnapshot, updateDoc } from 'firebase/firestore';

export default function Home() {
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [selectedConcern, setSelectedConcern] = useState('');
  const [otherConcern, setOtherConcern] = useState('');
  const [isRequested, setIsRequested] = useState(false);
  const [ticketNumber, setTicketNumber] = useState('');
  const [userTicketNumber, setUserTicketNumber] = useState('');
  const [facultyList, setFacultyList] = useState<Array<{id: string, fullName: string, status: string}>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingRequest, setIsCheckingRequest] = useState(true);
  const [facultyModalVisible, setFacultyModalVisible] = useState(false);
  const [concernModalVisible, setConcernModalVisible] = useState(false);
  const [isTicketLoading, setIsTicketLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        setIsCheckingRequest(true);
        const facultyCollectionRef = collection(db, 'faculty');
        
        const userRef = doc(db, 'student', user.uid);
        const userUnsubscribe = onSnapshot(userRef, (doc) => {
          if (doc.exists()) {
            const userData = doc.data();
            if (userData.status === 'waiting') {
              setIsRequested(true);
              setUserTicketNumber(userData.userTicketNumber);
            } else {
              setIsRequested(false);
            }
          }
          setIsTicketLoading(false);
          setIsCheckingRequest(false);
        });
  
        const facultyUnsubscribe = onSnapshot(facultyCollectionRef, (snapshot) => {
          const faculty = snapshot.docs.map(doc => ({
            id: doc.id,
            fullName: doc.data().fullName || '',
            status: doc.data().status || 'OFFLINE'
          }));
          setFacultyList(faculty);
        });
  
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
        };
      } else {
        setIsCheckingRequest(false);
      }
    });
  
    return () => unsubscribeAuth();
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
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }
  
      const ticketRef = doc(db, 'ticketNumberCounter', 'ticket');
      const ticketSnap = await getDoc(ticketRef);
      
      if (ticketSnap.exists()) {
        const currentNumber = ticketSnap.data().ticketNum;
        const newNumber = currentNumber + 1;
        
        await updateDoc(ticketRef, {
          ticketNum: newNumber
        });
  
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
      source={require('../../assets/images/green.png')}
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
              <TouchableOpacity 
                style={styles.pickerButton}
                onPress={() => setFacultyModalVisible(true)}
              >
                <Text style={styles.pickerButtonText}>
                  {selectedFaculty || "Select Faculty"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.pickerButton}
                onPress={() => setConcernModalVisible(true)}
              >
                <Text style={styles.pickerButtonText}>
                  {selectedConcern || "Select your concern"}
                </Text>
              </TouchableOpacity>

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

              {/* Faculty Modal */}
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

              {/* Concern Modal */}
              <Modal
                animationType="slide"
                transparent={true}
                visible={concernModalVisible}
                onRequestClose={() => setConcernModalVisible(false)}
              >
                <View style={styles.modalContainer}>
                  <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Select Concern</Text>
                    <Pressable
                      style={styles.modalItem}
                      onPress={() => {
                        setSelectedConcern('concernA');
                        setConcernModalVisible(false);
                      }}
                    >
                      <Text style={styles.modalItemText}>Concern A</Text>
                    </Pressable>
                    <Pressable
                      style={styles.modalItem}
                      onPress={() => {
                        setSelectedConcern('concernB');
                        setConcernModalVisible(false);
                      }}
                    >
                      <Text style={styles.modalItemText}>Concern B</Text>
                    </Pressable>
                    <Button title="Close" onPress={() => setConcernModalVisible(false)} color="#004000" />
                  </View>
                </View>
              </Modal>
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
    width: '100%',
    height: '100%',
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
  pickerButton: {
    backgroundColor: '#004000',
    padding: 15,
    borderRadius: 5,
    marginVertical: 5,
  },
  pickerButtonText: {
    color: '#ffffff',
    fontSize: 16,
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#004000',
  },
  modalItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalItemText: {
    fontSize: 16,
  },
});
