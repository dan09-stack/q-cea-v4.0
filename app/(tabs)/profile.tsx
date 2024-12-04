import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Button } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { auth } from '@/firebaseConfig';
import { signOut } from '@/services/auth';

export default function Profile(): JSX.Element {
  const params = useLocalSearchParams();
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const userInfo = {
    fullName: String(params.fullName || ''),
    email: String(params.email || ''),
    idNumber: String(params.idNumber || ''),
    course: String(params.course || ''),
    phoneNumber: String(params.phoneNumber || '')
  };

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      if (!user.emailVerified) {
        setIsVerified(false);
        router.push('/verify');
      } else {
        setIsVerified(true);
      }
    } else {
      router.push('/student/login');
    }
    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (!isVerified) {
    return (
      <View style={styles.container}>
        <Text>Redirecting to email verification...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>Full Name: {userInfo.fullName}</Text>
        <Text style={styles.infoText}>Email: {userInfo.email}</Text>
        <Text style={styles.infoText}>ID Number: {userInfo.idNumber}</Text>
        <Text style={styles.infoText}>Course: {userInfo.course}</Text>
        <Text style={styles.infoText}>Phone Number: {userInfo.phoneNumber}</Text>
      </View>
      <Button title="Log Out" onPress={() => signOut(router)} />


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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  infoContainer: {
    width: '100%',
    marginBottom: 20,
  },
  infoText: {
    fontSize: 16,
    marginBottom: 10,
  }
});
