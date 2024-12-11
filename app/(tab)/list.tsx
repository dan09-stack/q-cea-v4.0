import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { getDatabase, ref, onValue } from 'firebase/database';

export default function FacultyScreen() {
  const [studentsData, setStudentsData] = useState<any[]>([]);

  useEffect(() => {
    const db = getDatabase();

    // Fetch the students data from Firebase Realtime Database
    const studentsRef = ref(db, 'students'); // 'students' is the key in your Firebase Realtime Database
    onValue(studentsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const formattedData = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setStudentsData(formattedData);
      }
    });
  }, []);

  const renderItem = ({ item }: any) => (
    <View style={styles.card}>
      <Text style={styles.studentName}>{item.name}</Text>
      <Text style={styles.studentCourse}>{item.course}</Text>
      <Text style={styles.concern}>{item.concern}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>FACULTY</Text>
      <FlatList
        data={studentsData}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        style={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f4b3b',
    justifyContent: 'space-between',
    padding: 10,
  },
  header: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  list: {
    flex: 1,
  },
  card: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  studentName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  studentCourse: {
    fontSize: 14,
    color: '#777',
  },
  concern: {
    fontSize: 14,
    color: '#555',
  },
});
