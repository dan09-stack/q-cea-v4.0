import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, ActivityIndicator, Image } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../../firebaseConfig';
import { router, useLocalSearchParams } from 'expo-router';
import { CustomButton } from '@/components/ui/CustomButton';
import { PageContainer } from '@/components/layout/PageContainer';

type ForgotPasswordProps = NativeStackScreenProps<any, 'ForgotPassword'>;

export default function ForgotPassword({ navigation }: ForgotPasswordProps) {
  const { loginEmail } = useLocalSearchParams();
  const [email, setEmail] = useState<string>(loginEmail as string || '');
  const [isLoading, setIsLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handlePasswordReset = async () => {
    if (!email) {
      setModalMessage('Please enter your email address');
      setIsSuccess(false);
      setModalVisible(true);
      return;
    }

    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setModalMessage('Password reset email sent! Please check your inbox.');
      setIsSuccess(true);
      setModalVisible(true);
    } catch (error: any) {
      let errorMsg = 'Failed to send reset email. Please try again.';
      if (error.code === 'auth/user-not-found') {
        errorMsg = 'No account found with this email.';
      }
      setModalMessage(errorMsg);
      setIsSuccess(false);
      setModalVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleModalClose = () => {
    setModalVisible(false);
    if (isSuccess) {
      router.replace('/student/login');
    }
  };

  return (
      <View style={styles.container}>
        <Image source={require('../../../assets/password.png')} style={styles.reset} />
        <Modal
          animationType="fade"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={[styles.modalText, isSuccess ? styles.successText : styles.errorText]}>
                {modalMessage}
              </Text>
              <TouchableOpacity 
                style={styles.modalButton} 
                onPress={handleModalClose}
              >
                <Text style={styles.modalButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Text style={styles.heading}>RESET PASSWORD</Text>
        <Text style={styles.instructions}>
          Enter your email address below to receive a password reset link.
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!isLoading}
        />
        {isLoading ? (
          <ActivityIndicator size="large" color="#2c6b2f" />
        ) : (
          <CustomButton title="Send Reset Link" onPress={handlePasswordReset} />
        )}
        <TouchableOpacity onPress={() => router.replace('/student/login')} style={styles.backLink}>
          <Text style={styles.backLinkText}>Back to Login</Text>
        </TouchableOpacity>
      </View>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 10,
    flex: 1,
},
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
    marginTop: 0,
  },
  instructions: {
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 20,
    color: '#666',
  },
  input: {
    width: '100%',
    height: 45,
    borderColor: '#000',
    borderWidth: 1,
    marginBottom: 15,
    paddingLeft: 10,
    borderRadius: 5,
  },
  backLink: {
    marginTop: 15,
  },
  backLinkText: {
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    maxWidth: 300,
    alignItems: 'center',
    elevation: 5,
  },
  modalText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 15,
  },
  successText: {
    color: '#2c6b2f',
  },
  errorText: {
    color: '#ff0000',
  },
  modalButton: {
    backgroundColor: '#2c6b2f',
    padding: 10,
    borderRadius: 5,
    minWidth: 100,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
  },
  reset: {
      width: 100,
      height: 100,
      top: 220,
      position: 'absolute',
      

  },
});
