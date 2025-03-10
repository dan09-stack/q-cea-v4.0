import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Modal, Image } from 'react-native';
import { FacultyItem } from '@/utils/interfaces';

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
  const [selectedFaculty, setSelectedFaculty] = useState<FacultyItem | null>(null);

  const renderFaculty = ({ item }: { item: FacultyItem }) => (
    <View style={styles.row}>
      <Text style={[styles.name, { flex: 1 }]}>{item.name}</Text>
      <Text
        style={[
          styles.status,
          { flex: 1, color: item.status === 'ONLINE' ? 'rgb(21, 82, 14)' : 'rgb(91, 37, 17)' },
        ]}
      >
        {item.status}
      </Text>
      <Text style={[styles.studentCount, { flex: 1 }]}>{item.numOnQueue}</Text>
      <TouchableOpacity
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        onPress={() => setSelectedFaculty(item)}
      >
        <Image
          source={require('@/assets/time.png')} 
          style={{ width: 24, height: 24 }} 
          resizeMode="contain"
        />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.listContainer}>
      <Text style={styles.title}>LIST OF FACULTY</Text>
      <View style={styles.header}>
        <Text style={[styles.headerText, { flex: 1 }]}>NAME</Text>
        <Text style={[styles.headerText, { flex: 1 }]}>STATUS</Text>
        <Text style={[styles.headerText, { flex: 1 }]}>WAITING</Text>
        <Text style={[styles.headerText, { flex: 1 }]}>AVAILABILITY</Text>
      </View>
      <View style={{ height: 2, backgroundColor: 'black' }} />

      <FlatList
        data={filteredFacultyData}
        keyExtractor={(item) => item.id}
        renderItem={renderFaculty}
        style={styles.list}
        ListEmptyComponent={() => <NoResults styles={styles} />}
      />

      {/* Schedule Modal */}
      {selectedFaculty && (
        <Modal transparent={true} visible={!!selectedFaculty} onRequestClose={() => setSelectedFaculty(null)}>
          <View style={styleslocal.modalOverlay}>
            <View style={styleslocal.modalView}>
              <Text style={styleslocal.modalTitle}>{selectedFaculty.name}'s Availability</Text>
              <View style={styleslocal.scheduleContainer}>
                {Object.entries(selectedFaculty.schedule || {})
                  .sort(([dayA], [dayB]) => {
                    const daysOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
                    return daysOrder.indexOf(dayA.toLowerCase()) - daysOrder.indexOf(dayB.toLowerCase());
                  })
                  .map(([day, time]) => (
                    <View key={day} style={styleslocal.scheduleRow}>
                      <Text style={styleslocal.scheduleDay}>{day.charAt(0).toUpperCase() + day.slice(1)}</Text>
                      <Text style={styleslocal.scheduleTime}>
                  {time.start && time.end ? `${time.start} - ${time.end}` : 'Unavailable'}
                </Text>
                    </View>
                  ))}
              </View>
              <TouchableOpacity style={styleslocal.closeButton} onPress={() => setSelectedFaculty(null)}>
                <Text style={styleslocal.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styleslocal = StyleSheet.create({
  listContainer: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  name: {
    fontSize: 16,
    textAlign: 'left',
  },
  status: {
    fontSize: 16,
    textAlign: 'center',
  },
  studentCount: {
    fontSize: 16,
    textAlign: 'center',
  },
  availability: {
    fontSize: 16,
    color: 'blue',
    textAlign: 'center',
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 18,
    color: '#888',
  },
  modalOverlay: {
    flex: 1, // Add this
    position: "absolute",
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0, 
    width: "100%", 
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.5)", 
    justifyContent: "center",
    alignItems: "center",
  },
  modalView: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    width: 300, 
    minHeight: 200, 
    maxHeight: "80%",
    justifyContent: "center",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  scheduleContainer: {
    width: '100%',
    marginBottom: 16,
  },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  scheduleDay: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  scheduleTime: {
    fontSize: 16,
  },
  closeButton: {
    backgroundColor: '#045657',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    width: '100%',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
  },
});