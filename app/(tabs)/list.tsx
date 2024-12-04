import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, FlatList } from 'react-native';

const facultyData = [
  { id: '1', name: 'Faculty A', status: 'Inactive' },
  { id: '2', name: 'Faculty B', status: 'Inactive' },
  { id: '3', name: 'Faculty C', status: 'Inactive' },
];

const ListScreen = () => {
  const [faculties, setFaculties] = useState(facultyData);

  // Function to toggle status
  const toggleStatus = (id: string) => {
    const updatedFaculties = faculties.map(faculty => {
      if (faculty.id === id) {
        // Toggle between 'Active' and 'Inactive'
        return { ...faculty, status: faculty.status === 'Active' ? 'Inactive' : 'Active' };
      }
      return faculty;
    });
    setFaculties(updatedFaculties);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={faculties}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.status}>{item.status}</Text>
            <Button
              title={item.status === 'Active' ? 'Set Inactive' : 'Set Active'}
              onPress={() => toggleStatus(item.id)}
            />
          </View>
        )}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  status: {
    fontSize: 16,
    color: '#666',
  },
});

export default ListScreen;


