import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, TextInput } from 'react-native';
import { db } from '../../firebaseConfig'; // Update with the correct path to your Firebase config
import { doc, updateDoc, increment, collection, addDoc, onSnapshot } from 'firebase/firestore';
import { Picker } from '@react-native-picker/picker';
import { serverTimestamp } from 'firebase/firestore';

const HomeScreen = () => {
  const [counter, setCounter] = useState<number | null>(null);
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [selectedConcern, setSelectedConcern] = useState('');
  const [otherConcern, setOtherConcern] = useState('');

  // Fetch the universal counter value initially and listen for updates in real-time
  useEffect(() => {
    const docRef = doc(db, 'queueCounters', 'ticketCounter');

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setCounter(docSnap.data()?.counter || 0);
      } else {
        console.error('Document does not exist!');
      }
    });

    return () => unsubscribe(); // Cleanup the listener on unmount
  }, []);

  // Handle request submission
  const handleRequest = async () => {
    const counterDocRef = doc(db, 'queueCounters', 'ticketCounter');
    const userRequestsCollection = collection(db, 'userRequests');

    try {
      // Increment the universal counter
      await updateDoc(counterDocRef, {
        counter: increment(1),
      });

      // Save user-specific request data
      await addDoc(userRequestsCollection, {
        faculty: selectedFaculty,
        concern: selectedConcern,
        otherConcern: otherConcern || null,
        requestID: counter, // Use the current counter value
        createdAt: serverTimestamp(),
      });

      console.log('User request saved to Firestore!');
      console.log('Selected Faculty:', selectedFaculty);
      console.log('Selected Concern:', selectedConcern);
      console.log('Other Concern:', otherConcern);

      // Clear user inputs after submission
      setSelectedFaculty('');
      setSelectedConcern('');
      setOtherConcern('');
    } catch (error) {
      console.error('Error saving data to Firestore:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.counter}>
        {counter !== null ? `Ticket Counter: ${counter}` : 'Loading...'}
      </Text>

      <View style={styles.whitebox}>
        <Text>Faculty:</Text>
        <Picker
          selectedValue={selectedFaculty}
          style={styles.picker}
          onValueChange={(value) => setSelectedFaculty(value)}
        >
          <Picker.Item label="Select Faculty" value="" />
          <Picker.Item label="Faculty A" value="Faculty A" />
          <Picker.Item label="Faculty B" value="Faculty B" />
        </Picker>

        <Text>Concern:</Text>
        <Picker
          selectedValue={selectedConcern}
          style={styles.picker}
          onValueChange={(value) => setSelectedConcern(value)}
        >
          <Picker.Item label="Select Concern" value="" />
          <Picker.Item label="Concern A" value="Concern A" />
          <Picker.Item label="Concern B" value="Concern B" />
        </Picker>

        <TextInput
          style={styles.input}
          placeholder="Other Concern"
          value={otherConcern}
          onChangeText={(text) => setOtherConcern(text)}
        />

        <Button title="Request" onPress={handleRequest} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  whitebox: {
    width: 300,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    marginTop: 20,
  },
  picker: {
    height: 40,
    width: '100%',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
    width: '100%',
  },
  counter: {
    fontSize: 20,
    marginBottom: 20,
  },
});

export default HomeScreen;
