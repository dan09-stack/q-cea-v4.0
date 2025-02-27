import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Modal, 
  TextInput,
  ScrollView,
  Platform,
  Alert
} from 'react-native';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  doc, 
  deleteDoc, 
  updateDoc, 
  getDoc, 
  serverTimestamp,
  where,
  Timestamp,
  getDocs
} from 'firebase/firestore';
import { auth, db } from '@/firebaseConfig';
import { router } from 'expo-router';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import {  formatDateTime } from '@/utils/formatters';

interface Appointment {
    id: string;
    studentName: string;
    studentId?: string;
    facultyName: string;
    facultyId: string;
    date: Timestamp;
    status: 'scheduled' | 'completed' | 'cancelled';
    concern: string;
    notes?: string;
  }
interface Student {
    id: string;
    fullName: string;
    studentId?: string;
  }
export default function AppointmentScreen() {
  const [manualDateInput, setManualDateInput] = useState('');
const [manualTimeInput, setManualTimeInput] = useState('');

    const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');
const [showTimePicker, setShowTimePicker] = useState(false);
    const [searchText, setSearchText] = useState('');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentFacultyName, setCurrentFacultyName] = useState('');
  const [currentFacultyId, setCurrentFacultyId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'scheduled' | 'completed' | 'cancelled'>('all');
// Student dropdown states
const [students, setStudents] = useState<Student[]>([]);
const [studentDropdownVisible, setStudentDropdownVisible] = useState(false);
const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Form fields
  const [studentName, setStudentName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [appointmentDate, setAppointmentDate] = useState(new Date());
  const [appointmentTime, setAppointmentTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  
  const [concern, setConcern] = useState('');
  const [notes, setNotes] = useState('');
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

  const handleBackPress = () => {
    router.push('/list');
  };
    // Add this function to fetch students
    const fetchStudents = async () => {
        try {
          const studentCollection = collection(db, 'student');
          const studentQuery = query(
            studentCollection, 
            where('userType', '==', 'STUDENT'),
          );
          const querySnapshot = await getDocs(studentQuery);
          
          const studentList: Student[] = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            studentList.push({
              id: doc.id,
              fullName: data.fullName || '',
              studentId:  data.idNumber || '',
            });
          });
          studentList.sort((a, b) => {
            return a.fullName.localeCompare(b.fullName);
          });
          
          setStudents(studentList);
        } catch (error) {
          console.error('Error fetching students:', error);
        }
      };
    

  // Call fetchStudents when the component mounts
  useEffect(() => {
    fetchStudents();
  }, []);
  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const userDocRef = doc(db, 'student', currentUser.uid);
      getDoc(userDocRef).then((docSnap) => {
        if (docSnap.exists()) {
          setCurrentFacultyName(docSnap.data().fullName || '');
          setCurrentFacultyId(currentUser.uid);
        }
      });
    }

    return () => {};
  }, []);
  const showDatePickerModal = () => {
    setPickerMode('date');
    setShowDatePicker(true);
  };
  
  const showTimePickerModal = () => {
    setPickerMode('time');
    setShowTimePicker(true);
  };
  
  
  useEffect(() => {
    if (!currentFacultyId) return;
    
    setIsLoading(true);
    
    let appointmentsQuery = query(
      collection(db, 'appointments'),
      where('facultyId', '==', currentFacultyId),
      orderBy('date', 'asc')
    );
    
    const unsubscribe = onSnapshot(appointmentsQuery, (snapshot) => {
      const appointmentList: Appointment[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          studentName: data.studentName || '',
          studentId: data.studentId || '',
          facultyName: data.facultyName || '',
          facultyId: data.facultyId || '',
          date: data.date,
          timeSlot: data.timeSlot || '',
          status: data.status || 'scheduled',
          concern: data.concern || '',
          notes: data.notes || '',
        };
      });
      
      setAppointments(appointmentList);
      setIsLoading(false);
    });
    
    return () => unsubscribe();
  }, [currentFacultyId]);

  const filteredAppointments = filter === 'all' 
    ? appointments 
    : appointments.filter(appointment => appointment.status === filter);

    const addAppointment = async () => {
        try {
          if (!studentName || !concern) {
            Alert.alert('Error', 'Please fill all required fields');
            return;
          }
      
          const appointmentData = {
            studentName,
            studentId,
            facultyName: currentFacultyName,
            facultyId: currentFacultyId,
            date: appointmentDate,
            time: manualTimeInput,
            status: 'scheduled' as const,
            concern,
            notes,
            createdAt: serverTimestamp(),
          };
      
          if (editingAppointment) {
            await updateDoc(doc(db, 'appointments', editingAppointment.id), appointmentData);
            Alert.alert('Success', 'Appointment updated successfully');
          } else {
            await addDoc(collection(db, 'appointments'), appointmentData);
            Alert.alert('Success', 'Appointment created successfully');
          }
      
          resetForm();
          setModalVisible(false);
        } catch (error) {
          console.error('Error adding appointment: ', error);
          Alert.alert('Error', 'Failed to save appointment');
        }
      };
      

  const deleteAppointment = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'appointments', id));
      Alert.alert('Success', 'Appointment deleted successfully');
    } catch (error) {
      console.error('Error deleting appointment: ', error);
      Alert.alert('Error', 'Failed to delete appointment');
    }
  };

  const updateAppointmentStatus = async (id: string, status: 'scheduled' | 'completed' | 'cancelled') => {
    try {
      await updateDoc(doc(db, 'appointments', id), { status });
      Alert.alert('Success', 'Appointment status updated');
    } catch (error) {
      console.error('Error updating appointment status: ', error);
      Alert.alert('Error', 'Failed to update appointment status');
    }
  };

  const editAppointment = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setStudentName(appointment.studentName);
    setStudentId(appointment.studentId || '');
    setAppointmentDate(appointment.date.toDate());
    setConcern(appointment.concern);
    setNotes(appointment.notes || '');
    setModalVisible(true);
  };
  

  const resetForm = () => {
    setStudentName('');
    setStudentId('');
    setAppointmentDate(new Date());
    setConcern('');
    setNotes('');
    setEditingAppointment(null);
    setSelectedStudent(null);
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
      setShowTimePicker(false);
    }
    
    if (selectedDate) {
      if (pickerMode === 'date') {
        // Keep the time from the existing date but update the day/month/year
        const newDate = new Date(selectedDate);
        newDate.setHours(appointmentDate.getHours());
        newDate.setMinutes(appointmentDate.getMinutes());
        setAppointmentDate(newDate);
        
        // On Android, we can show the time picker after date selection
        if (Platform.OS === 'android') {
          setTimeout(() => {
            setPickerMode('time');
            setShowTimePicker(true);
          }, 500);
        }
      } else {
        // Keep the date but update the time
        const newDate = new Date(appointmentDate);
        newDate.setHours(selectedDate.getHours());
        newDate.setMinutes(selectedDate.getMinutes());
        setAppointmentDate(newDate);
      }
    }
  };
  
  

  const renderAppointment = ({ item }: { item: Appointment }) => (
    <View style={styles.appointmentItem}>
      <View style={styles.appointmentHeader}>
        <Text style={styles.studentName}>{item.studentName}</Text>
        <Text style={[
          styles.statusBadge,
          item.status === 'scheduled' ? styles.statusScheduled :
          item.status === 'completed' ? styles.statusCompleted :
          styles.statusCancelled
        ]}>
          {item.status.toUpperCase()}
        </Text>
      </View>
    
      
      <View style={styles.appointmentDetails}>
        <Text style={styles.label}>Concern:</Text>
        <Text style={styles.value}>{item.concern}</Text>
      </View>
      <View style={styles.appointmentDetails}>
        <Text style={styles.label}>Date:</Text>
        <Text style={styles.value}>{formatDateTime(item.date)}</Text>
      </View>
      {item.notes && (
        <View style={styles.appointmentDetails}>
          <Text style={styles.label}>Notes:</Text>
          <Text style={styles.value}>{item.notes}</Text>
        </View>
      )}
      
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => editAppointment(item)}
        >
          <Text style={styles.buttonText}>Edit</Text>
        </TouchableOpacity>
        
        {item.status === 'scheduled' && (
          <>
            <TouchableOpacity
              style={[styles.actionButton, styles.completeButton]}
              onPress={() => updateAppointmentStatus(item.id, 'completed')}
            >
              <Text style={styles.buttonText}>Complete</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => updateAppointmentStatus(item.id, 'cancelled')}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </>
        )}
        
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => {
            Alert.alert(
              "Delete Appointment",
              "Are you sure you want to delete this appointment?",
              [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", onPress: () => deleteAppointment(item.id), style: "destructive" }
              ]
            );
          }}
        >
          <Text style={styles.buttonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBackPress}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Appointments</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => {
            resetForm();
            setModalVisible(true);
          }}
        >
          <Text style={styles.addButtonText}>+ New Appointment</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity 
          style={[styles.filterButton, filter === 'all' && styles.activeFilter]}
          onPress={() => setFilter('all')}
        >
          <Text style={styles.filterText}>All</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.filterButton, filter === 'scheduled' && styles.activeFilter]}
          onPress={() => setFilter('scheduled')}
        >
          <Text style={styles.filterText}>Scheduled</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.filterButton, filter === 'completed' && styles.activeFilter]}
          onPress={() => setFilter('completed')}
        >
          <Text style={styles.filterText}>Completed</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.filterButton, filter === 'cancelled' && styles.activeFilter]}
          onPress={() => setFilter('cancelled')}
        >
          <Text style={styles.filterText}>Cancelled</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.noResultsContainer}>
          <Text style={styles.noResultsText}>Loading appointments...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredAppointments}
          keyExtractor={(item) => item.id}
          renderItem={renderAppointment}
          contentContainerStyle={styles.list}
          ListEmptyComponent={() => (
            <View style={styles.noResultsContainer}>
              <Text style={styles.noResultsText}>No appointments found</Text>
            </View>
          )}
        />
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>
                {editingAppointment ? 'Edit Appointment' : 'Create New Appointment'}
              </Text>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Student Name *</Text>
                <TouchableOpacity 
                  style={styles.dropdownButton}
                  onPress={() => setStudentDropdownVisible(true)}
                >
                  <Text style={selectedStudent ? styles.dropdownSelected : styles.dropdownPlaceholder}>
                    {selectedStudent ? selectedStudent.fullName : "Select a student"}
                  </Text>
                </TouchableOpacity>
              </View>
              
              {/* Student dropdown modal */}
                            {/* Student dropdown modal */}
                <Modal
                animationType="slide"
                transparent={true}
                visible={studentDropdownVisible}
                onRequestClose={() => setStudentDropdownVisible(false)}
                >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Select a Student</Text>
                    
                    <TextInput
                        style={styles.input}
                        placeholder="Search students..."
                        value={searchText}
                        onChangeText={(text) => {
                        setSearchText(text);
                        }}
                    />
                    
                    <FlatList
                        data={students.filter(student => 
                        student.fullName.toLowerCase().includes(searchText.toLowerCase())
                        )}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.dropdownItem}
                            onPress={() => {
                            setSelectedStudent(item);
                            setStudentName(item.fullName);
                            setStudentId(item.studentId || '');
                            setStudentDropdownVisible(false);
                            setSearchText(''); // Clear search when item is selected
                            }}
                        >
                            <Text style={styles.dropdownItemText}>{item.fullName}</Text>
                            {item.studentId && (
                            <Text style={styles.dropdownItemSubtext}>ID: {item.studentId}</Text>
                            )}
                        </TouchableOpacity>
                        )}
                        ListEmptyComponent={() => (
                        <Text style={styles.noResultsText}>No students found</Text>
                        )}
                    />
                    
                    <TouchableOpacity
                        style={[styles.modalButton, styles.cancelModalButton]}
                        onPress={() => {
                        setStudentDropdownVisible(false);
                        setSearchText(''); // Clear search when modal is closed
                        }}
                    >
                        <Text style={styles.modalButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    </View>
                </View>
                </Modal>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Student ID</Text>
                <TextInput
                  style={styles.input}
                  value={studentId}
                  onChangeText={setStudentId}
                  placeholder="Enter student ID (optional)"
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Appointment Date & Time *</Text>
               
                {/* Add manual date/time input option */}
                <View style={styles.manualDateTimeContainer}>
                  <TextInput
                    style={[styles.input, styles.dateTimeInput]}
                    placeholder="MM/DD/YY"
                    value={manualDateInput}
                    onChangeText={(text) => {
                      setManualTimeInput(text);
                      // Parse time input and update appointmentDate
                      if (text.match(/^(\d{1,2}):(\d{2}) (AM|PM)$/i)) {
                        const [timePart, periodPart] = text.split(' ');
                        const [hourStr, minuteStr] = timePart.split(':');
                        
                        let hours = parseInt(hourStr, 10);
                        const minutes = parseInt(minuteStr, 10);
                        const isPM = periodPart.toUpperCase() === 'PM';
                        
                        // Convert hours to 24-hour format
                        if (isPM && hours < 12) hours += 12;
                        if (!isPM && hours === 12) hours = 0;
                        
                        // Create new date with current date but updated time
                        const newDate = new Date(appointmentDate);
                        newDate.setHours(hours);
                        newDate.setMinutes(minutes);
                        setAppointmentDate(newDate);
                      }
                    }}
                  />
                  <TextInput
                    style={[styles.input, styles.dateTimeInput]}
                    placeholder="HH:MM AM/PM"
                    value={manualTimeInput}
                    onChangeText={(text) => {
                      setManualTimeInput(text);
                      // Add logic to parse time input and update appointmentDate
                    }}
                  />
                </View>

                <DateTimePickerModal
                  isVisible={showDatePicker || showTimePicker}
                  mode={pickerMode}
                  onConfirm={(date) => {
                    if (pickerMode === 'date') {
                      // Preserve the current time when setting a new date
                      const newDate = new Date(date);
                      newDate.setHours(appointmentDate.getHours());
                      newDate.setMinutes(appointmentDate.getMinutes());
                      setAppointmentDate(newDate);
                      
                      // Update manual input
                      const month = (newDate.getMonth() + 1).toString().padStart(2, '0');
                      const day = newDate.getDate().toString().padStart(2, '0');
                      const year = newDate.getFullYear().toString().slice(-2);
                      setManualDateInput(`${month}/${day}/${year}`);
                    } else {
                      // Preserve the current date when setting a new time
                      const newDate = new Date(appointmentDate);
                      newDate.setHours(date.getHours());
                      newDate.setMinutes(date.getMinutes());
                      setAppointmentDate(newDate);
                      
                      // Update manual input
                      let hours = date.getHours();
                      const minutes = date.getMinutes().toString().padStart(2, '0');
                      const period = hours >= 12 ? 'PM' : 'AM';
                      hours = hours % 12 || 12; // Convert to 12-hour format
                      setManualTimeInput(`${hours}:${minutes} ${period}`);
                    }
                    setShowDatePicker(false);
                    setShowTimePicker(false);
                  }}
                  onCancel={() => {
                    setShowDatePicker(false);
                    setShowTimePicker(false);
                  }}
                  date={appointmentDate}
                />
              </View>


              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Concern/Purpose *</Text>
                <TextInput
                  style={styles.input}
                  value={concern}
                  onChangeText={setConcern}
                  placeholder="Enter appointment concern or purpose"
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Notes</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Add any additional notes here"
                  multiline={true}
                  numberOfLines={4}
                />
              </View>
              
              <View style={styles.modalButtonsContainer}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelModalButton]}
                  onPress={() => {
                    setModalVisible(false);
                    resetForm();
                  }}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveModalButton]}
                  onPress={addAppointment}
                >
                  <Text style={styles.modalButtonText}>
                    {editingAppointment ? 'Update' : 'Save'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  manualDateTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  dateTimeInput: {
    flex: 1,
    marginHorizontal: 5,
  },
      backButton: {
        padding: 8,
        borderRadius: 5,
    },
    backButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    modalButtonText: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    dateTimeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
      },
      datePickerButton: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 5,
        paddingHorizontal: 12,
        paddingVertical: 12,
        flex: 1,
        marginHorizontal: 5,
        alignItems: 'center',
      },
    dropdownButton: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 5,
        paddingHorizontal: 12,
        paddingVertical: 12,
        backgroundColor: '#fff',
      },
      dropdownPlaceholder: {
        color: '#999',
      },
      dropdownSelected: {
        color: '#333',
      },
      dropdownItem: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
      },
      dropdownItemText: {
        fontSize: 16,
        color: '#333',
      },
      dropdownItemSubtext: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
      }, 
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 5,
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  filterButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
  },
  activeFilter: {
    backgroundColor: '#2196F3',
  },
  filterText: {
    fontWeight: '500',
  },
  list: {
    paddingBottom: 20,
  },
  appointmentItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  studentName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusScheduled: {
    backgroundColor: '#e3f2fd',
    color: '#1976d2',
  },
  statusCompleted: {
    backgroundColor: '#e8f5e9',
    color: '#388e3c',
  },
  statusCancelled: {
    backgroundColor: '#ffebee',
    color: '#d32f2f',
  },
  appointmentDetails: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    width: 70,
    fontWeight: '500',
    color: '#666',
  },
  value: {
    flex: 1,
    color: '#333',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 15,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginLeft: 8,
  },
  editButton: {
    backgroundColor: '#2196F3',
  },
  completeButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButton: {
    backgroundColor: '#FFA000',
  },
  deleteButton: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 13,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noResultsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxWidth: 500,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 15,
  },
  formLabel: {
    fontSize: 16,
    marginBottom: 5,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
 
  modalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
  },
  cancelModalButton: {
    backgroundColor: '#f5f5f5',
    marginRight: 10,
  },
  saveModalButton: {
    backgroundColor: '#4CAF50',
    marginLeft: 10,
  },

});
