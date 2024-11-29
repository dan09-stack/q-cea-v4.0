// app/signup.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { useRouter } from 'expo-router';
import { db } from "../firebaseConfig";

export default function Signup(): JSX.Element {
  const [fullName, setFullName] = useState<string>('');
  const [idNumber, setIdNumber] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const router = useRouter();

  const handleSignup = async (): Promise<void> => {
    if (!fullName || !idNumber || !phoneNumber || !selectedCourse || !email || !password) {
      Alert.alert('Validation Error', 'Please fill in all fields.');
      return;
    }
  
    try {
      // Create user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
  
      // Store user data in Firestore
      await db.collection('users').doc(user.uid).set({
        fullName,
        idNumber,
        phoneNumber,
        course: selectedCourse,
        email,
      });
  
      // Send verification email
      await sendEmailVerification(user);
      Alert.alert('Verification Email Sent', 'Please check your email to verify your account.');
  
      // Navigate to the verification page
      router.push({
        pathname: '/verify',
        params: {
          fullName,
          email,
          idNumber,
          course: selectedCourse,
        },
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      Alert.alert('Signup Error', errorMessage);
    }
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Signup</Text>
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
      <Picker
        selectedValue={selectedCourse}
        onValueChange={(itemValue) => setSelectedCourse(itemValue)}
        style={styles.picker}
      >
        <Picker.Item label="Select Your Course" value="" />
        <Picker.Item label="Course A" value="A" />
        <Picker.Item label="Course B" value="B" />
        <Picker.Item label="Course C" value="C" />
        <Picker.Item label="Course D" value="D" />
        <Picker.Item label="Course E" value="E" />
        <Picker.Item label="Course F" value="F" />
      </Picker>
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
        secureTextEntry
        autoCapitalize="none"
      />
      <Button title="Sign Up" onPress={handleSignup} />
      <View style={styles.loginContainer}>
        <Text style={styles.loginText}>Already have an account? </Text>
        <TouchableOpacity onPress={() => router.push('/login')}>
          <Text style={styles.loginLink}>Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  picker: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 10,
    height: 50,
    justifyContent: 'center',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginText: {
    fontSize: 16,
    color: '#666',
  },
  loginLink: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: 'bold',
  },
});
