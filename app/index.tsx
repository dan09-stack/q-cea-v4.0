import { Text, View, StyleSheet } from 'react-native';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'expo-router';
import LottieView from 'lottie-react-native';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function Index() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [animationReady, setAnimationReady] = useState(false);
  const textColor = useThemeColor({}, 'text');
  
  const animationRef = useRef<LottieView>(null);

  useEffect(() => {
    // Wait for layout to be ready
    const timer = setTimeout(() => {
      setAnimationReady(true);
    }, 100);
    
    // Navigate after loading animation
    const navigationTimer = setTimeout(() => {
      setIsLoading(false);
      router.push('/student/login');
    }, 3000);
    
    return () => {
      clearTimeout(timer);
      clearTimeout(navigationTimer);
    };
  }, []);

  return (
    <View style={styles.loadingContainer}>
      {animationReady && (
        <View style={styles.animationWrapper}>
          <LottieView
            ref={animationRef}
            source={require('../assets/animations/loading.json')}
            style={styles.lottieAnimation}
            autoPlay
            loop
            resizeMode="contain"
          />
        </View>
      )}
      
      <Text style={[styles.loadingText, { color: textColor }]}>
        Loading...
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  animationWrapper: {
    width: 200,
    height: 200,
  },
  lottieAnimation: {
    width: '100%',
    height: '100%',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  }
});
