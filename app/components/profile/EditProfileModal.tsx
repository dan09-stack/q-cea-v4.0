import React from 'react';
import { View, Text, StyleSheet, TextInput, Modal, ScrollView } from 'react-native';
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

export function EditProfileModal({
  modalVisible,
  setModalVisible,
  editableData,
  setEditableData,
  newPassword,
  setNewPassword,
  handleUpdateProfile
}: EditProfileModalProps) {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalView}>
        <ScrollView style={styles.modalScroll}>
          <Text style={styles.modalTitle}>Edit Profile</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            value={editableData.fullName}
            onChangeText={(text) => setEditableData({...editableData, fullName: text})}
          />
          <TextInput
            style={styles.input}
            placeholder="ID Number"
            value={editableData.idNumber}
            onChangeText={(text) => setEditableData({...editableData, idNumber: text})}
          />
          <TextInput
            style={styles.input}
            placeholder="Course"
            value={editableData.program}
            onChangeText={(text) => setEditableData({...editableData, program: text})}
          />
          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            value={editableData.phoneNumber}
            onChangeText={(text) => setEditableData({...editableData, phoneNumber: text})}
          />
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
  input: {
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    marginBottom: 10,
  },
});
