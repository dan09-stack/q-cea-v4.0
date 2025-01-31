import React, { useState, useEffect } from 'react';
import { auth, db } from '@/firebaseConfig';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ImageBackground, Image, Modal } from 'react-native';
import { handleUserLogin } from '../../../services/auth';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Checkbox from 'expo-checkbox';
import { Ionicons } from '@expo/vector-icons';
import { CustomButton } from '@/components/ui/CustomButton';
import { generateCaptcha } from '../../../utils/captcha'; // We'll create this


export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberPassword, setRememberPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // error handling
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
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

  // Load saved credentials from AsyncStorage
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

  // Save credentials to AsyncStorage
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
    try {
      if (!email || !password) { 
        setErrorMessage('Please fill in both email and password.');
        setErrorModalVisible(true);
        return; 
      }
  
      setIsLoading(true);
      await auth.signInWithEmailAndPassword(email, password); 
  
      // Call saveCredentials function after successful login
      await saveCredentials();
  
      router.push('/(tabs)/home'); 

    } catch (error: any) {
      console.log("Firebase Error:", error);
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
        <Image source={require('../../../assets/circle.png')} style={styles.logo} />
        <Text style={styles.heading}>Login</Text>
        
        {/* Email Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          {/* Password Input */}
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
                color="#666"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Remember Password and Forgot Password */}
        <View style={styles.checkboxContainer}>
          <TouchableOpacity 
            style={styles.checkboxWrapper} 
            onPress={() => setRememberPassword(!rememberPassword)}
          >
            <Checkbox
              value={rememberPassword}
              onValueChange={setRememberPassword}
              color={rememberPassword ? '#2c6b2f' : undefined}
            />
            <Text style={styles.checkboxLabel}>Remember Password</Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => router.push({
            pathname: '/(auth)/student/forgotPassword',
            params: { loginEmail: email }
          })}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>

        {/* Sign In Button */}
        <CustomButton
          title={isLoading ? "Loading..." : "Login"}
          onPress={() => handleLogin(email, password)}
        />

        {/* Sign Up Link */}
        <View style={styles.signupContainer}>
          <Text>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/student/signup')}>
            <Text style={styles.linkText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
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
            <Text style={styles.modalTitle}>Wrong Credentials</Text>
            <Text style={styles.modalItemText}>{errorMessage}</Text>
            <CustomButton
              title="Close"
              onPress={() => setErrorModalVisible(false)}
            />
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
    height: '100%',
  },
  container: {
    width: '90%',
    maxWidth: 500,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 50,
  },
  logo: {
    width: 170,
    height: 170,
    top: -85,
    position: 'absolute',
    borderColor: '#2c6b2f',
    borderWidth: 1,
    borderRadius: 100,
  },
  heading: {
    fontSize: 28,
    fontFamily: 'Roboto',
    color: '#000000',
    marginTop: 75,
    marginBottom: 10,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 1,
  },
  label: {
    fontSize: 16,
    color: '#000000',
    marginBottom: 1,
    fontWeight: '500',
  },
  input: {
    width: '100%',
    height: 45,
    borderColor: '#000',
    borderWidth: 1,
    marginBottom: 5,
    paddingLeft: 10,
    borderRadius: 5,
  },
  passwordContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    position: 'relative',
  },
  passwordInput: {
    width: '100%',
    height: 45,
    borderColor: '#000',
    borderWidth: 1,
    paddingLeft: 10,
    borderRadius: 5,
    paddingRight: 50,
  },
  eyeIcon: {
    position: 'absolute',
    right: 12,
    height: '100%',
    justifyContent: 'center',
  },
  checkboxContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 15,
  },
  checkboxWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 15,
    color: '#000',
  },
  forgotPasswordText: {
    marginBottom: 1,
    color: 'gray',
    fontSize: 14,
  },
  signupContainer: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  linkText: {
    color: '#2c6b2f',
    fontWeight: 'bold',
  },

  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    maxHeight: '80%',
  },
 
  modalItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalItemText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
