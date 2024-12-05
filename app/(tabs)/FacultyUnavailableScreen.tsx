// app/tabs/FacultyUnavailableScreen.tsx
import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

const FacultyUnavailableScreen = ({ goBack }: any) => {
  return (
    <View style={styles.container}>
      <Text style={styles.message}>Sorry, this faculty is currently unavailable.</Text>
      <Button title="Go Back" onPress={goBack} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    fontSize: 20,
    marginBottom: 20,
  },
});

export default FacultyUnavailableScreen;
