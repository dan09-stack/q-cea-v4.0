import React, { useState, useEffect } from 'react';
import { auth, db } from '@/firebaseConfig';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ImageBackground, Image, Modal } from 'react-native';
import { handleUserLogin } from '../../../services/auth';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Checkbox from 'expo-checkbox';
import { Ionicons } from '@expo/vector-icons';
import { CustomButton } from '@/components/ui/CustomButton';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberPassword, setRememberPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loginAttempts, setLoginAttempts] = useState(0); // Track failed attempts
  const [lockoutTime, setLockoutTime] = useState<number | null>(null); // Track lockout time
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

  const handleLogin = async (email: string, password: string) => {
    // Check if user is locked out
    if (lockoutTime && Date.now() < lockoutTime) {
      const remainingLockoutTime = Math.ceil((lockoutTime - Date.now()) / 1000);
      setErrorMessage(`Too many failed attempts. Please wait ${remainingLockoutTime} seconds.`);
      setErrorModalVisible(true);
      return;
    }

    if (!email || !password) {
      setErrorMessage('Please fill in both email and password.');
      setErrorModalVisible(true);
      return;
    }

    setIsLoading(true);
    try {
      await auth.signInWithEmailAndPassword(email, password);
      
      // Reset login attempts on successful login
      setLoginAttempts(0);
      setLockoutTime(null);

      // Save credentials
      await saveCredentials();

      router.push('/(tabs)/home');
    } catch (error: any) {
      let errorMessage = 'Incorrect password/email. Please try again.';
      if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please try again.';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'User not found. Please check your email.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      }

      setErrorMessage(errorMessage);
      setErrorModalVisible(true);

      // Increment login attempts and apply progressive lockout
setLoginAttempts(prevAttempts => {
  const newAttempts = prevAttempts + 1;
  let lockDuration = 0;

  // Apply progressive lockout based on failed attempts
  if (newAttempts % 5 === 0) { // Show the lockout only after every 5th failed attempt
    if (newAttempts >= 5 && newAttempts < 10) {
      lockDuration = 30 * 1000; // 30 seconds
    } else if (newAttempts >= 10 && newAttempts < 15) {
      lockDuration = 60 * 1000; // 1 minute
    } else if (newAttempts >= 15 && newAttempts < 20) {
      lockDuration = 300 * 1000; // 5 minutes
    } else if (newAttempts >= 20) {
      lockDuration = 600 * 1000; // 10 minutes
    }

    if (lockDuration > 0) {
      setLockoutTime(Date.now() + lockDuration); // Lockout for calculated duration
      setErrorMessage(`Too many failed attempts. Please try again in ${lockDuration / 1000} seconds.`);
      setErrorModalVisible(true);
    }
  }

  return newAttempts;
});

    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ImageBackground source={require('../../../assets/green.jpg')} style={styles.background} imageStyle={{ resizeMode: 'cover' }}>
      <View style={styles.container}>
        <Image source={require('../../../assets/circle.png')} style={styles.logo} />
        <Text style={styles.heading}>Login</Text>
        
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput style={styles.input} placeholder="Enter your email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          
          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={24} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.checkboxContainer}>
          <TouchableOpacity style={styles.checkboxWrapper} onPress={() => setRememberPassword(!rememberPassword)}>
            <Checkbox value={rememberPassword} onValueChange={setRememberPassword} color={rememberPassword ? '#2c6b2f' : undefined} />
            <Text style={styles.checkboxLabel}>Remember Password</Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => router.push({ pathname: '/(auth)/student/forgotPassword', params: { loginEmail: email } })}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>

        <CustomButton title={isLoading ? "Loading..." : "Login"} onPress={() => handleLogin(email, password)} />

        <View style={styles.signupContainer}>
          <Text>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/student/signup')}>
            <Text style={styles.linkText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal animationType="slide" transparent={true} visible={errorModalVisible} onRequestClose={() => setErrorModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Error</Text>
            <Text style={styles.modalItemText}>{errorMessage}</Text>
            <CustomButton title="Close" onPress={() => setErrorModalVisible(false)} />
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    width: '100%', 
    height: '100%' 
  },
  container: { 
    width: '90%', 
    maxWidth: 500, 
    backgroundColor: 'rgba(255, 255, 255, 0.8)', 
    padding: 20, 
    borderRadius: 12, 
    alignItems: 'center', 
    marginTop: 50 
  },
  logo: { 
    width: 170, 
    height: 170, 
    top: -85, 
    position: 'absolute', 
    borderColor: '#2c6b2f', 
    borderWidth: 1, 
    borderRadius: 100 
  },
  heading: { 
    fontSize: 28, 
    fontFamily: 'Roboto', 
    color: '#000000', 
    marginTop: 75, 
    marginBottom: 10 
  },
  inputContainer: { 
    width: '100%', 
    marginBottom: 1 
  },
  label: { 
    fontSize: 16, 
    color: '#000000', 
    marginBottom: 1, 
    fontWeight: '500' 
  },
  input: { 
    width: '100%', 
    height: 45, 
    borderColor: '#000', 
    borderWidth: 1, 
    marginBottom: 5, 
    paddingLeft: 10, 
    borderRadius: 5 
  },
  passwordContainer: { 
    width: '100%', 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 15, 
    position: 'relative' 
  },
  passwordInput: { 
    width: '100%', 
    height: 45, 
    borderColor: '#000', 
    borderWidth: 1, 
    paddingLeft: 10, 
    borderRadius: 5, 
    paddingRight: 50 
  },
  eyeIcon: { 
    position: 'absolute', 
    right: 12, 
    height: '100%', 
    justifyContent: 'center' 
  },
  checkboxContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    width: '100%', 
    marginBottom: 15 
  },
  checkboxWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  checkboxLabel: { 
    marginLeft: 8, 
    fontSize: 15, 
    color: '#000' 
  },
  forgotPasswordText: { 
    marginBottom: 1, 
    color: 'gray', 
    fontSize: 14 
  },
  signupContainer: { 
    marginTop: 10, 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  linkText: { 
    color: '#2c6b2f' 
  },
  modalContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: 'rgba(0, 0, 0, 0.5)' 
  },
  modalContent: { 
    backgroundColor: '#fff', 
    padding: 20, 
    borderRadius: 8, 
    width: 300 
  },
  modalTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginBottom: 10 
  },
  modalItemText: { 
    fontSize: 16, 
    marginBottom: 20 
  }
});
