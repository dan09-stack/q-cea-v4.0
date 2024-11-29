// app/verify.tsx
import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { useRouter } from 'expo-router';

export default function Verify(): JSX.Element {
  const router = useRouter();

  const handleBackToLogin = () => {
    // Navigate back to login screen
    router.push('/login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Please check your email to verify your account.</Text>
      <Button title="Back to Login" onPress={handleBackToLogin} />
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
    marginBottom: 20,
  },
});
