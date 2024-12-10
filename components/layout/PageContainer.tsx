import React from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export function PageContainer({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={['#008000', '#1a4d1c']}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
      />
      {children}
    </View>
  );
}
