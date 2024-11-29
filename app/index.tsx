import { Text, View, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

export default function Index() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  }, []);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to the app!</Text>
      
      <TouchableOpacity 
        style={styles.button}
        onPress={() => router.push('/student/login')}
      >
        <Text style={styles.buttonText}>Student Login</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.button}
        onPress={() => router.push('/faculty/login')}
      >
        <Text style={styles.buttonText}>Teacher Login</Text>
      </TouchableOpacity>
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
    marginBottom: 30,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    width: '80%',
    marginVertical: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#007AFF',
  }
});
