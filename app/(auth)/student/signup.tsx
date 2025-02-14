import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ImageBackground, ScrollView, Modal, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { handleSignup } from '../../../services/auth';
import { CustomButton } from '@/components/ui/CustomButton';

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
    }
    catch{
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
     finally {
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
            animationType="slide"
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
            
           <TouchableOpacity
                    style={[styles.button, isLoading && styles.buttonDisabled]}
                    onPress={onSignup}
                    disabled={isLoading}
           >
             <Text style={styles.buttonText}>
              {isLoading ? 'CREATING...' : 'CREATE'}
             </Text>
             </TouchableOpacity>

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
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    maxHeight: '80%',
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