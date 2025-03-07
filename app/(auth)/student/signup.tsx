import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ImageBackground, ScrollView, Modal, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { handleSignup } from '../../../services/auth';
import { CustomButton } from '@/components/ui/CustomButton';
import { Ionicons } from '@expo/vector-icons';
const validateIdNumber = (idNumber: string): boolean => {
  // Check if ID number matches the format 03-XXXX-XXXXXX
  const idNumberRegex = /^03-\d{4}-\d{6}$/;
  return idNumberRegex.test(idNumber);
};

const validatePhoneNumber = (phoneNumber: string): boolean => {
  // Check if phone number is in the format 09XXXXXXXXX or +63XXXXXXXXX
  const phoneRegex = /^(09\d{9}|\+63\d{10})$/;
  return phoneRegex.test(phoneNumber);
};

const validateEmail = (email: string): boolean => {
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};import Checkbox from 'expo-checkbox';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedGradientContainer } from '@/components/ui/ThemedGradientContainer';
import { DataPrivacyPolicy } from '@/components/privacy/DataPrivacyPolicy';

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

  const [showPassword, setShowPassword] = useState<boolean>(false);

  const ErrorModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={errorModalVisible}
      onRequestClose={() => setErrorModalVisible(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={[styles.modalTitle, { textAlign: 'center',  }]}>Error</Text>
          <Text style={[styles.modalItemText, { textAlign: 'center', marginBottom: 20 }]}>{errorMessage}</Text>
          <CustomButton 
            title="OK" 
            onPress={() => setErrorModalVisible(false)}
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
  };
  
  const onSignup = async () => {
    // if (!fullName || !email || !password || !idNumber || !phoneNumber || !selectedProgram) {
    //   setErrorMessage('Please fill in all fields');
    //   setErrorModalVisible(true);
    //   return;
    // }
    // if (!validateIdNumber(idNumber)) {
    //   setErrorMessage('ID Number should be in format: 03-XXXX-XXXXXX');
    //   setErrorModalVisible(true);
    //   return;
    // }
    
    // // Validate phone number
    // if (!validatePhoneNumber(phoneNumber)) {
    //   setErrorMessage('Please enter a valid phone number (e.g., 09XXXXXXXXX or +63XXXXXXXXX)');
    //   setErrorModalVisible(true);
    //   return;
    // }
    
    // // Validate email format
    // if (!validateEmail(email)) {
    //   setErrorMessage('Please enter a valid email address');
    //   setErrorModalVisible(true);
    //   return;
    // }
    // if (password.length < 6) {
    //   setErrorMessage('Password must be at least 6 characters long');
    //   setErrorModalVisible(true);
    //   return;
    // }
    // if (!fullName.includes(',')) {
    //   setErrorMessage('Full Name should be in format: Last Name, First Name MI');
    //   setErrorModalVisible(true);
    //   return;
    // }
    
    // if (!email.includes('@')) {
    //   setErrorMessage('Please enter a valid email address');
    //   setErrorModalVisible(true);
    //   return;
    // }
  
    setIsLoading(true);
  
    try {
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
    } catch (error: any) {
      // Enhanced error handling with specific messages
      // if (error.code === 'auth/email-already-in-use') {
      //   setErrorMessage('This email is already registered. Please use a different email or try logging in.');
      // } else if (error.code === 'auth/invalid-email') {
      //   setErrorMessage('The email address is not valid.');
      // }
      // if (error.code === 'auth/email-already-in-use') {
      //   setErrorMessage('This email is already registered. Please use a different email or try logging in.');
      // } else if (error.code === 'auth/invalid-email') {
      //   setErrorMessage('The email address is not valid.');
      // } else if (error.code === 'auth/weak-password') {
      //   setErrorMessage('The password is too weak. Please choose a stronger password.');
      // } else if (error.code === 'auth/network-request-failed') {
      //   setErrorMessage('Network error. Please check your internet connection and try again.');
      // } else if (error.message) {
      //   // If the error has a message property, use it
      //   setErrorMessage(error.message);
      // } else {
      //   // Fallback error message
      //   setErrorMessage('Something went wrong. Please try again later.');
      // }
      // setErrorModalVisible(true);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <ThemedGradientContainer
         
       >
      <ScrollView contentContainerStyle={styles.scrollContent}>   
        <View style={styles.container}>
          <ErrorModal />
          <View style={styles.blurBackground} />
          <Text style={styles.heading}>Signup</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Last Name, First Name MI"
              value={fullName}
              onChangeText={setFullName}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>ID Number</Text>
            <TextInput
              style={styles.input}
              placeholder="03-XXXX-XXXXXX"
              value={idNumber}
              onChangeText={setIdNumber}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your phone number"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
            />
          </View>
          {/* <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>I am a</Text>
            <View style={styles.userTypeContainer}>
              <TouchableOpacity 
                style={[
                  styles.userTypeButton, 
                  userType === 'STUDENT' && styles.userTypeButtonActive
                ]}
                onPress={() => setUserType('STUDENT')}
              >
                <Text style={[
                  styles.userTypeText,
                  userType === 'STUDENT' && styles.userTypeTextActive
                ]}>Student</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.userTypeButton, 
                  userType === 'FACULTY' && styles.userTypeButtonActive
                ]}
                onPress={() => setUserType('FACULTY')}
              >
                <Text style={[
                  styles.userTypeText,
                  userType === 'FACULTY' && styles.userTypeTextActive
                ]}>Faculty</Text>
              </TouchableOpacity>
            </View>
          </View> */}

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Program</Text>
            <TouchableOpacity 
              style={styles.input}
              onPress={() => setModalVisible(true)}
            >
              <Text style={selectedProgram ? styles.selectedText : styles.placeholderText}>
                {selectedProgram ? courses.find(c => c.value === selectedProgram)?.label : "Select Your Course"}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
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
           </View>
          </ScrollView>
        </ThemedGradientContainer>
  );
}

const styles = StyleSheet.create({
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
    marginBottom: 30,
    fontWeight: 'bold'
  },
  inputContainer: {
    width: '100%',
    marginBottom: 15,
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
