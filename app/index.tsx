import { Text, View, TouchableOpacity, StyleSheet, ActivityIndicator, Image, ImageBackground } from 'react-native';
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#008000" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={styles.fullScreenTouchable}
      onPress={() => router.push('/student/login')}
    >
      <ImageBackground
        source={require('../assets/green.jpg')}
        style={styles.backgroundImage}
        imageStyle={{ resizeMode: 'cover' }}
      >
        <View style={styles.container}>
          <Image source={require('../assets/finale.png')} style={styles.logo} />
          <Text style={styles.heading}>Welcome to Q-CEA App</Text>
          <Text style={styles.tapText}>Tap anywhere to continue</Text>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#008000',
  },
  splashScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  splashText: {
    marginTop: 10,
    fontSize: 16,
    fontFamily: 'Roboto',
    color: '#008000',
  },
  backgroundImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  fullScreenTouchable: {
    flex: 1,
  },
  container: {
    width: '90%',
    maxWidth: 600,
    textAlign: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 20,
    borderRadius: 12,
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: 50,
  },
  logo: {
    maxWidth: '100%',
    height: 200,
    aspectRatio: 1,
    marginBottom: 2,
    resizeMode: 'contain',
  },
  heading: {
    textAlign: 'center',
    alignSelf: 'center',
    maxWidth: 200,
    fontSize: 28,
    fontFamily: 'Roboto',
    color: '#000000',
    alignItems: 'center',
    marginBottom: 20,
  },
  tapText: {
    fontSize: 16,
    color: '#555555',
    fontFamily: 'Roboto',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
});
