import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Modal, ScrollView, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { CustomButton } from '@/components/ui/CustomButton';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { useThemeGradient } from '@/hooks/useThemeGradient';
import { db } from '@/firebaseConfig';
import { collection, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';

// Update the interface to include userType
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
  handleUpdateProfile: () => Promise<boolean>;
  userType: string; // Add userType to the props
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
  handleUpdateProfile,
  userType
}: EditProfileModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorModal, setErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successModal, setSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const { colors } = useThemeGradient();
  const checkExistingStudent = async () => {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        return true; // Error case, treat as duplicate
      }
      
      const studentCollection = collection(db, 'student');
      
      // Check for duplicate ID number (excluding current user)
      const idQuery = query(
        studentCollection, 
        where('idNumber', '==', editableData.idNumber)
      );
      const idSnapshot = await getDocs(idQuery);
      
      // Check if any document with this ID exists that isn't the current user
      let duplicateIdFound = false;
      idSnapshot.forEach(doc => {
        if (doc.id !== currentUser.uid) {
          duplicateIdFound = true;
        }
      });
      
      if (duplicateIdFound) {
        showError("A student with this ID number already exists");
        return true;
      }
      
      // Check for duplicate phone number (excluding current user)
      const phoneQuery = query(
        studentCollection, 
        where('phoneNumber', '==', editableData.phoneNumber)
      );
      const phoneSnapshot = await getDocs(phoneQuery);
      
      // Check if any document with this phone number exists that isn't the current user
      let duplicatePhoneFound = false;
      phoneSnapshot.forEach(doc => {
        if (doc.id !== currentUser.uid) {
          duplicatePhoneFound = true;
        }
      });
      
      if (duplicatePhoneFound) {
        showError("A user with this phone number already exists");
        return true;
      }
      
      return false; // No duplicates found
    } catch (error) {
      console.error("Error checking for existing student:", error);
      showError("Failed to check for existing students");
      return true; // Treat as duplicate to prevent update
    }
  };
  // New state for program picker modal
  const [programModalVisible, setProgramModalVisible] = useState(false);
  
  // Validation error states
  const [fullNameError, setFullNameError] = useState('');
  const [idNumberError, setIdNumberError] = useState('');
  const [phoneNumberError, setPhoneNumberError] = useState('');
  const [newPasswordError, setNewPasswordError] = useState('');
  
  // Validation functions
  const validatePhoneNumber = (phoneNumber: string): boolean => {
    const phoneRegex = /^09\d{9}$/;
    return phoneRegex.test(phoneNumber);
  };

  const validateFullName = (name: string): boolean => {
    const nameRegex = /^[A-Za-z]{2,}(?: [A-Za-z-]+)*, [A-Za-z-]{2,}(?: [A-Za-z-]+)*(?: [A-Z]\.?(?:[A-Z]\.)?)?$/;
    return nameRegex.test(name);
  };

  // Updated ID validation to check based on userType
  const validateIdFormat = (id: string): { isValid: boolean; message: string } => {
    // Faculty ID format: UP-XX-XXX-F
    const facultyIdRegex = /^UP-\d{2}-\d{3}-[A-Z]$/;
    
    // Student ID format: 03-XXXX-XXXXX or 03-XXXX-XXXXXX
    const studentIdRegex = /^03-\d{4}-\d{5,6}$/;
    
    if (userType === 'FACULTY') {
      if (facultyIdRegex.test(id)) {
        return { isValid: true, message: "" };
      } else if (studentIdRegex.test(id)) {
        return {
          isValid: false,
          message: "You entered a student ID format. Faculty ID should follow the format UP-XX-XXX-F"
        };
      } else {
        return {
          isValid: false,
          message: "Please enter a valid faculty ID in the format UP-XX-XXX-F"
        };
      }
    } else if (userType === 'STUDENT') {
      if (studentIdRegex.test(id)) {
        return { isValid: true, message: "" };
      } else if (facultyIdRegex.test(id)) {
        return {
          isValid: false,
          message: "You entered a faculty ID format. Student ID should follow the format 03-XXXX-XXXXX or 03-XXXX-XXXXXX"
        };
      } else {
        return {
          isValid: false,
          message: "Please enter a valid student ID in the format 03-XXXX-XXXXX or 03-XXXX-XXXXXX"
        };
      }
    } else {
      // If userType is not specified, accept either format
      if (facultyIdRegex.test(id) || studentIdRegex.test(id)) {
        return { isValid: true, message: "" };
      } else {
        return {
          isValid: false,
          message: "Please enter a valid ID format"
        };
      }
    }
  };

  const validatePassword = (password: string): { isValid: boolean; message: string } => {
    // Check minimum length
    if (password.length < 8) {
      return { isValid: false, message: 'Password must be at least 8 characters long' };
    }
    
    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one uppercase letter' };
    }
    
    // Check for at least one lowercase letter
    if (!/[a-z]/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one lowercase letter' };
    }
    
    // Check for at least one number
    if (!/\d/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one number' };
    }
    
    // Check for at least one special character
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one special character' };
    }
    
    // If all checks pass
    return { isValid: true, message: '' };
  };
  
  // Validate inputs when they change
  useEffect(() => {
    if (editableData.fullName) {
      if (!validateFullName(editableData.fullName)) {
        setFullNameError('Please enter a valid name in the format: Last, First (MI)');
      } else {
        setFullNameError('');
      }
    } else {
      setFullNameError('');
    }
  }, [editableData.fullName]);
  
  useEffect(() => {
    if (editableData.idNumber) {
      const result = validateIdFormat(editableData.idNumber);
      setIdNumberError(result.isValid ? '' : result.message);
    } else {
      setIdNumberError('');
    }
  }, [editableData.idNumber, userType]);
  
  useEffect(() => {
    if (editableData.phoneNumber) {
      if (!validatePhoneNumber(editableData.phoneNumber)) {
        setPhoneNumberError('Please enter a valid phone number (09XXXXXXXXX)');
      } else {
        setPhoneNumberError('');
      }
    } else {
      setPhoneNumberError('');
    }
  }, [editableData.phoneNumber]);
  
  useEffect(() => {
    if (newPassword) {
      const result = validatePassword(newPassword);
      setNewPasswordError(result.isValid ? '' : result.message);
    } else {
      setNewPasswordError('');
    }
  }, [newPassword]);

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
    // Set loading to true at the beginning
    setIsLoading(true);
    
    try {
      // Check for validation errors
      let hasErrors = false;
      
      if (editableData.fullName && !validateFullName(editableData.fullName)) {
        hasErrors = true;
      }
      
      if (editableData.idNumber) {
        const idResult = validateIdFormat(editableData.idNumber);
        if (!idResult.isValid) {
          hasErrors = true;
        }
      }
      
      if (editableData.phoneNumber && !validatePhoneNumber(editableData.phoneNumber)) {
        hasErrors = true;
      }
      
      if (newPassword) {
        const passwordResult = validatePassword(newPassword);
        if (!passwordResult.isValid) {
          hasErrors = true;
        }
      }
      
      if (hasErrors) {
        showError('Please fix the validation errors before saving.');
        setIsLoading(false);
        return;
      }
      
      const duplicatesExist = await checkExistingStudent();
      if (duplicatesExist) {
        setIsLoading(false);
        return; // Error already shown in checkExistingStudent
      }
      
      // Basic validation
      if (newPassword && !oldPassword) {
        showError('Please enter your current password to change to a new password');
        setIsLoading(false);
        return;
      }
      
      // Only perform password verification if user is trying to change password
      if (newPassword) {
        try {
          // Call your authentication service to verify the old password
          const passwordVerified = await verifyCurrentPassword(oldPassword);
          
          if (!passwordVerified) {
            showError('Current password is incorrect. Please try again.');
            setIsLoading(false);
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
    } catch (error) {
      showError('An unexpected error occurred. Please try again.');
    } finally {
      // Always set loading to false when done
      setIsLoading(false);
    }
  };

  // Get the appropriate ID placeholder text based on user type
  const getIdPlaceholder = () => {
    if (userType === 'faculty') {
      return "Faculty ID (UP-XX-XXX-F)";
    } else if (userType === 'student') {
      return "Student ID (03-XXXX-XXXXX)";
    } else {
      return "ID Number";
    }
  };

  // Get the display text for the selected program
  const getSelectedProgramText = () => {
    const selectedProgram = courses.find(course => course.value === editableData.program);
    return selectedProgram ? selectedProgram.label : "Select Program";
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
              style={[styles.input, fullNameError ? styles.inputError : null]}
              placeholder="Full Name (Last, First MI)"
              value={editableData.fullName}
              onChangeText={(text) => setEditableData({...editableData, fullName: text})}
            />
            {fullNameError ? <Text style={styles.errorText}>{fullNameError}</Text> : null}
            
            <Text style= {{fontSize: 16, fontWeight: 'bold' }}>ID Number</Text>
            <TextInput
              style={[styles.input, idNumberError ? styles.inputError : null]}
              placeholder={getIdPlaceholder()}
              value={editableData.idNumber}
              onChangeText={(text) => setEditableData({...editableData, idNumber: text})}
            />
            {idNumberError ? <Text style={styles.errorText}>{idNumberError}</Text> : null}
            
            <Text style= {{fontSize: 16, fontWeight: 'bold' }}>Program</Text>
            <TouchableOpacity 
              style={styles.pickerButton}
              onPress={() => setProgramModalVisible(true)}
            >
              <Text style={styles.pickerButtonText}>
                {getSelectedProgramText()}
              </Text>
              <MaterialIcons name="arrow-drop-down" size={24} color="#666" />
            </TouchableOpacity>
            
            <Text style= {{fontSize: 16, fontWeight: 'bold' }}>Phone Number</Text>
            <TextInput
              style={[styles.input, phoneNumberError ? styles.inputError : null]}
              placeholder="Phone Number (09XXXXXXXXX)"
              value={editableData.phoneNumber}
              onChangeText={(text) => setEditableData({...editableData, phoneNumber: text})}
            />
            {phoneNumberError ? <Text style={styles.errorText}>{phoneNumberError}</Text> : null}
            
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
                  name={showOldPassword ?  "eye" : "eye-off"} 
                  size={24} 
                  color="#666" 
                />
              </TouchableOpacity>
            </View>
            
            <View style={[styles.passwordContainer, newPasswordError ? styles.inputError : null]}>
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
                  name={showNewPassword ? "eye" : "eye-off"} 
                  size={24} 
                  color="#666" 
                />
              </TouchableOpacity>
            </View>
            {newPasswordError ? <Text style={styles.errorText}>{newPasswordError}</Text> : null}
            
            <View style={styles.buttonContainer}>
              {isLoading ? (
                <View style={[styles.loadingButton, { backgroundColor: colors.accentColor }]}>
                  <ActivityIndicator size="small" color="white" />
                  <Text style={styles.buttonText}>Saving...</Text>
                </View>
              ) : (
                <CustomButton 
                  title="Save Changes" 
                  onPress={validateAndUpdate} 
                  color={colors.accentColor} 
                />
              )}
                    </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Program Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={programModalVisible}
        onRequestClose={() => setProgramModalVisible(false)}
      >
        <View style={styles.programModalContainer}>
          <View style={styles.programModalContent}>
            <Text style={styles.programModalTitle}>Select Program</Text>
            <FlatList
              data={courses}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.programItem,
                    editableData.program === item.value ? styles.selectedProgramItem : null
                  ]}
                  onPress={() => {
                    setEditableData({...editableData, program: item.value});
                    setProgramModalVisible(false);
                  }}
                >
                  <Text style={[
                    styles.programItemText,
                    editableData.program === item.value ? styles.selectedProgramItemText : null
                  ]}>
                    {item.label}
                  </Text>
                  {editableData.program === item.value && (
                    <Ionicons name="checkmark" size={20} color={colors.accentColor} />
                  )}
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => setProgramModalVisible(false)}
            >
              <Text style={styles.closeModalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
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
  loadingButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    minWidth: 120,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
  },
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
    marginBottom: 5,
    paddingHorizontal: 10,
  },
  inputError: {
    borderColor: 'red',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginBottom: 10,
    marginTop: -3,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    marginBottom: 5,
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
  },
  
  // New styles for program picker modal
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  pickerButtonText: {
    fontSize: 14,
    color: '#333',
  },
  programModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  programModalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    width: '90%',
    maxHeight: '80%',
    padding: 20,
    elevation: 5,
  },
  programModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  programItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedProgramItem: {
    backgroundColor: 'rgba(0, 123, 255, 0.1)',
  },
  programItemText: {
    fontSize: 16,
    color: '#333',
  },
  selectedProgramItemText: {
    fontWeight: 'bold',
    color: '#007bff',
  },
  closeModalButton: {
    marginTop: 15,
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  closeModalButtonText: {
    fontSize: 16,
    color: '#333',
  }
});
       
