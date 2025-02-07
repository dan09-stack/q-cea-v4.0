import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getDatabase, ref, onValue } from 'firebase/database';

export default function ConsultationScreen() {
  const [studentInLine, setStudentInLine] = useState<number>(0);
  const [tableNumber, setTableNumber] = useState<string>('TABLE 1');

  useEffect(() => {
    const db = getDatabase();

    // Fetch the student in line number from Firebase Realtime Database
    const studentInLineRef = ref(db, 'ticketNumberCounter'); 
    onValue(studentInLineRef, (snapshot) => {
      const data = snapshot.val();
      if (data !== null) {
        setStudentInLine(data);
      }
    });

    // Fetch the current table from Firebase Realtime Database
    const tableNumberRef = ref(db, 'ticketNumberCounter'); 
    onValue(tableNumberRef, (snapshot) => {
      const data = snapshot.val();
      if (data !== null) {
        setTableNumber(data);
      }
    });
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Student in line: {studentInLine}</Text>
      <Text style={styles.subHeader}>You can go to consultation</Text>
      <Text style={styles.tableInfo}>{tableNumber} NOW!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f4b3b',  // Updated to dark green as per request
    justifyContent: 'center',
    padding: 10,
  },
  header: {
    fontSize: 28,
    color: '#fff',  // White text color
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  subHeader: {
    fontSize: 18,
    color: '#fff',  // White text color
    textAlign: 'center',
    marginBottom: 10,
  },
  tableInfo: {
    fontSize: 24,
    color: '#fff',  // White text color
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
  },
});
