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
    <ImageBackground
      source={require('../assets/green.jpg')}
      style={styles.backgroundImage}
      imageStyle={{ resizeMode: 'cover' }}
    >
    <View style={styles.container}>
        <Image source={require('../assets/finale.png')} style={styles.logo} />
      <Text style={styles.heading}>Welcome to Q-CEA App</Text>

      <TouchableOpacity
          style={styles.btn}
          onPress={() => router.push('/student/login')}
      >
        <Text style={styles.btnText}>Student</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
          style={styles.btn}
          onPress={() => router.push('/faculty/login')}
      >
        <Text style={styles.btnText}>Faculty</Text>
      </TouchableOpacity>
    </View>
    </ImageBackground>
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
    fontSize: 28,
    fontFamily: 'Roboto',
    color: '#000000',
    marginBottom: 30,
  },
  btn: {
    width: '100%',
    padding: 15,
    fontSize: 16,
    backgroundColor: '#008000',
    borderRadius: 8,
    marginVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontFamily: 'Poppins',
    fontSize: 16,
    width: '100%',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  }
});
