// app/(tabs)/_layout.tsx
import React from 'react';
import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ title: "Home Tab" }} />
      <Tabs.Screen name="about" options={{ title: "About Tab" }} />
    </Tabs>
  );
}
