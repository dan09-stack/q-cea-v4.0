import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Modal, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { CustomButton } from '@/components/ui/CustomButton';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { Picker } from '@react-native-picker/picker';
import { useThemeGradient } from '@/hooks/useThemeGradient';
// Update the interface to indicate handleUpdateProfile returns a Promise<boolean>
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
  oldPassword: string;
  setOldPassword: (password: string) => void;
  newPassword: string;
  setNewPassword: (password: string) => void;
  handleUpdateProfile: () => Promise<boolean>; // Modified to return success/failure status
}

const courses = [
  { label: "Select Program", value: "" },
  { label: "BS Architecture", value: "ARCH" },
  { label: "BS Civil Engineering", value: "CE" },
  { label: "BS Computer Engineering", value: "CPE" },
  { label: "BS Electrical Engineering", value: "EE" },
  { label: "BS Electronics Engineering", value: "ECE" },
  { label: "BS Mechanical Engineering", value: "ME" }
];

export function EditProfileModal({
  modalVisible,
  setModalVisible,
  editableData,
  setEditableData,
  oldPassword,
  setOldPassword,
  newPassword,
  setNewPassword,
  handleUpdateProfile
}: EditProfileModalProps) {
  const [errorModal, setErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successModal, setSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const { colors } = useThemeGradient();
  const showError = (message: string) => {
    setErrorMessage(message);
    setErrorModal(true);
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setSuccessModal(true);
  };

  // Add this function to verify the current password
  const verifyCurrentPassword = async (password: string): Promise<boolean> => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user || !user.email) {
        return false;
      }
      
      // Try to sign in with current email and the provided password
      await signInWithEmailAndPassword(auth, user.email, password);
      return true;
    } catch (error) {
      console.error('Password verification failed:', error);
      return false;
    }
  };

  const validateAndUpdate = async () => {
    // Basic validation
    if (newPassword && !oldPassword) {
      showError('Please enter your current password to change to a new password');
      return;
    }
    
    // Only perform password verification if user is trying to change password
    if (newPassword) {
      try {
        // Call your authentication service to verify the old password
        const passwordVerified = await verifyCurrentPassword(oldPassword);
        
        if (!passwordVerified) {
          showError('Current password is incorrect. Please try again.');
          return;
        }
        
        // Password verified, now proceed with the update
        const success = await handleUpdateProfile();
        
        if (success) {
          showSuccess('Profile updated successfully!');
          setOldPassword('');
          setNewPassword('');
        } else {
          showError('Failed to update profile. Please try again.');
        }
      } catch (error) {
        showError('An error occurred during password verification. Please try again.');
      }
    } else {
      // No password change requested, just update the profile
      try {
        const success = await handleUpdateProfile();
        
        if (success) {
          showSuccess('Profile updated successfully!');
          setOldPassword('');
          setNewPassword('');
        } else {
          showError('Failed to update profile. Please try again.');
        }
      } catch (error) {
        showError('Failed to update profile. Please try again.');
      }
    }
  };

  return (
    <>
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalView}>
          <ScrollView style={styles.modalScroll}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <MaterialIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            <Text style= {{fontSize: 16, fontWeight: 'bold' }}>Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              value={editableData.fullName}
              onChangeText={(text) => setEditableData({...editableData, fullName: text})}
            />
            <Text style= {{fontSize: 16, fontWeight: 'bold' }}>ID Number</Text>
            <TextInput
              style={styles.input}
              placeholder="ID Number"
              value={editableData.idNumber}
              onChangeText={(text) => setEditableData({...editableData, idNumber: text})}
            />
            <Text style= {{fontSize: 16, fontWeight: 'bold' }}>Program</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={editableData.program}
                style={styles.picker}
                onValueChange={(itemValue) => setEditableData({...editableData, program: itemValue})}
              >
                {courses.map((course, index) => (
                  <Picker.Item key={index} label={course.label} value={course.value} />
                ))}
              </Picker>
            </View>
            <Text style= {{fontSize: 16, fontWeight: 'bold' }}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              value={editableData.phoneNumber}
              onChangeText={(text) => setEditableData({...editableData, phoneNumber: text})}
            />
            <Text style= {{fontSize: 16, fontWeight: 'bold', marginTop: 10 }}>Change Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Current Password"
                secureTextEntry={!showOldPassword}
                value={oldPassword}
                onChangeText={setOldPassword}
              />
              <TouchableOpacity 
                style={styles.eyeIcon} 
                onPress={() => setShowOldPassword(!showOldPassword)}
              >
                <Ionicons 
                  name={showOldPassword ? "eye-off" : "eye"} 
                  size={24} 
                  color="#666" 
                />
              </TouchableOpacity>
            </View>
            
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="New Password"
                secureTextEntry={!showNewPassword}
                value={newPassword}
                onChangeText={setNewPassword}
              />
              <TouchableOpacity 
                style={styles.eyeIcon} 
                onPress={() => setShowNewPassword(!showNewPassword)}
              >
                <Ionicons 
                  name={showNewPassword ? "eye-off" : "eye"} 
                  size={24} 
                  color="#666" 
                />
              </TouchableOpacity>
            </View>
            
            <View style={styles.buttonContainer}>
              <CustomButton title="Save Changes" onPress={validateAndUpdate} color={colors.accentColor} />
              {/* <CustomButton title="Cancel" onPress={() => setModalVisible(false)} color="white" /> */}
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Error Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={errorModal}
        onRequestClose={() => setErrorModal(false)}
      >
        <View style={styles.errorModalContainer}>
          <View style={styles.errorModalContent}>
            <Text style={styles.errorTitle}>Error</Text>
            <Text style={styles.errorText}>{errorMessage}</Text>
            <TouchableOpacity 
              style={styles.errorButton} 
              onPress={() => setErrorModal(false)}
            >
              <Text style={styles.errorButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      {/* Success Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={successModal}
        onRequestClose={() => setSuccessModal(false)}
      >
        <View style={styles.errorModalContainer}>
          <View style={styles.successModalContent}>
            <Ionicons name="checkmark-circle" size={50} color="#28a745" />
            <Text style={styles.successTitle}>Success</Text>
            <Text style={styles.successText}>{successMessage}</Text>
            <TouchableOpacity 
              style={styles.successButton} 
              onPress={() => {
                setSuccessModal(false);
                setModalVisible(false); // Close edit modal after success
              }}
            >
              <Text style={styles.successButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    marginBottom: 15,
    overflow: 'hidden',
  },
  picker: {
    height: 40,
    width: '100%',
    backgroundColor: 'transparent',
  },
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
  closeButton: {
    position: 'absolute',
    right: 5,
    top: 0,
    padding: 5,
    zIndex: 1,
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
  // Password field styles
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    marginBottom: 15,
    height: 40,
  },
  passwordInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 10,
  },
  eyeIcon: {
    padding: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    marginBottom: 10,
  },
  // Error modal styles
  errorModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  errorModalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    width: '80%',
    elevation: 5,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: 'red',
  },
  errorText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  errorButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  errorButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  // Success modal styles
  successModalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    width: '80%',
    elevation: 5,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#28a745',
  },
  successText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  successButton: {
    backgroundColor: '#28a745',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  successButtonText: {
    color: 'white',
    fontWeight: 'bold',
  }
});
