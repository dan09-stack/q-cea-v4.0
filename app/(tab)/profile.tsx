import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Button, TextInput, Modal, ScrollView, TouchableOpacity, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import { auth, db, storage } from '@/firebaseConfig';
import { signOut } from '@/services/auth';
import { PageContainer } from '@/components/layout/PageContainer';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
interface UserData {
  fullName: string;
  email: string;
  idNumber: string;
  program: string;
  phoneNumber: string;
  profilePicture?: string;
}

export default function Profile(): JSX.Element {
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editableData, setEditableData] = useState<UserData>({
    fullName: '',
    email: '',
    idNumber: '',
    program: '',
    phoneNumber: ''
  });
  const [newPassword, setNewPassword] = useState('');
  const [userData, setUserData] = useState<UserData>({
    fullName: '',
    email: '',
    idNumber: '',
    program: '',
    phoneNumber: ''
  });
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
  
    if (!result.canceled) {
      const uri = result.assets[0].uri;
      await uploadImage(uri);
    }
  };
  const uploadImage = async (uri: string) => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      
      const user = auth.currentUser;
      if (!user) return;
  
      const storage = getStorage();
      const imageRef = ref(storage, `profilePictures/${user.uid}.jpg`);
      
      const uploadTask = await uploadBytes(imageRef, blob);
      const downloadURL = await getDownloadURL(uploadTask.ref);
  
      await db.collection('student').doc(user.uid).update({
        profilePicture: downloadURL
      });
  
      setUserData(prev => ({...prev, profilePicture: downloadURL}));
      
    } catch (error) {
      console.error('Upload error details:', error);
      alert('Image upload failed. Please try again.');
    }
  };
  
  
  const router = useRouter();
  const getGravatarUrl = (email: string) => {
    const md5 = require('md5');
    const hash = md5(email.toLowerCase().trim());
    return `https://www.gravatar.com/avatar/${hash}?d=identicon&s=200`;
  };
  
  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        if (!user.emailVerified) {
          setIsVerified(false);
          router.push('/student/login');
        } else {
          setIsVerified(true);
          const userDoc = await db.collection('faculty').doc(user.uid).get();
          if (userDoc.exists) {
            const data = userDoc.data() as UserData;
            setUserData(data);
            setEditableData(data);
          }
        }
      } else {
        router.push('/student/login');
      }
      setLoading(false);
    };

    fetchUserData();
  }, [router]);

  const handleUpdateProfile = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        // Update user profile in Firestore
        await db.collection('student').doc(user.uid).update({
          fullName: editableData.fullName,
          email: editableData.email,
          idNumber: editableData.idNumber,
          course: editableData.program,
          phoneNumber: editableData.phoneNumber,
        });

        // Update email in Firebase Auth if changed
        if (editableData.email !== userData.email) {
          await user.updateEmail(editableData.email);
        }

        // Update password if provided
        if (newPassword) {
          await user.updatePassword(newPassword);
        }

        // Update local state
        setUserData(editableData);
        setModalVisible(false);
        setNewPassword('');
        alert('Profile updated successfully!');
      }
    }  catch (error: unknown) {
      if (error instanceof Error) {
        alert('Error updating profile: ' + error.message);
      } else {
        alert('An unexpected error occurred while updating profile');
      }
    }
  };

  if (!isVerified) {
    return (
      <View style={styles.container}>
        <Text>Redirecting to email verification...</Text>
      </View>
    );
  }

  return (
    <PageContainer>
      <ImageBackground
        source={require('../../assets/green p2.jpg')}
        style={styles.background}
      >
        <View style={styles.container}>
        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={() => signOut(router)}
        >
          <MaterialIcons name="logout" size={30} color="white" />
        </TouchableOpacity>
        <View style={styles.container}>
        {loading ? (
          <ActivityIndicator size="large" color="#008000" />
        ) : (
          <View style={styles.contentContainer}>
            <View style={styles.profileImageContainer}>
              <TouchableOpacity onPress={pickImage}>
                {userData.profilePicture ? (
                  <Image 
                    source={{ uri: userData.profilePicture }}
                    style={styles.profileImage}
                  />
                ) : (
                  <MaterialIcons name="account-circle" size={120} color="white" />
                )}
                <View style={styles.editIconContainer}>
                  <MaterialIcons name="edit" size={24} color="white" />
                </View>
              </TouchableOpacity>
            </View>
            <Text style={styles.title}>{userData.fullName}</Text>
            <View style={styles.infoContainer}>
              <View style={styles.infoText}>
                <Text style={styles.infoLabel}>Email:</Text>
                <Text style={styles.infoValue}>{userData.email}</Text>
              </View>
              <View style={styles.infoText}>
                <Text style={styles.infoLabel}>Phone Number:</Text>
                <Text style={styles.infoValue}>{userData.phoneNumber}</Text>
              </View>
              <View style={styles.infoText}>
                <Text style={styles.infoLabel}>ID Number:</Text>
                <Text style={styles.infoValue}>{userData.idNumber}</Text>
              </View>
              <View style={styles.infoText}>
                <Text style={styles.infoLabel}>Course:</Text>
                <Text style={styles.infoValue}>{userData.program}</Text>
              </View>
            </View>
            <Button title="Edit Profile" onPress={() => setModalVisible(true)} />

            <Modal
              animationType="slide"
              transparent={true}
              visible={modalVisible}
              onRequestClose={() => setModalVisible(false)}
            >
              <View style={styles.modalView}>
                <ScrollView style={styles.modalScroll}>
                  <Text style={styles.modalTitle}>Edit Profile</Text>
                  
                  <TextInput
                    style={styles.input}
                    placeholder="Full Name"
                    value={editableData.fullName}
                    onChangeText={(text) => setEditableData({...editableData, fullName: text})}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="ID Number"
                    value={editableData.idNumber}
                    onChangeText={(text) => setEditableData({...editableData, idNumber: text})}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Course"
                    value={editableData.program}
                    onChangeText={(text) => setEditableData({...editableData, program: text})}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Phone Number"
                    value={editableData.phoneNumber}
                    onChangeText={(text) => setEditableData({...editableData, phoneNumber: text})}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="New Password (optional)"
                    secureTextEntry
                    value={newPassword}
                    onChangeText={setNewPassword}
                  />
                  
                  <View style={styles.buttonContainer}>
                    <Button title="Save Changes" onPress={handleUpdateProfile} />
                    <Button title="Cancel" onPress={() => setModalVisible(false)} color="red" />
                  </View>
                </ScrollView>
              </View>
            </Modal>
          </View>
        )}
        </View>
      </View>
      </ImageBackground>
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIconContainer: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: '#008000',
    borderRadius: 15,
    padding: 5,
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#008000',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: 40,
    marginTop: 10,
  },
  
  container: {
    width: '100%',
    flex: 1,
    alignItems: 'center',
    padding: 20,
  },
  contentContainer: {
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  infoContainer: {
    width: '100%',
    marginBottom: 20,
    padding: 15,
    borderRadius: 10,
  },
  infoText: {
    fontSize: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoLabel: {
    fontWeight: 'bold',
    width: 120, 
  },
  infoValue: {
    flex: 1,
  },

  modalView: {
    backgroundColor: 'white',
    marginTop: 50,
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    maxHeight: '80%', // This ensures the modal doesn't take up the full screen
},
  modalScroll: {
    width: '100%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
});
