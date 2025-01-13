import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ImageBackground, ActivityIndicator } from 'react-native';
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
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
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
    setIsLoading(true);
    try {
      await handleUserLogin(email, password, router, saveCredentials);
    } catch (error) {
      console.log('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require('../../../assets/green p2.jpg')}
      style={styles.background}
      imageStyle={{ resizeMode: 'cover' }}
    >
      <View style={styles.container}>
        <Text style={styles.heading}>Student Login</Text>
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
        <View style={styles.checkboxContainer}>
          <View style={styles.rememberPasswordContainer}>
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
          </View>
          <TouchableOpacity onPress={() => router.push({
            pathname: '/(auth)/student/forgotPassword',
            params: { loginEmail: email }
          })}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>

        <CustomButton
          title={isLoading ? "Loading..." : "SIGN IN"}
          onPress={handleLogin}
          />
        <View style={styles.signupContainer}>
          <Text>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/student/signup')}>
            <Text style={styles.linkText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
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
  rememberPasswordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 15,
    color: '#000',
  },
  forgotPasswordText: {
    marginBottom:1,
    color: 'gray',
    fontSize: 14,
  }
,  
  inputContainer: {
    width: '100%',
    marginBottom: 1,
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 1,
    fontWeight: '500',
  },
    forgotPasswordContainer: {
      marginBottom: 10,
      backgroundColor: 'red',
      height:"100%",
    },

    signupContainer: {
      marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    },
    backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
    },
    backButtonText: {
    marginLeft: 5,
    fontSize: 16,
    color: 'black',
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
    
    heading: {
    
    fontSize: 28,
    
    fontFamily: 'Roboto',
    
    color: '#000000',
    
    marginBottom: 30,
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
    
    button: {
    
    backgroundColor: '#2c6b2f',
    
    width: '30%',
    
    padding: 12,
    
    alignItems: 'center',
    
    borderRadius: 5,
    
    marginBottom: 15,
    
    },
    
    buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    },
    
    linkText: {
    
    color: '#2c6b2f',
    
    },
    
    goBackButton: {
    
    marginTop: 20,
    
    paddingVertical: 6,
    
    paddingHorizontal: 12,
    
    backgroundColor: '#2c6b2f',
    
    borderRadius: 5,
    
    },
    
    goBackText: {
    
    color: '#FFFFFF',
    
    fontSize: 14,
    
    fontWeight: 'bold',
    
    },
    
    errorText: {
    color: 'red',
    fontSize: 12,
    marginBottom: 10,
    },
    
});
