import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from '@/firebaseConfig';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Image, Modal } from 'react-native';
import { handleUserLogin } from '../../../services/auth';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Checkbox from 'expo-checkbox';
import { Ionicons } from '@expo/vector-icons';
import { CustomButton } from '@/components/ui/CustomButton';
import { Colors } from '@/constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedGradientContainer } from '@/components/ui/ThemedGradientContainer';
import { useTheme } from '@/contexts/ThemeContext';
import { GradientBackgroundContainer } from '@/components/ui/GradientBackgroundContainer';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberPassword, setRememberPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loginAttempts, setLoginAttempts] = useState(0); 
  const [lockoutTime, setLockoutTime] = useState<number | null>(null); // Track lockout time
  const [countdown, setCountdown] = useState<number>(0); // Countdown timer in seconds
  const [isLocked, setIsLocked] = useState(false); // State to track if inputs are locked
  const [lockoutMultiplier, setLockoutMultiplier] = useState(1); // Multiplier for lockout duration
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadSavedCredentials();
    loadLockoutState();
  }, []);

  // Effect to handle the countdown timer
  useEffect(() => {
    if (lockoutTime && Date.now() < lockoutTime) {
      const initialCountdown = Math.ceil((lockoutTime - Date.now()) / 1000);
      setCountdown(initialCountdown);
      setIsLocked(true);
      
      timerRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsLocked(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [lockoutTime]);

  
  const loadLockoutState = async () => {
    try {
      const savedLockoutMultiplier = await AsyncStorage.getItem('lockoutMultiplier');
      const savedLockoutTime = await AsyncStorage.getItem('lockoutTime');
      const savedLoginAttempts = await AsyncStorage.getItem('loginAttempts');
      
      if (savedLockoutMultiplier) {
        setLockoutMultiplier(parseInt(savedLockoutMultiplier));
      }
      
      if (savedLockoutTime) {
        const lockTime = parseInt(savedLockoutTime);
        if (lockTime > Date.now()) {
          setLockoutTime(lockTime);
        }
      }
      
      if (savedLoginAttempts) {
        setLoginAttempts(parseInt(savedLoginAttempts));
      }
    } catch (error) {
      console.log('Error loading lockout state');
    }
  };
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

  // Format seconds to MM:SS
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  const resetLockoutState = async () => {
    setLoginAttempts(0);
    setLockoutTime(null);
    setLockoutMultiplier(1);
    setIsLocked(false);
    await saveLockoutState(1, null, 0);
  };
  const saveLockoutState = async (multiplier: number, lockTime: number | null, attempts: number) => {
    try {
      await AsyncStorage.setItem('lockoutMultiplier', multiplier.toString());
      if (lockTime) {
        await AsyncStorage.setItem('lockoutTime', lockTime.toString());
      } else {
        await AsyncStorage.removeItem('lockoutTime');
      }
      await AsyncStorage.setItem('loginAttempts', attempts.toString());
    } catch (error) {
      console.log('Error saving lockout state');
    }
  };
  const handleLogin = async (email: string, password: string) => {
    // Check if user is locked out
    if (!email || !password) {
      setErrorMessage('Please fill in both email and password.');
      setErrorModalVisible(true);
      return;
    }

    if (isLocked) {
      setErrorMessage(`Too many failed attempts. Please wait ${formatTime(countdown)}.`);
      setErrorModalVisible(true);
      return;
    }

   
    setIsLoading(true);
    try {
      const studentSnapshot = await db.collection('students')
      .where('email', '==', email)
      .get();
    
    if (studentSnapshot.empty) {
      setErrorMessage('This email is not registered as a student. Please check your email or sign up.');
      setErrorModalVisible(true);
      setIsLoading(false);
      return;
    }
      await auth.signInWithEmailAndPassword(email, password);
      
      // Reset login attempts and lockout multiplier on successful login
      await resetLockoutState();

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
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      
      if (newAttempts >= 3) {
        const baseDuration = 10000; // 30 seconds
        const lockDuration = baseDuration * lockoutMultiplier;
        const newLockoutTime = Date.now() + lockDuration;
        
        setLockoutTime(newLockoutTime);
        setErrorMessage(`Too many failed attempts. Please wait ${formatTime(lockDuration / 1000)}.`);
        setErrorModalVisible(true);
        
        // Double the multiplier for next time
        const newMultiplier = lockoutMultiplier * 2;
        setLockoutMultiplier(newMultiplier);
        
        // Reset login attempts counter
        setLoginAttempts(0);
        
        // Save the updated lockout state
        await saveLockoutState(newMultiplier, newLockoutTime, 0);
      } else {
        // Just save the updated attempts
        await saveLockoutState(lockoutMultiplier, lockoutTime, newAttempts);
      }
    } finally {
      setIsLoading(false);
    }
  };
  const { colors } = useTheme();

  return (
    <GradientBackgroundContainer style={styles.background}>
      <View style={styles.container}>
        <View style={styles.blurBackground} />
        <Image 
          source={require('../../../assets/ceaRedLogo1.png')} 
          style={[styles.logo, { borderColor: colors.accentColor }]} 
        />
        <Text style={styles.heading}>Login</Text>
        
        {/* {isLocked && (
          <View style={styles.countdownContainer}>
            <Text style={styles.countdownText}>
              Account locked for: {formatTime(countdown)}
            </Text>
          </View>
        )}
         */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput 
            style={[styles.input, isLocked && styles.disabledInput]} 
            placeholder="Enter your email" 
            value={email} 
            onChangeText={setEmail} 
            keyboardType="email-address" 
            autoCapitalize="none"
            editable={!isLocked}
          />
          
          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.passwordInput, isLocked && styles.disabledInput]}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              editable={!isLocked}
            />
            <TouchableOpacity 
              style={styles.eyeIcon} 
              onPress={() => setShowPassword(!showPassword)}
              disabled={isLocked}
            >
              <Ionicons 
                name={showPassword ? "eye-outline" : "eye-off-outline"} 
                size={24} 
                color={isLocked ? "darkgray" : "gray"}
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
              disabled={isLocked}
            />
            <Text style={styles.checkboxLabel}>Remember Password</Text>
          </View>

          <TouchableOpacity 
            style={styles.forgotPasswordWrapper} 
            onPress={() => router.push({ pathname: '/(auth)/student/forgotPassword', params: { loginEmail: email } })}
            disabled={isLocked}
          >
            <Text style={[styles.forgotPasswordText, isLocked && styles.disabledText]}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>

        {/* Sign In Button */}
        <TouchableOpacity
          style={[
            styles.button, 
            (isLoading || isLocked) && styles.buttonDisabled
          ]}
          onPress={() => handleLogin(email, password)}
          disabled={isLoading || isLocked}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Logging In...' : isLocked ? `Locked (${formatTime(countdown)})` : 'Log In'}
          </Text>
        </TouchableOpacity>

        <View style={styles.signupContainer}>
          <Text style={{ color: 'white' }}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/student/signup')} disabled={isLocked}>
            <Text style={[styles.linkText, isLocked && styles.disabledText]}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal animationType="fade" transparent={true} visible={errorModalVisible} onRequestClose={() => setErrorModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalItemText}>{errorMessage}</Text>
            <View style={{ width: '30%', alignSelf: 'center',paddingTop: 10 }}>
              <CustomButton title="Close" onPress={() => setErrorModalVisible(false)} />
            </View>
          </View>
        </View>
      </Modal>
      </GradientBackgroundContainer>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.6, // Semi-transparent to blend with the gradient
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)' // adds a semi-transparent overlay
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
    backgroundColor: '#008000' // Main gradient color
  },
  blurBackground: {
    ...StyleSheet.absoluteFillObject, 
    borderRadius: 12, 
    backgroundColor: 'rgba(0, 0, 0, 0.33)', 
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
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  container: { 
    width: '90%', 
    maxWidth: 500, 
    backgroundColor: 'rgba(255, 255, 255, 0.1)', 
    padding: 20, 
    borderRadius: 12, 
    alignItems: 'center', 
    marginTop: 50,
    borderColor: 'white',
    borderWidth: 1,
    zIndex: 1, // Make sure the container appears above the background image
  },
  logo: { 
    width: 150, 
    height: 150, 
    top: -85, 
    position: 'absolute', 
    borderWidth: 5, 
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
    borderRadius: 5,
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
    paddingRight: 50,
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
    width: 500,
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
  // New styles for countdown and disabled elements
  countdownContainer: {
    backgroundColor: 'rgba(255, 0, 0, 0.2)',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
    width: '100%',
    alignItems: 'center',
  },
  countdownText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  disabledInput: {
    backgroundColor: 'rgba(200, 200, 200, 0.3)',
    borderColor: 'rgba(255, 255, 255, 0.5)',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  disabledText: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
});