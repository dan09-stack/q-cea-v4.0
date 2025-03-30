import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ImageBackground, ScrollView, Modal, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { handleSignup } from '../../../services/auth';
import { CustomButton } from '@/components/ui/CustomButton';
import { Ionicons } from '@expo/vector-icons';
import Checkbox from 'expo-checkbox';
import { LinearGradient } from 'expo-linear-gradient';
import { DataPrivacyPolicy } from '@/components/privacy/DataPrivacyPolicy';
import { GradientBackgroundContainer } from '@/components/ui/GradientBackgroundContainer';
import { db } from '@/firebaseConfig';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';

export default function Signup(): JSX.Element {
  const [fullName, setFullName] = useState<string>('');
  const [idNumber, setIdNumber] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [selectedProgram, setSelectedProgram] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [userType, setUserType] = useState<'STUDENT' | 'FACULTY'>('STUDENT');
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isChecked, setIsChecked] = useState(false);
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  
  // Add validation errors state
  const [validationErrors, setValidationErrors] = useState<{
    fullName?: string;
    idNumber?: string;
    phoneNumber?: string;
    program?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const validateIdNumber = (idNumber: string): { isValid: boolean; format: 'student' | 'faculty' | null } => {
    const studentIdRegex = /^03-\d{4}-\d{5,6}$/;
    if (studentIdRegex.test(idNumber)) {
      return { isValid: true, format: 'student' };
    }
    const facultyIdRegex = /^UP-\d{2}-\d{3}-F$/i;
    if (facultyIdRegex.test(idNumber)) {
      return { isValid: true, format: 'faculty' };
    }
   
    return { isValid: false, format: null };
  };
 
  const validatePhoneNumber = (phoneNumber: string): boolean => {
    const phoneRegex = /^09\d{9}$/;
    return phoneRegex.test(phoneNumber);
  };
 
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  const validateFullName = (name: string): boolean => {
    const nameRegex = /^[A-Za-z]{2,}(?: [A-Za-z-]+)*(, )[A-Za-z-]{2,}(?: [A-Za-z-]+)*( [A-Z]\.?)?$/;
    return nameRegex.test(name);
  };

  const validatePasswordsMatch = (password: string, confirmPassword: string): boolean => {
    return password === confirmPassword;
  };

  const ErrorModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={errorModalVisible}
      onRequestClose={() => setErrorModalVisible(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={[styles.modalTitle, { textAlign: 'center', color: '#d32f2f' }]}>Error</Text>
          <Text style={[styles.modalItemText, { textAlign: 'center', marginBottom: 20 }]}>{errorMessage}</Text>
          <CustomButton
            title="OK"
            onPress={() => setErrorModalVisible(false)}
            color="#d32f2f"
          />
        </View>
      </View>
    </Modal>
  );
 
  const courses = [
    { label: "B.S. Architecture", value: "ARCH" },
    { label: "B.S. Civil Engineering", value: "CE" },
    { label: "B.S. Computer Engineering", value: "CPE" },
    { label: "B.S. Electrical Engineering", value: "EE" },
    { label: "B.S. Electronics Engineering", value: "ECE" },
    { label: "B.S. Mechanical Engineering", value: "ME" }
  ];

  const selectCourse = (course: string) => {
    setSelectedProgram(course);
    setModalVisible(false);
    // Clear any program validation error when a course is selected
    if (validationErrors.program) {
      setValidationErrors(prev => ({ ...prev, program: undefined }));
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
 
  const onSignup = async () => {
    // Reset validation errors
    setValidationErrors({});
    
    // Create a new errors object
    const errors: any = {};
    let hasErrors = false;

    // Validate all fields
    if (!fullName) {
      errors.fullName = 'Full name is required';
      hasErrors = true;
    } else if (!validateFullName(fullName)) {
      errors.fullName = 'Format should be: Last Name, First Name (MI optional)';
      hasErrors = true;
    }

    const idValidation = validateIdNumber(idNumber);
    if (!idNumber) {
      errors.idNumber = 'ID number is required';
      hasErrors = true;
    } else if (!idValidation.isValid) {
      errors.idNumber = 'Format should be: 03-XXXX-XXXXXX for students';
      hasErrors = true;
    } else if (idValidation.format === 'faculty') {
      errors.idNumber = 'This ID format is for faculty members. Please use a valid student ID.';
      hasErrors = true;
    }

    if (!phoneNumber) {
      errors.phoneNumber = 'Phone number is required';
      hasErrors = true;
    } else if (!validatePhoneNumber(phoneNumber)) {
      errors.phoneNumber = 'Enter a valid phone number (e.g., 09XXXXXXXXX)';
      hasErrors = true;
    }

    if (!selectedProgram) {
      errors.program = 'Please select your program';
      hasErrors = true;
    }

    if (!validateEmail(email)) {
      setErrorMessage('Please enter a valid email address');
      hasErrors = true;
      return;
    }
    if (!email.includes('@')) {
      setErrorMessage('Please enter a valid email address');
      hasErrors = true;
      return;
    }
    const passwordValidation = validatePassword(password);
    if (!password) {
      errors.password = 'Password is required';
      hasErrors = true;
    } else if (!passwordValidation.isValid) {
      errors.password = passwordValidation.message;
      hasErrors = true;
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
      hasErrors = true;
    } else if (!validatePasswordsMatch(password, confirmPassword)) {
      errors.confirmPassword = 'Passwords do not match';
      hasErrors = true;
    }

    if (!isChecked) {
      setErrorMessage('Please agree to the Data Privacy Policy');
      setErrorModalVisible(true);
      return;
    }

    // If there are validation errors, show them inline and return
    if (hasErrors) {
      setValidationErrors(errors);
      return;
    }

    setIsLoading(true);

    try {
      const usersRef = collection(db, 'student');
      
      // Check ID number existence
      const idQuery = query(usersRef, where('idNumber', '==', idNumber));
      const idSnapshot = await getDocs(idQuery);
      
      if (!idSnapshot.empty) {
        setErrorMessage('This ID number is already registered. Please use a different ID number or contact support.');
        setErrorModalVisible(true);
        return;
      }
      
      // Check phone number existence
      const phoneQuery = query(usersRef, where('phoneNumber', '==', phoneNumber));
      const phoneSnapshot = await getDocs(phoneQuery);
      
      if (!phoneSnapshot.empty) {
        setErrorMessage('This phone number is already registered. Please use a different phone number.');
        setErrorModalVisible(true);
        return;
      }
      
      // Check email existence
      const emailQuery = query(usersRef, where('email', '==', email));
    const emailSnapshot = await getDocs(emailQuery);

    if (emailSnapshot.empty) {
      setErrorMessage('This email is not registered. Please use an existing email.');
      setErrorModalVisible(true);
      return;
      }

      // If all checks pass, proceed with signup
      await handleSignup({
        userType,
        fullName,
        idNumber,
        phoneNumber,
        email,
        password,
        router,
        program: selectedProgram,
      });

      // Show success message
      Alert.alert(
        "Account Created",
        "Your account has been created successfully. Please check your email to verify your account.",
        [
          { text: "OK", onPress: () => router.push('/student/login') }
        ]
      );

    } catch (error: any) {
      // Enhanced error handling with specific messages
      if (error.code === 'auth/email-already-in-use') {
        setErrorMessage('This email is already registered. Please use a different email or try logging in.');
      } else if (error.code === 'auth/invalid-email') {
        setErrorMessage('The email address is not valid.');
      } else if (error.code === 'auth/weak-password') {
        setErrorMessage('The password is too weak. Please choose a stronger password.');
      } else if (error.code === 'auth/network-request-failed') {
        setErrorMessage('Network error. Please check your internet connection and try again.');
      } else if (error.message) {
        // If the error has a message property, use it
        setErrorMessage(error.message);
      } else {
        // Fallback error message
        setErrorMessage('Something went wrong. Please try again later.');
      }
      setErrorModalVisible(true);
    } finally {
      setIsLoading(false);
    }
  };
 
  return (
    <GradientBackgroundContainer style={styles.background}>
      <View style={styles.centerContainer}>
        <ScrollView style={{
          width: '90%',
          maxWidth: 600,
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          padding: 20,
          borderRadius: 12,
          borderColor: 'white',
          borderWidth: 1,
        }}
        contentContainerStyle={{
          alignItems: 'center'
        }}>
          <View style={styles.blurBackground} />
         
          <ErrorModal />
          <Text style={styles.heading}>Signup</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={[styles.input, validationErrors.fullName && { borderColor: '#d32f2f' }]}
              placeholder="Last Name, First Name (MI optional)"
              value={fullName}
              onChangeText={(text) => {
                setFullName(text);
                if (validationErrors.fullName) {
                  setValidationErrors(prev => ({ ...prev, fullName: undefined }));
                }
              }}
            />
            {validationErrors.fullName && (
              <Text style={{ color: '#d32f2f', fontSize: 12, marginTop: 2 }}>
                {validationErrors.fullName}
              </Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>ID Number</Text>
            <TextInput
              style={[styles.input, validationErrors.idNumber && { borderColor: '#d32f2f' }]}
              placeholder="03-XXXX-XXXXXX or 03-XXXX-XXXXX"
              value={idNumber}
              onChangeText={(text) => {
                setIdNumber(text);
                if (validationErrors.idNumber) {
                  setValidationErrors(prev => ({ ...prev, idNumber: undefined }));
                }
              }}
            />
            {validationErrors.idNumber && (
              <Text style={{ color: '#d32f2f', fontSize: 12, marginTop: 2 }}>
                {validationErrors.idNumber}
              </Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <TextInput
              style={[styles.input, validationErrors.phoneNumber && { borderColor: '#d32f2f' }]}
              placeholder="Enter your phone number"
              value={phoneNumber}
              onChangeText={(text) => {
                setPhoneNumber(text);
                if (validationErrors.phoneNumber) {
                  setValidationErrors(prev => ({ ...prev, phoneNumber: undefined }));
                }
              }}
              keyboardType="phone-pad"
            />
            {validationErrors.phoneNumber && (
              <Text style={{ color: '#d32f2f', fontSize: 12, marginTop: 2 }}>
                {validationErrors.phoneNumber}
              </Text>
            )}
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Program</Text>
            <TouchableOpacity
              style={[styles.input, validationErrors.program && { borderColor: '#d32f2f' }]}
              onPress={() => setModalVisible(true)}
            >
              <Text style={selectedProgram ? styles.selectedText : styles.placeholderText}>
                {selectedProgram ? courses.find(c => c.value === selectedProgram)?.label : "Select Your Course"}
              </Text>
            </TouchableOpacity>
            {validationErrors.program && (
              <Text style={{ color: '#d32f2f', fontSize: 12, marginTop: 2 }}>
                {validationErrors.program}
              </Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={[styles.input, validationErrors.email && { borderColor: '#d32f2f' }]}
              placeholder="Enter your email address"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (validationErrors.email) {
                  setValidationErrors(prev => ({ ...prev, email: undefined }));
                }
              }}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {validationErrors.email && (
              <Text style={{ color: '#d32f2f', fontSize: 12, marginTop: 2 }}>
                {validationErrors.email}
              </Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={[styles.passwordContainer, validationErrors.password && { borderColor: '#d32f2f' }]}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Enter your password"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (validationErrors.password) {
                    setValidationErrors(prev => ({ ...prev, password: undefined }));
                  }
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIconButton}
              >
                <Ionicons
                  name={showPassword ? "eye-outline" : "eye-off-outline"}
                  size={24}
                  color="white"
                />
              </TouchableOpacity>
            </View>
            {validationErrors.password ? (
              <Text style={{ color: '#d32f2f', fontSize: 12, marginTop: 2 }}>
                {validationErrors.password}
              </Text>
            ) : (
              <Text style={styles.passwordHelperText}>
                Password must be at least 8 characters long and include uppercase, lowercase,
                number, and special character.
              </Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Confirm Password</Text>
            <View style={[styles.passwordContainer, validationErrors.confirmPassword && { borderColor: '#d32f2f' }]}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Confirm your password"
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (validationErrors.confirmPassword) {
                    setValidationErrors(prev => ({ ...prev, confirmPassword: undefined }));
                  }
                }}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeIconButton}
              >
                <Ionicons
                  name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                  size={24}
                  color="white"
                />
              </TouchableOpacity>
            </View>
            {validationErrors.confirmPassword && (
              <Text style={{ color: '#d32f2f', fontSize: 12, marginTop: 2 }}>
                {validationErrors.confirmPassword}
              </Text>
            )}
          </View>

          <Modal
            animationType="fade"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalHeader}>Select Your Program</Text>
                {courses.map((course) => (
                  <TouchableOpacity
                    key={course.value}
                    style={styles.modalItem}
                    onPress={() => selectCourse(course.value)}
                  >
                    <Text style={styles.modalItemText}>{course.label}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          <View style={styles.consentContainer}>
            <Checkbox value={isChecked} onValueChange={setIsChecked} color={isChecked ? "#4CAF50" : undefined} />
            <Text style={styles.consentText}> I agree to the{' '}
              <TouchableOpacity onPress={() => setPrivacyModalVisible(true)}>
                <Text style={styles.linkText}>Data Privacy Policy</Text>
              </TouchableOpacity>
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.button, (isLoading || !isChecked) && styles.buttonDisabled]}
            onPress={onSignup}
            disabled={isLoading || !isChecked}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'CREATING...' : 'CREATE'}
            </Text>
          </TouchableOpacity>
             
          <Modal
            animationType="slide"
            transparent={true}
            visible={privacyModalVisible}
            onRequestClose={() => setPrivacyModalVisible(false)}
          >
            <ScrollView contentContainerStyle={styles.scrollView}>
              <View style={styles.modalContainer}>
                <DataPrivacyPolicy visible={privacyModalVisible} onClose={() => setPrivacyModalVisible(false)} />
              </View>
            </ScrollView>
          </Modal>

          <View style={styles.loginContainer}>
            <Text style={{ color: 'white' }}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/student/login')}>
              <Text style={[styles.loginText, {color: 'white'}]}>Login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </GradientBackgroundContainer>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginVertical: 50
  },
  passwordHelperText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    marginTop: 5,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: 'white',
    borderWidth: 2,
    borderRadius: 5,
  },
  passwordInput: {
    flex: 1,
    height: 40,
    paddingLeft: 10,
    color: 'white'
  },
  eyeIconButton: {
    paddingHorizontal: 10,
  },
  iconText: {
    color: 'white',
    fontSize: 16,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
    marginTop: 5,
  },
  linkText: {
    color: 'white',
    textDecorationLine: 'underline',
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingVertical: 20
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    width: "90%",
    maxWidth: 500,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
    color: "#004000",
  },
  scrollView: {
    flexGrow: 1,
  },
  modalText: {
    fontSize: 14,
    textAlign: "left",
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 10,
  },
  boldText: {
    fontWeight: "bold",
  },
  privacybutton: {
    backgroundColor: "#004000",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    width: 100,
    alignSelf: 'center'
  },
  privacybuttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  consentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  consentText: {
    marginLeft: 8,
    color: 'white',
  },
  userTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  userTypeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'white',
    alignItems: 'center',
  },
  userTypeButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderWidth: 2,
  },
  userTypeText: {
    color: 'white',
    fontWeight: 'bold',
  },
  userTypeTextActive: {
    color: 'white',
  },
  button: {
    width: '60%',
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 25,
    marginBottom: 25,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 30,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: -5,
  },
  background: {
    flex: 1,
    backgroundColor: '#034041',
  },
  container: {
    width: '90%',
    maxWidth: 600,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderColor: 'white',
    borderWidth: 1,
  },
  blurBackground: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
    backdropFilter: 'blur(10px)',
    zIndex: -1,
  },
  heading: {
    fontSize: 28,
    color: 'white',
    marginBottom: 10,
    fontWeight: 'bold'
  },
  inputContainer: {
    width: '100%',
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
    marginBottom: 5,
    paddingLeft: 2,
  },
  input: {
    width: '100%',
    height: 40,
    borderColor: 'white',
    borderWidth: 2,
    paddingLeft: 10,
    borderRadius: 5,
    justifyContent: 'center',
    color: 'white'
  },
  loginText: {
    color: '#2c6b2f',
    fontWeight: 'bold',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalItemText: {
    fontSize: 16,
  },
  closeButton: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#2c6b2f',
    borderRadius: 5,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  selectedText: {
    color: 'white',
  },
  placeholderText: {
    color: 'white',
  },
});

