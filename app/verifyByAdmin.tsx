// app/verify.tsx
import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { useRouter } from 'expo-router';
import { CustomButton } from '@/components/ui/CustomButton';

export default function Verify(): JSX.Element {
  const router = useRouter();

  const handleBackToLogin = () => {
    // Navigate back to login screen
    router.push('/student/login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text} >Account Verification Required</Text>
        <Text style={styles.text} >Your account needs to be verified by admin before you can proceed.</Text>
       
      <CustomButton title="Back to Login" onPress={handleBackToLogin} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    fontSize: 18,
    textAlign: 'center',
    color: '#333',
  },
});
