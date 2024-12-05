import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, TextInput, ActivityIndicator } from 'react-native';
import { db } from '../../firebaseConfig';
import { collection, getDocs, doc, updateDoc, increment, addDoc, serverTimestamp, getDoc, onSnapshot } from 'firebase/firestore';
import { Picker } from '@react-native-picker/picker';
import FacultyUnavailableScreen from './FacultyUnavailableScreen';

const HomeScreen = ({ navigation }: any) => {
  const [counter, setCounter] = useState<number | null>(null);
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [selectedConcern, setSelectedConcern] = useState('');
  const [otherConcern, setOtherConcern] = useState('');
  const [facultyList, setFacultyList] = useState<{ name: string; status: string }[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isFacultyUnavailable, setIsFacultyUnavailable] = useState<boolean>(false);

  // Real-time fetch of faculty data
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'faculty'), (querySnapshot) => {
      const facultyNames: { name: string; status: string }[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        facultyNames.push({ name: data.name, status: data.status });
      });
      setFacultyList(facultyNames);
      setLoading(false);
    });

    // Cleanup listener on component unmount
    return () => unsubscribe();
  }, []);

  // Real-time fetch of ticket counter and implement reset logic
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'queueCounters', 'ticketCounter'), async (counterDoc) => {
      if (counterDoc.exists()) {
        const data = counterDoc.data();
        const lastReset = data?.lastReset?.seconds;
        const currentTime = Math.floor(Date.now() / 1000);  // Current time in seconds

        // Check if 24 hours have passed (86400 seconds = 24 hours)
        if (lastReset && (currentTime - lastReset) >= 86400) {
          // Reset the counter and update the last reset time
          await updateDoc(counterDoc.ref, {
            counter: 1,
            lastReset: serverTimestamp(),
          });
          setCounter(1);
        } else {
          setCounter(data?.counter || 1); // Default to 1 if the counter is undefined
        }
      }
    });

    // Cleanup listener on component unmount
    return () => unsubscribe();
  }, []);

  // Handle request
  const handleRequest = async () => {
    const faculty = facultyList.find(faculty => faculty.name === selectedFaculty);

    if (!faculty) {
      alert('Please select a valid faculty');
      return;
    }

    if (faculty.status !== 'Active') {
      setIsFacultyUnavailable(true);
      return;
    }

    const counterDocRef = doc(db, 'queueCounters', 'ticketCounter');
    const userRequestsCollection = collection(db, 'userRequests');

    try {
      // Increment the counter
      const newCounter = counter !== null ? counter + 1 : 1;
      await updateDoc(counterDocRef, { counter: newCounter });

      // Add user request
      await addDoc(userRequestsCollection, {
        faculty: selectedFaculty,
        concern: selectedConcern,
        otherConcern: otherConcern || null,
        requestID: newCounter,
        createdAt: serverTimestamp(),
      });

      console.log('User request saved to Firestore!');
      setSelectedFaculty('');
      setSelectedConcern('');
      setOtherConcern('');
    } catch (error) {
      console.error('Error saving data to Firestore:', error);
    }
  };

  if (isFacultyUnavailable) {
    return <FacultyUnavailableScreen goBack={() => setIsFacultyUnavailable(false)} />;
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

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
          {facultyList.map((faculty, index) => (
            <Picker.Item key={index} label={faculty.name} value={faculty.name} />
          ))}
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
    height: 100,
  },
  counter: {
    fontSize: 20,
    marginBottom: 20,
  },
});

export default HomeScreen;
