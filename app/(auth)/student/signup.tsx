import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, TouchableOpacity, ImageBackground, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { handleSignup } from '../../../services/auth';

export default function Signup(): JSX.Element {
  const [fullName, setFullName] = useState<string>('');
  const [idNumber, setIdNumber] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const onSignup = async () => {
    setIsLoading(true);
    try {
      await handleSignup({
        fullName,
        idNumber,
        phoneNumber,
        selectedCourse,
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
            <Text style={styles.heading}>Signup</Text>
            <TextInput
              style={styles.input}
              placeholder="Full Name (Last Name, First Name MI)"
              value={fullName}
              onChangeText={setFullName}
            />
            <TextInput
              style={styles.input}
              placeholder="ID Number"
              value={idNumber}
              onChangeText={setIdNumber}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
            />
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedCourse}
                onValueChange={(itemValue) => setSelectedCourse(itemValue)}
                style={styles.picker}
                placeholder='Select Your Course'
              >
                <Picker.Item label="Select Your Course" value=""  />
                <Picker.Item label="Course A" value="A" />
                <Picker.Item label="Course B" value="B" />
                <Picker.Item label="Course C" value="C" />
                <Picker.Item label="Course D" value="D" />
                <Picker.Item label="Course E" value="E" />
                <Picker.Item label="Course F" value="F" />
              </Picker>
            </View>
            
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
            />
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
              <Text>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/student/login')}>
                <Text style={styles.loginText}>Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </ImageBackground>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#2c6b2f',
    width: '30%',
    padding: 12,
    alignItems: 'center',
    borderRadius: 5,
    marginBottom: 15,
  },
  buttonDisabled: {
    backgroundColor: '#84a886',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    width: '90%',
    maxWidth: 600,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  heading: {
    fontSize: 28,
    color: '#000',
    marginBottom: 30,
  },
  input: {
    width: '100%',
    height: 40,
    borderColor: '#000',
    borderWidth: 1,
    marginBottom: 15,
    paddingLeft: 10,
    borderRadius: 5,
  },
  pickerContainer: {
    width: '100%',
    height: 40,
    borderWidth: 1,
    marginBottom: 15,
    borderRadius: 5,
    justifyContent: 'center',
  },
  picker: {
    width: '100%',
    height:100,
    marginTop: Platform.OS === 'ios' ? 0 : 0,
  },
  loginText: {
    color: '#2c6b2f',
    fontWeight: 'bold',
    fontSize: 16,
  }
});
