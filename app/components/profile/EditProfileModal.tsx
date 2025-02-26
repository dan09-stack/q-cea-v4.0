import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TextInput, Modal, ScrollView, TouchableOpacity, FlatList 
} from 'react-native';
import { CustomButton } from '@/components/ui/CustomButton';

interface EditProfileModalProps {
  modalVisible: boolean;
  setModalVisible: (visible: boolean) => void;
  editableData: {
    fullName: string;
    idNumber: string;
    program: string;
    phoneNumber: string;
  };
  setEditableData: (data: any) => void;
  newPassword: string;
  setNewPassword: (password: string) => void;
  handleUpdateProfile: () => void;
}

const courses = [
  "B.S. Architecture",
  "B.S. Civil Engineering",
  "B.S. Computer Engineering",
  "B.S. Electrical Engineering",
  "B.S. Electronics Engineering",
  "B.S. Mechanical Engineering",
];

export function EditProfileModal({
  modalVisible,
  setModalVisible,
  editableData,
  setEditableData,
  newPassword,
  setNewPassword,
  handleUpdateProfile
}: EditProfileModalProps) {
  const [courseModalVisible, setCourseModalVisible] = useState(false);

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalView}>
        <ScrollView style={styles.modalScroll}>
          <Text style={styles.modalTitle}>Edit Profile</Text>

          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            value={editableData.fullName}
            onChangeText={(text) => setEditableData({ ...editableData, fullName: text })}
          />

          <Text style={styles.label}>ID Number</Text>
          <TextInput
            style={styles.input}
            placeholder="ID Number"
            value={editableData.idNumber}
            onChangeText={(text) => setEditableData({ ...editableData, idNumber: text })}
          />

          <Text style={styles.label}>Program</Text>
          <TouchableOpacity style={styles.dropdown} onPress={() => setCourseModalVisible(true)}>
            <Text>{editableData.program || "Select Program"}</Text>
          </TouchableOpacity>

          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            value={editableData.phoneNumber}
            onChangeText={(text) => setEditableData({ ...editableData, phoneNumber: text })}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="New Password (optional)"
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
          />

          <View style={styles.buttonContainer}>
            <CustomButton title="Save Changes" onPress={handleUpdateProfile} />
            <CustomButton title="Cancel" onPress={() => setModalVisible(false)} color="white" />
          </View>
        </ScrollView>
      </View>

      {/* Course Selection Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={courseModalVisible}
        onRequestClose={() => setCourseModalVisible(false)}
      >
        <View style={styles.courseModalContainer}>
          <View style={styles.courseModal}>
            <Text style={styles.modalTitle}>Select Your Program</Text>
            <FlatList
              data={courses}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.courseItem}
                  onPress={() => {
                    setEditableData({ ...editableData, program: item });
                    setCourseModalVisible(false);
                  }}
                >
                  <Text style={styles.courseText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
            <CustomButton title="Close" onPress={() => setCourseModalVisible(false)} />
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalView: {
    backgroundColor: 'white',
    marginTop: 50,
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    elevation: 5,
    maxHeight: '80%',
  },
  modalScroll: {
    width: '100%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  dropdown: {
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    justifyContent: 'center',
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    marginBottom: 10,
  },
  courseModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  courseModal: {
    backgroundColor: 'white',
    width: '80%',
    borderRadius: 10,
    padding: 20,
    
  },
  courseItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    width: '100%',
    alignItems: 'flex-start',
    
  },
  courseText: {
    fontSize: 16,
  },
});

