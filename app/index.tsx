import { Text, View, StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import LottieView from 'lottie-react-native';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function Index() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const textColor = useThemeColor({}, 'text');

  useEffect(() => {
    setTimeout(() => {
      setIsLoading(false);
      router.push('/student/login'); 
    }, 3000);
  }, []);

  return (
    <View style={styles.loadingContainer}>
      <View  style={styles.lottieAnimation}>
      <LottieView
        source={require('../assets/animations/loading.json')}
        autoPlay
        loop
       
      />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  lottieAnimation: {
    width: 200,
    height: 200,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  }
});
