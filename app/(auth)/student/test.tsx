import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ImageBackground, ScrollView, Modal, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { handleSignup } from '../../../services/auth';
import { CustomButton } from '@/components/ui/CustomButton';
import Checkbox from 'expo-checkbox';

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
          <Text style={[styles.modalItemText, { textAlign: 'center', color: '#d32f2f' }]}>{errorMessage}</Text>
          <CustomButton title="Close" onPress={() => setErrorModalVisible(false)} color="#d32f2f" />
        </View>
      </View>
    </Modal>
  );
  
  const courses = [
    { label: "Select Program", value: "" },
    { label: "BS Architecture", value: "ARCH" },
    { label: "BS Civil Engineering", value: "CE" },
    { label: "BS Computer Engineering", value: "CPE" },
    { label: "BS Electrical Engineering", value: "EE" },
    { label: "BS Electronics Engineering", value: "ECE" },
    { label: "BS Mechanical Engineering", value: "ME" }
  ];

  const selectCourse = (course: string) => {
    setSelectedProgram(course);
    setModalVisible(false);
  };
  
  const onSignup = async () => {
    if (!fullName || !email || !password || !idNumber || !phoneNumber || !selectedProgram) {
      setErrorMessage('Please fill in all fields');
      setErrorModalVisible(true);
      return;
    }
  
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long');
      setErrorModalVisible(true);
      return;
    }
  
    if (!email.includes('@')) {
      setErrorMessage('Please enter a valid email address');
      setErrorModalVisible(true);
      return;
    }
  
    setIsLoading(true);
  
    try {
      await handleSignup({
        userType,
        fullName,
        idNumber,
        phoneNumber,
        selectedProgram,
        email,
        password,
        router
      });
    } catch {
      setErrorMessage('Something went wrong. Please try again.');
      setErrorModalVisible(true);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <ImageBackground
      source={require('../../../assets/green p2.jpg')}
      style={styles.background}
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
          <View style={styles.inputContainer}>
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
          </View>

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
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <Modal
            animationType="fade"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalHeader}>Select Your Course</Text>
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
            <TouchableOpacity onPress={() => setPrivacyModalVisible(true)}>
              <Text style={styles.consentText}>I agree to the <Text style={styles.linkText}>Data Privacy Policy</Text></Text>
            </TouchableOpacity>
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
          ></Modal>
          <View style={styles.modalContainer}>
  <View style={styles.modalContent}>
    <Text style={styles.modalTitle}>Data Privacy Policy</Text>
    <ScrollView style={styles.scrollView}>
      <Text style={styles.modalText}>
        <Text style={styles.sectionTitle}>Effective Date:</Text> [Insert Date]{"\n"}
        <Text style={styles.sectionTitle}>Last Updated:</Text> [Insert Date]{"\n\n"}

        Welcome to <Text style={styles.boldText}>Q-CEA</Text>. Your privacy is important to us. This Privacy Policy explains how we collect, use, disclose, and protect your personal data.{"\n\n"}

        <Text style={styles.sectionTitle}>1. Information We Collect</Text>{"\n"}
        - Name{"\n"}
        - ID Number{"\n"}
        - Phone Number{"\n"}
        - Program (e.g., Engineering, Architecture){"\n"}
        - Email Address{"\n"}
        - Password (encrypted){"\n\n"}

        <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>{"\n"}
        - Register and manage user accounts{"\n"}
        - Facilitate queue management{"\n"}
        - Send queue notifications{"\n"}
        - Improve system functionality{"\n"}
        - Communicate important updates{"\n"}
        - Ensure security and prevent fraud{"\n\n"}

        <Text style={styles.sectionTitle}>3. Data Security</Text>{"\n"}
        We implement security measures like encryption and access controls. However, users must also safeguard their login credentials.{"\n\n"}

        <Text style={styles.sectionTitle}>4. Your Rights</Text>{"\n"}
        - Access, update, or correct your data{"\n"}
        - Request deletion of your account{"\n"}
        - Opt out of notifications{"\n\n"}

        <Text style={styles.sectionTitle}>5. Contact Us</Text>{"\n"}
        📧 [Your Contact Email]{"\n"}
        📍 [Your Business Address]{"\n"}
      </Text>
    </ScrollView>
    
    {/* Buttons for User Interaction */}
    <TouchableOpacity style={styles.button} onPress={() => setModalVisible(false)}>
      <Text style={styles.buttonText}>I Agree</Text>
    </TouchableOpacity>
  </View>
</View>

                <CustomButton title="Close" onPress={() => setPrivacyModalVisible(false)} color="#4CAF50" />

          <View style={styles.loginContainer}>
            <Text style={{ color: 'white' }}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/student/login')}>
              <Text style={[styles.loginText, {color: 'white'}]}>Login</Text>
            </TouchableOpacity>
            </View>
           </View>
          </ScrollView>
       </ImageBackground>  
  );
}

const styles = StyleSheet.create({
  linkText: {
    color: 'white',
    textDecorationLine: 'underline',
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    width: "90%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
    color: "#004000",
  },
  scrollView: {
    maxHeight: 300,
    marginBottom: 10,
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
    width: '100%',
    height: '120%',
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
