import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import app from '../../firebaseConfig'; // Correct default import

interface Student {
  fullName: string;
  idNumber: string;
  concern: string;
}

export default function ConsultationScreen() {
  const [studentsData, setStudentsData] = useState<Student[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const db = getFirestore(); // Get Firestore instance without passing app

    // Fetch the students data from Firestore
    const studentsRef = collection(db, 'student'); // Ensure the collection name is correct
    getDocs(studentsRef)
      .then((querySnapshot) => {
        const studentsList: Student[] = querySnapshot.docs.map((doc) => ({
          idNumber: doc.data().idNumber || 'Unknown ID', // Access idNumber from doc.data()
          fullName: doc.data().fullName || 'Unknown Name', // Default name if missing
          concern: doc.data().concern || 'No concern provided', // Default concern if missing
        }));
        setStudentsData(studentsList);
        setLoading(false); // Stop loading after data is fetched
      })
      .catch((error) => {
        setError('Error fetching data. Please try again later.');
        setLoading(false);
        console.error("Error fetching student data:", error);
      });
  }, []);

  const renderItem = ({ item }: { item: Student }) => (
    <View style={styles.row}>
      <Text style={styles.cell}>{item.fullName || 'No Name'}</Text>
      <Text style={styles.cell}>{item.idNumber || 'No ID'}</Text>
      <Text style={styles.cell}>{item.concern || 'No concern provided'}</Text>
    </View>
  );  

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.subHeader}>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Student Concerns</Text>
      <FlatList
        data={studentsData}
        renderItem={renderItem}
        keyExtractor={(item, index) => `${item.idNumber}-${index}`} // Key is a combination of idNumber and index
        style={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f4b3b', // Updated to dark green as per request
    justifyContent: 'center',
    padding: 10,
  },
  header: {
    fontSize: 28,
    color: '#fff', // White text color
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  subHeader: {
    fontSize: 18,
    color: '#fff', // White text color
    textAlign: 'center',
    marginBottom: 10,
  },
  tableInfo: {
    fontSize: 24,
    color: '#fff', // White text color
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    borderRadius: 10,
  },
  list: {
    flex: 1,
    borderRadius: 5,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff', // White background for rows
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  cell: {
    flex: 1,
    fontSize: 16,
    color: '#000', // Black text color for cells
  },
  errorText: {
    color: 'red',
    fontSize: 18,
    textAlign: 'center',
  },
});
