import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Button } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { auth } from '@/firebaseConfig';
import { db } from '../../firebaseConfig'; // Ensure this path is correct
import { doc, getDoc } from 'firebase/firestore';

export default function Profile(): JSX.Element {
  const params = useLocalSearchParams();
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userRequest, setUserRequest] = useState<any>(null); // State to store user request data
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
    
    // Fetch the user request data
    const fetchUserRequest = async () => {
      try {
        const docRef = doc(db, 'userRequests', userInfo.idNumber); // Assuming idNumber is unique for the user
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setUserRequest(docSnap.data());
        } else {
          console.log('No request found for this user.');
        }
      } catch (error) {
        console.error('Error fetching user request:', error);
      }
    };

    if (userInfo.idNumber) {
      fetchUserRequest();
    }

    setLoading(false);
  }, [router, userInfo.idNumber]);

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
      
      {userRequest ? (
        <View style={styles.requestContainer}>
          <Text style={styles.requestTitle}>Your Request Info</Text>
          <Text style={styles.infoText}>Faculty: {userRequest.faculty}</Text>
          <Text style={styles.infoText}>Concern: {userRequest.concern}</Text>
          <Text style={styles.infoText}>Other Concern: {userRequest.otherConcern || 'N/A'}</Text>
          <Text style={styles.infoText}>Request ID: {userRequest.requestID}</Text>
          <Text style={styles.infoText}>Requested At: {userRequest.createdAt.toDate().toString()}</Text>
        </View>
      ) : (
        <Text style={styles.infoText}>Not in the queue.</Text>
      )}

      <Button title="Log Out" onPress={async () => {
        try {
          await auth.signOut();
          router.push('/student/login');
        } catch (error) {
          alert('Logout Failed');
        }
      }} />
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
  requestContainer: {
    marginTop: 20,
    width: '100%',
    marginBottom: 20,
  },
  requestTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 16,
    marginBottom: 10,
  }
});
