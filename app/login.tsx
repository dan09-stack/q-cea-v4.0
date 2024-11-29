// app/login.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet, TouchableOpacity } from 'react-native';
import { auth, db } from '../firebaseConfig';
import { useRouter } from 'expo-router';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Validation Error', 'Please fill in both email and password.');
      return;
    }

    try {
      // Authenticate the user
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      const user = userCredential.user;
     
      if (!user) {
        Alert.alert('Login Error', 'User authentication failed.');
        return;
      }

      // Fetch user data from Firestore
      const userDoc = await db.collection('users').doc(user.uid).get();
      if (!userDoc.exists) {
        Alert.alert('Login Error', 'User data not found.');
        return;
      }

      const userData = userDoc.data();


      router.push({
        pathname: '/welcome',
        params: {
          fullName: userData?.fullName,
          email: userData?.email,
          idNumber: userData?.idNumber,
          course: userData?.course,
          phoneNumber: userData?.phoneNumber,
        },
      });
    } catch (error: unknown) {
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
        Alert.alert('Login Error', errorMessage);
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
      <Button title="Login" onPress={handleLogin} />
      <View style={styles.signupContainer}>
        <Text style={styles.signupText}>Don't have an account? </Text>
        <TouchableOpacity onPress={() => router.push('/signup')}>
          <Text style={styles.signupLink}>Sign Up</Text>
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
});
