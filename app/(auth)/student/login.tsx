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
  // const generateNewCaptcha = () => {
  //   const newCaptcha = generateCaptcha(6); // 6 characters long
  //   setCaptchaText(newCaptcha);
  //   setUserCaptchaInput('');
  //   setCaptchaError('');
  // };
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
      console.log('Error loading saved credential');
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

      // Increment login attempts and lock out user after 3 failed attempts
      setLoginAttempts(prevAttempts => {
        const newAttempts = prevAttempts + 1;
        if (newAttempts >= 3) {
          const lockDuration = 30000; // 30 seconds
          setLockoutTime(Date.now() + lockDuration); // Lockout for 30 seconds
          setErrorMessage('Too many failed attempts. Please try again later.');
          setErrorModalVisible(true);
        }
        return newAttempts;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require('../../../assets/green.jpg')}
      style={styles.background}
      imageStyle={{ resizeMode: 'cover' }}        
    >
      
      <View style={styles.container}>
        <View style={styles.blurBackground} />
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
            <TouchableOpacity 
              style={styles.eyeIcon} 
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons 
                name={showPassword ? "eye-outline" : "eye-off-outline"} 
                size={24} 
                color="gray"
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.checkboxContainer}>
  <View style={styles.checkboxWrapper}>
    <Checkbox 
      value={rememberPassword} 
      onValueChange={setRememberPassword} 
      color={rememberPassword ? '#2c6b2f' : undefined} 
    />
    <Text style={styles.checkboxLabel}>Remember Password</Text>
  </View>

  <TouchableOpacity 
    style={styles.forgotPasswordWrapper} 
    onPress={() => router.push({ pathname: '/(auth)/student/forgotPassword', params: { loginEmail: email } })}
  >
    <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
  </TouchableOpacity>
</View>


        {/* Sign In Button */}
        <TouchableOpacity
                           style={[styles.button, isLoading && styles.buttonDisabled]}
                           onPress={() => handleLogin(email, password)}
                           disabled={isLoading}
         >
            <Text style={styles.buttonText}>
                         {isLoading ? 'Logging In...' : 'Log In'}
                        </Text>
         </TouchableOpacity>

        <View style={styles.signupContainer}>
        <Text style={{ color: 'white' }}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/student/signup')}>
            <Text style={styles.linkText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal animationType="fade" transparent={true} visible={errorModalVisible} onRequestClose={() => setErrorModalVisible(false)}>
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
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  captchaBox: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 5,
    marginBottom: 15,
  },
  captchaText: {
    fontSize: 24,
    letterSpacing: 3,
    fontFamily: 'monospace',
  },
  captchaInput: {
    width: '100%',
    height: 45,
    borderColor: '#000',
    borderWidth: 1,
    marginBottom: 15,
    paddingLeft: 10,
    borderRadius: 5,
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  refreshButton: {
    padding: 10,
  },
  background: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    width: '100%', 
    height: '100%' 
  },
  blurBackground: {
    ...StyleSheet.absoluteFillObject, 
    borderRadius: 12, 
    backdropFilter: 'blur(10px)', 
    zIndex: -1, 
  },
  button: {
    width: '60%',
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    backgroundColor: '#rgba(255, 255, 255, 0.4)',
  },
  container: { 
    width: '90%', 
    maxWidth: 500, 
    backgroundColor: 'rgba(255, 255, 255, 0.1)', 
    padding: 20, 
    borderRadius: 12, 
    alignItems: 'center', 
    marginTop: 50 ,
    borderColor: 'white',
    borderWidth: 1,
  },
  logo: { 
    width: 170, 
    height: 170, 
    top: -85, 
    position: 'absolute', 
    borderColor: 'white', 
    borderWidth: 0, 
    borderRadius: 100 
  },
  heading: { 
    fontSize: 28, 
    fontFamily: 'Roboto', 
    color: 'white', 
    marginTop: 75, 
    marginBottom: 10 
  },
  inputContainer: { 
    width: '100%', 
    marginBottom: 1 
  },
  label: { 
    fontSize: 16, 
    color: 'white', 
    marginBottom: 3, 
    fontWeight: '500' 
  },
  input: { 
    width: '100%', 
    height: 45, 
    borderColor: 'white', 
    borderWidth: 2, 
    marginBottom: 15, 
    paddingLeft: 10, 
    borderRadius: 5 ,
    color: 'white'
  },
  passwordContainer: { 
    width: '100%', 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 20,
    marginTop: 1, 
    position: 'relative' 
    
  },
  passwordInput: { 
    width: '100%', 
    height: 45, 
    borderColor: 'white', 
    borderWidth: 2, 
    paddingLeft: 10, 
    borderRadius: 5, 
    paddingRight: 50 ,
    color: 'white'
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
    marginBottom: 15,
    width: '100%',
   
  },
  checkboxWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center',
    flexShrink: 1,

  },
  checkboxLabel: { 
    marginLeft: 8, 
    fontSize: 14, 
    color: 'white' 
  },
  forgotPasswordWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center',
    marginLeft: 8, 

  },
  forgotPasswordText: { 
    marginBottom: 1, 
    color: 'white', 
    fontSize: 14,
    
  },
  signupContainer: { 
    marginTop: 10, 
    flexDirection: 'row', 
    alignItems: 'center',
  },
  linkText: {
    color: 'white',
    fontWeight: 'bold',
  },
  modalContent: { 
    backgroundColor: 'white', 
    padding: 20, 
    borderRadius: 10, 
    width: '80%', 
    maxHeight: '80%' 
  },
  modalItem: { 
    padding: 15, 
    borderBottomWidth: 1, 
    borderBottomColor: '#eee' 
  },
  modalItemText: { 
    fontSize: 16, 
    textAlign: 'center' 
  },
});
