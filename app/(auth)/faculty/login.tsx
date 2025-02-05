import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { auth, db } from '../../../firebaseConfig';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Checkbox from 'expo-checkbox';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberPassword, setRememberPassword] = useState(false);
  
  // Error handling
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    loadSavedCredentials();
  }, []);

  const loadSavedCredentials = async () => {
    try {
      const savedEmail = await AsyncStorage.getItem('savedEmail');
      const savedPassword = await AsyncStorage.getItem('savedPassword');
      if (savedEmail && savedPassword) {
        setEmail(savedEmail);
        setPassword(savedPassword);
        setRememberPassword(true);
      }
    } catch (error) {
      console.log('Error loading saved credentials');
    }
  };

  const saveCredentials = async () => {
    try {
      if (rememberPassword) {
        await AsyncStorage.setItem('savedEmail', email);
        await AsyncStorage.setItem('savedPassword', password);
      } else {
        await AsyncStorage.removeItem('savedEmail');
        await AsyncStorage.removeItem('savedPassword');
      }
    } catch (error) {
      console.log('Error saving credentials');
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMessage('Please fill in both email and password.');
      setErrorModalVisible(true);
      return;
    }

    try {
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      const user = userCredential.user;
      
      if (!user) {
        setErrorMessage('User authentication failed.');
        setErrorModalVisible(true);
        return;
      }

      await saveCredentials();

      const userDoc = await db.collection('users').doc(user.uid).get();
      if (!userDoc.exists) {
        setErrorMessage('User data not found.');
        setErrorModalVisible(true);
        return;
      }

      const userData = userDoc.data();

      router.push({
        pathname: '/(tabs)/home',
        params: {
          fullName: userData?.fullName,
          email: userData?.email,
          idNumber: userData?.idNumber,
          course: userData?.course,
          phoneNumber: userData?.phoneNumber,
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        let errorMessage = 'An error occurred while logging in.';
        switch (error.message) {
          case 'Firebase: Error (auth/invalid-email).':
            errorMessage = 'The email address is not valid.';
            break;
          case 'Firebase: Error (auth/user-not-found).':
            errorMessage = 'No user found with this email.';
            break;
          case 'Firebase: Error (auth/wrong-password).':
            errorMessage = 'Incorrect password.';
            break;
          default:
            errorMessage = error.message;
        }
        setErrorMessage(errorMessage);
        setErrorModalVisible(true);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
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
      <View style={styles.checkboxContainer}>
        <Checkbox
          value={rememberPassword}
          onValueChange={setRememberPassword}
          color={rememberPassword ? '#007AFF' : undefined}
        />
        <Text style={styles.checkboxLabel}>Remember Password</Text>
      </View>
      <Button title="Login" onPress={handleLogin} />
      <View style={styles.signupContainer}>
        <Text style={styles.signupText}>Don't have an account? </Text>
        <TouchableOpacity onPress={() => router.push('/student/signup')}>
          <Text style={styles.signupLink}>Sign Up</Text>
        </TouchableOpacity>
      </View>
      
      {/* Error Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={errorModalVisible}
        onRequestClose={() => setErrorModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>{errorMessage}</Text>
            <Button title="OK" onPress={() => setErrorModalVisible(false)} />
          </View>
        </View>
      </Modal>
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
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 16,
    color: '#666',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  signupText: {
    fontSize: 16,
    color: '#666',
  },
  signupLink: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 15,
  },
});
