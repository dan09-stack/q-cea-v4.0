import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, ScrollView } from 'react-native';
import { db } from '../../firebaseConfig';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';

type Faculty = {
  id: string; // The document ID
  name: string; // The name field
  status: string; // The status field
};

const FacultyList = () => {
  const [facultyData, setFacultyData] = useState<Faculty[]>([]);

  // Fetch data from Firestore
  useEffect(() => {
    const fetchFacultyData = async () => {
      const facultyCollection = collection(db, 'faculty');
      const querySnapshot = await getDocs(facultyCollection);

      const data: Faculty[] = querySnapshot.docs.map((docSnap) => ({
        id: docSnap.id, // Use the document ID as 'id'
        name: docSnap.data().name, // Fetch the 'name' field
        status: docSnap.data().status, // Fetch the 'status' field
      }));

      setFacultyData(data);
    };

    fetchFacultyData();
  }, []);

  // Toggle the status of a faculty member
  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    const facultyDocRef = doc(db, 'faculty', id);

    await updateDoc(facultyDocRef, { status: newStatus });

    setFacultyData((prev: Faculty[]) =>
      prev.map((faculty) =>
        faculty.id === id ? { ...faculty, status: newStatus } : faculty
      )
    );
  };

  return (
    <ScrollView>
      <View style={styles.tableContainer}>
        {/* Table Header */}
        <View style={[styles.row, styles.header]}>
          <Text style={[styles.cell, styles.headerText]}>Name</Text>
          <Text style={[styles.cell, styles.headerText]}>Status</Text>
          <Text style={[styles.cell, styles.headerText]}>Dev Action</Text>
        </View>

        {/* Table Rows */}
        {facultyData.map((faculty) => (
          <View key={faculty.id} style={styles.row}>
            <Text style={styles.cell}>{faculty.name}</Text>
            <Text style={styles.cell}>{faculty.status}</Text>
            <View style={styles.buttonCell}>
              <Button
                title={faculty.status === 'Active' ? 'Deactivate' : 'Activate'}
                onPress={() => toggleStatus(faculty.id, faculty.status)}
              />
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  tableContainer: {
    padding: 10,
    marginTop: 20,
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    alignItems: 'center',
    paddingVertical: 10,
  },
  header: {
    backgroundColor: '#f4f4f4',
  },
  cell: {
    flex: 1,
    textAlign: 'center',
    paddingHorizontal: 5,
  },
  buttonCell: {
    flex: 1,
    alignItems: 'center',
  },
  headerText: {
    fontWeight: 'bold',
  },
});

export default FacultyList;
