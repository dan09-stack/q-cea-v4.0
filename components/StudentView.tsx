import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { FacultyItem } from '../utils/interfaces';

interface StudentViewProps {
  facultyData: FacultyItem[];
  filteredFacultyData: FacultyItem[];
  styles: any;
}

const NoResults = ({ styles }: { styles: any }) => (
  <View style={styles.noResultsContainer}>
    <Text style={styles.noResultsText}>No faculty members found</Text>
  </View>
);

export const StudentView = ({ facultyData, filteredFacultyData, styles }: StudentViewProps) => {
  const renderFaculty = ({ item }: { item: FacultyItem }) => (
    <View style={styles.row}>
      <Text style={styles.name}>{item.name}</Text>
      <Text
        style={[
          styles.status,
          { color: item.status === 'ONLINE' ? ' rgb(21, 82, 14)' : ' rgb(91, 37, 17)' },
        ]}
      >
        {item.status}
      </Text>
      <Text style={styles.studentCount}>{item.numOnQueue}</Text>
    </View>
  );

  return (
    <View style={styles.listContainer}>
      <Text style={styles.title}>LIST OF FACULTY</Text>
      <View style={styles.header}>
        <Text style={[styles.headerText, { flex: 1 }]}>NAME</Text>
        <Text style={[styles.headerText, { flex: 1 }]}>STATUS</Text>
        <Text style={[styles.headerText, { flex: 1 }]}>WAITING</Text>
      </View>
        <View style={{ height: 2, backgroundColor: 'black' }} />
      
      <FlatList
        data={filteredFacultyData}
        keyExtractor={(item) => item.id}
        renderItem={renderFaculty}
        style={styles.list}
        ListEmptyComponent={() => <NoResults styles={styles} />}
      />
    </View>
  );
};
