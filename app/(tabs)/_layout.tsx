// app/(tabs)/_layout.tsx
import React from 'react';
import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
      <Tabs.Screen name="home" options={{ title: "Home" }} />
      <Tabs.Screen name="list" options={{ title: "List" }} />
    </Tabs>
  );
}
