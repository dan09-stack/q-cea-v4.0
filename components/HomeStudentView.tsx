import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, Modal, Button, Pressable, TextInput, Image, Alert, ScrollView } from 'react-native';
import { homeStyles as styles } from '@/constants/home.styles';
import { CustomButton } from '@/components/ui/CustomButton';
import { useTheme } from '@/contexts/ThemeContext';
import * as ImagePicker from 'expo-image-picker';
// Add Firebase imports
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from '@/firebaseConfig';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
interface StudentViewProps {
  numOnQueue?: number; 
  isCheckingRequest: boolean;
  isRequested: boolean;
  peopleAhead: number;
  userProgram: string;
  userTicketNumber: string | number;
  nextDisplayedProgram: string;
  nextDisplayedTicket: string;
  currentDisplayedProgram: string;
  currentDisplayedTicket: string;
  selectedFaculty: string;
  selectedConcern: string;
  otherConcern: string;
  specificDetails: string;
  proofOfPaymentImage: string | null; // Now stores Firebase URL instead of local URI
  isLoading: boolean;
  facultyList: Array<{id: string, fullName: string, status: string, program?: string, numOnQueue?: number}>;
  concernsList: string[];
  facultyModalVisible: boolean;
  concernModalVisible: boolean;
  handleDone: () => void;
  handleCancel: () => void;
  handleRequest: () => void;
  setFacultyModalVisible: (visible: boolean) => void;
  setConcernModalVisible: (visible: boolean) => void;
  setSelectedFaculty: (faculty: string) => void;
  setSelectedConcern: (concern: string) => void;
  setOtherConcern: (concern: string) => void;
  setSpecificDetails: (details: string) => void;
  setProofOfPaymentImage: (imageUri: string | null) => void;
}

export const StudentView = ({
  isCheckingRequest,
  isRequested,
  peopleAhead,
  userProgram,
  userTicketNumber,
  nextDisplayedProgram,
  nextDisplayedTicket,
  currentDisplayedProgram,
  currentDisplayedTicket,
  selectedFaculty,
  selectedConcern,
  otherConcern,
  specificDetails,
  proofOfPaymentImage,
  isLoading,
  facultyList,
  concernsList,
  facultyModalVisible,
  concernModalVisible,
  handleDone,
  handleCancel,
  handleRequest,
  setFacultyModalVisible,
  setConcernModalVisible,
  setSelectedFaculty,
  setSelectedConcern,
  setOtherConcern,
  setSpecificDetails,
  setProofOfPaymentImage
}: StudentViewProps) => {
  const { colors } = useTheme();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedProgramFilter, setSelectedProgramFilter] = useState<string>("All Programs");
  const [searchQuery, setSearchQuery] = useState("");
  // Extract unique programs from faculty list
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  
  const availablePrograms = ["All Programs", ...new Set(facultyList.map(faculty => faculty.program))];
    // Anti-spam states
    const [lastRequestTime, setLastRequestTime] = useState<number | null>(null);
    const [cooldownRemaining, setCooldownRemaining] = useState(0);
    const [cooldownModalVisible, setCooldownModalVisible] = useState(false);
    const COOLDOWN_PERIOD = 1 * 60 * 1000;
    const [dailyRequestCount, setDailyRequestCount] = useState(0);
    const [dailyLimitReached, setDailyLimitReached] = useState(false);
    const [dailyLimitModalVisible, setDailyLimitModalVisible] = useState(false);

    const DAILY_REQUEST_LIMIT = 10;
  // Function to pick an image from the gallery and upload to Firebase
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Needed', 'Sorry, we need camera roll permissions to make this work!');
      return;
    }
    
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    
    if (!result.canceled) {
      uploadImageToFirebase(result.assets[0].uri);
    }
  };
  useEffect(() => {
    const loadDailyRequestCount = async () => {
      try {
        // Get the current date in YYYY-MM-DD format for the key
        const today = new Date().toISOString().split('T')[0];
        const countKey = `requestCount_${today}_${getAuth().currentUser?.uid}`;
        
        const storedCount = await AsyncStorage.getItem(countKey);
        if (storedCount) {
          const count = parseInt(storedCount);
          setDailyRequestCount(count);
          setDailyLimitReached(count >= DAILY_REQUEST_LIMIT);
        } else {
          // Reset count for a new day
          setDailyRequestCount(0);
          setDailyLimitReached(false);
        }
      } catch (error) {
        console.error('Error loading daily request count:', error);
      }
    };
    
    loadDailyRequestCount();
  }, []);
  useEffect(() => {
    const loadLastRequestTime = async () => {
      try {
        const storedTime = await AsyncStorage.getItem('lastRequestTime');
        if (storedTime) {
          const parsedTime = parseInt(storedTime);
          setLastRequestTime(parsedTime);
          
          // Calculate remaining cooldown time
          const now = Date.now();
          const elapsed = now - parsedTime;
          if (elapsed < COOLDOWN_PERIOD) {
            setCooldownRemaining(Math.ceil((COOLDOWN_PERIOD - elapsed) / 1000));
          }
        }
      } catch (error) {
        console.error('Error loading last request time:', error);
      }
    };
    
    loadLastRequestTime();
  }, []);
  // Function to upload image to Firebase Storage
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (cooldownRemaining > 0) {
      timer = setInterval(() => {
        setCooldownRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [cooldownRemaining]);
  const uploadImageToFirebase = async (uri:string) => {
    try {
      setIsUploading(true);
      setUploadProgress(0);
      
      const storage = getStorage();
      const auth = getAuth();
      
      const userId = auth.currentUser?.uid || 'anonymous';
      const timestamp = new Date().getTime();
      const filename = `payment_proofs/${userId}_${timestamp}.jpg`;
      
      const storageRef = ref(storage, filename);
      
      const response = await fetch(uri);
      const blob = await response.blob();
      
      const uploadTask = uploadBytesResumable(storageRef, blob);
      
      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          Alert.alert('Upload Failed', 'Failed to upload image. Please try again.');
          setIsUploading(false);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          
          setProofOfPaymentImage(downloadURL);
          setIsUploading(false);
          Alert.alert('Success', 'Proof of payment uploaded successfully!');
        }
      );
    } catch (error) {
      Alert.alert('Error', 'An error occurred while uploading your image.');
      setIsUploading(false);
    }
  };
  
  const validateAndRequest = () => {
    if (dailyLimitReached) {
      setDailyLimitModalVisible(true);
      return;
    }
    if (!selectedFaculty) {
      Alert.alert('Missing Information', 'Please select a faculty member');
      return;
    }
    
    if (!selectedConcern) {
      Alert.alert('Missing Information', 'Please select your concern');
      return;
    }
    // Check if user is in cooldown period

    
    // if (selectedConcern === 'Enrollment' && !proofOfPaymentImage) {
    //   Alert.alert('Missing Information', 'Please upload proof of payment for enrollment concerns');
    //   return;
    // }
    
    // Show confirmation modal
    setConfirmModalVisible(true);
  };
  
  const handleConfirmRequest = async () => {
    setConfirmModalVisible(false);
    
    // Set and store the current time as last request time
    const now = Date.now();

    try {
      await AsyncStorage.setItem('lastRequestTime', now.toString());
      
      // Update daily request count
      const today = new Date().toISOString().split('T')[0];
      const countKey = `requestCount_${today}_${getAuth().currentUser?.uid}`;
      const newCount = dailyRequestCount + 1;
      
      await AsyncStorage.setItem(countKey, newCount.toString());
      setDailyRequestCount(newCount);
      
      if (newCount >= DAILY_REQUEST_LIMIT) {
        setDailyLimitReached(true);
      }
    } catch (error) {
      console.error('Error saving request data:', error);
    }
    
    // Process the request
    handleRequest();
    handleSubmitRating();
    // Show success modal after request is processed
    setSuccessModalVisible(true);
  };
  const handleSubmitRating = async () => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        await setDoc(doc(db, 'ratings', `${currentUser.uid}_${Date.now()}`), {
          userId: currentUser.uid,
          faculty: selectedFaculty,  
          concern: selectedConcern,  
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
    }
  };
  // Format seconds to mm:ss
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  
  
  // Filter faculty list based on selected program
  const filteredFacultyList = selectedProgramFilter === "All Programs" 
    ? facultyList 
    : facultyList.filter(faculty => faculty.program === selectedProgramFilter);
  
  return (
      <View style={[styles.container, {width: '100%' , maxWidth: 1000}]}>
        {isCheckingRequest ? (
          <ActivityIndicator size="large" color="#004000" />
        ) : (
          isRequested ? (
            
          
            <View style={[styles.ticketContainer, {width: '100%'}]}>
              <Text style={[styles.subHeaderText, {fontWeight: 'bold'}]}>
                People in front of you: {peopleAhead}
              </Text>
              <View style={styles.ticketDetails}>
                <Text style={[styles.ticketLabel, { color: 'black' , fontWeight: 'bold' , fontSize: 22}]}>YOUR TICKET NUMBER</Text>
                <Text style={[styles.ticketNumber, { fontSize: 25 , marginBottom: 20}]}>{`${userProgram}-${String(userTicketNumber).padStart(4, '0')}`}</Text>
                <View style={styles.ticketInfoContainer}>
                  <View>
                    <Text style={[styles.ticketLabel, { color: '#000000' , fontWeight: 'bold', fontSize: 16 }]}>NEXT SERVING</Text>
                    <Text style={[styles.ticketInfo, {fontSize: 20}]}>
                      {nextDisplayedTicket ? 
                        `${nextDisplayedProgram ? `${nextDisplayedProgram}-` : ''}${String(nextDisplayedTicket).padStart(4, '0')}` 
                        : 'No Next Ticket'}
                    </Text>
                  </View>
                  <View>
                    <Text style={[styles.ticketLabel, { color: '#000000' , fontWeight: 'bold', fontSize: 16 }]}>NOW SERVING</Text>
                    <Text style={[styles.ticketInfo, {fontSize: 20}]}>
                      {currentDisplayedTicket && currentDisplayedProgram ? 
                        `${currentDisplayedProgram}-${String(currentDisplayedTicket).padStart(4, '0')}` 
                        : '-'}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.waitText,{ marginTop: 30 , marginBottom: -10 , fontSize: 23}]}>
                  {userTicketNumber === currentDisplayedTicket
                    ? "YOUR TURN"
                    : userTicketNumber < currentDisplayedTicket
                    ? ""
                    : "PLEASE WAIT"
                  }
                </Text>
              </View>
              <View style={styles.buttonContainer}>
                <CustomButton 
                  title={userTicketNumber <= currentDisplayedTicket || currentDisplayedTicket === null ? "DONE" : "CANCEL"} 
                  onPress={userTicketNumber <= currentDisplayedTicket || currentDisplayedTicket === null ? handleDone : handleCancel} 
                  color={userTicketNumber <= currentDisplayedTicket || currentDisplayedTicket === null ? colors.accentColor : "#c8c4c4"} 

/>
              </View>
            </View>
    
          ) : (
            <ScrollView style={{width: '100%'}}>
            <View style={[styles.formGroup, {width: '100%'}]}>
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 10,
                paddingBottom: 10,
                borderBottomWidth: 1,
                borderBottomColor: '#e0e0e0'
              }}>
                <Text style={{fontSize: 14, fontWeight: 'bold'}}>Today's Requests</Text>
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: dailyRequestCount >= DAILY_REQUEST_LIMIT ? '#ffebee' : '#e8f5e9',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 20
                }}>
                  <MaterialIcons 
                    name={dailyRequestCount >= DAILY_REQUEST_LIMIT ? "error-outline" : "check-circle-outline"} 
                    size={16} 
                    color={dailyRequestCount >= DAILY_REQUEST_LIMIT ? '#f44336' : '#4caf50'} 
                    style={{marginRight: 5}} 
                  />
                  <Text style={{
                    fontWeight: 'bold',
                    color: dailyRequestCount >= DAILY_REQUEST_LIMIT ? '#f44336' : '#4caf50'
                  }}>
                    {DAILY_REQUEST_LIMIT - dailyRequestCount} of {DAILY_REQUEST_LIMIT} remaining
                  </Text>
                </View>
              </View>

              <Text style= {{fontSize: 16, fontWeight: 'bold' }}>Faculty</Text>
              <TouchableOpacity 
                style={styles.pickerButton}
                onPress={() => setFacultyModalVisible(true)}
              >
                <Text style={styles.pickerButtonText}>
                  {selectedFaculty || "Select Faculty"}
                </Text>
              </TouchableOpacity> 
              <Text style= {{fontSize: 16, fontWeight: 'bold'}}>Concern</Text>
              <TouchableOpacity 
                style={styles.pickerButton}
                onPress={() => setConcernModalVisible(true)}
              >
                <Text style={styles.pickerButtonText}>
                  {selectedConcern || "Select your concern"}
                </Text>
              </TouchableOpacity>
              
              {/* Special input field for "Other" concern */}
              {selectedConcern === "Other" && (
                <View>
                  <Text style={{fontSize: 16, fontWeight: 'bold', marginTop: 10}}>Please specify your concern</Text>
                  <TextInput
                    style={{
                      borderWidth: 1,
                      borderColor: '#ccc',
                      borderRadius: 5,
                      padding: 10,
                      marginTop: 5,
                      backgroundColor: '#fff'
                    }}
                    placeholder="Enter your specific concern..."
                    value={otherConcern}
                    onChangeText={setOtherConcern}
                  />
                </View>
              )}
              
              {/* Upload Proof of Payment for Enrollment concern with Firebase storage */}
              {/* {selectedConcern === "Enrollment" && (
                <View style={{marginTop: 10}}>
                  <Text style={{fontSize: 16, fontWeight: 'bold', marginBottom: 5}}>
                    Upload Proof of Payment *
                  </Text>
                  <TouchableOpacity 
                    style={{
                      backgroundColor: '#f0f0f0',
                      borderWidth: 1,
                      borderColor: '#ccc',
                      borderRadius: 5,
                      padding: 15,
                      alignItems: 'center',
                      marginBottom: 10
                    }}
                    onPress={pickImage}
                    disabled={isUploading}
                  >
                    <Text style={{color: '#004000'}}>
                      {proofOfPaymentImage ? 'Change Image' : 'Select Image'}
                    </Text>
                  </TouchableOpacity>
                  
                  {isUploading && (
                    <View style={{marginBottom: 10}}>
                      <Text>Uploading: {uploadProgress.toFixed(0)}%</Text>
                      <View 
                        style={{
                          height: 10, 
                          backgroundColor: '#e0e0e0',
                          borderRadius: 5,
                          marginTop: 5
                        }}
                      >
                        <View 
                          style={{
                            height: '100%',
                            width: `${uploadProgress}%`,
                            backgroundColor: '#004000',
                            borderRadius: 5
                          }}
                        />
                      </View>
                    </View>
                  )}
                  
                  {proofOfPaymentImage && !isUploading && (
                    <View style={{marginBottom: 10, alignItems: 'center'}}>
                      <Image 
                        source={{ uri: proofOfPaymentImage }} 
                        style={{width: '100%', height: 200, borderRadius: 5}} 
                        resizeMode="contain"
                      />
                      <TouchableOpacity 
                        style={{marginTop: 5}}
                        onPress={() => setProofOfPaymentImage(null)}
                      >
                        <Text style={{color: 'red'}}>Remove Image</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  
                  <Text style={{color: 'red', marginBottom: 10, fontStyle: 'italic'}}>
                    * Required for enrollment concerns
                  </Text>
                </View>
              )} */}
              
              {/* General details field for all concerns */}
              <Text style={{fontSize: 16, fontWeight: 'bold', marginTop: 10}}>Specific Details</Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: '#ccc',
                  borderRadius: 5,
                  padding: 10,
                  marginTop: 5,
                  height: 100,
                  textAlignVertical: 'top',
                  backgroundColor: '#fff'
                }}
                placeholder="Please enter the specific details of your concern..."
                multiline={true}
                numberOfLines={4}
                value={specificDetails}
                onChangeText={setSpecificDetails}
              />
              
              <View style= {{marginTop: 15}}></View>
              <View style={styles.buttonContainer}>
                {isLoading ? (
                  <ActivityIndicator size="large" color="#004000" />
                ) : (
                  <CustomButton 
                    title="REQUEST" 
                    onPress={validateAndRequest} 
                    color={colors.accentColor} 
                  />
                )}
              </View>
              <Modal
                animationType="fade"
                transparent={true}
                visible={dailyLimitModalVisible}
                onRequestClose={() => {}}
              >
                <View style={styles.modalContainer}>
                  <View style={[styles.modalContent, { width: '80%', maxWidth: 400 }]}>
                    <Text style={[styles.modalTitle, {color: '#FF6B6B'}]}>Daily Request Limit Reached</Text>
                    <MaterialIcons name="block" size={50} color="#FF6B6B" style={{alignSelf: 'center', marginVertical: 15}} />
                    <Text style={{ textAlign: 'center', marginBottom: 10 }}>
                      You've reached the maximum of {DAILY_REQUEST_LIMIT} requests for today.
                    </Text>
                    <Text style={{ textAlign: 'center', marginBottom: 20, fontSize: 12, color: '#666' }}>
                      The limit will reset at midnight. This helps ensure fair access for all students.
                    </Text>
                    <TouchableOpacity
                      style={{
                        backgroundColor: colors.accentColor,
                        paddingVertical: 10,
                        paddingHorizontal: 20,
                        borderRadius: 5,
                        alignSelf: 'center',
                      }}
                      onPress={() => setDailyLimitModalVisible(false)}
                    >
                      <Text style={{ color: 'white', fontWeight: 'bold' }}>I Understand</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Modal>
              <Modal
                animationType="fade"
                transparent={true}
                visible={cooldownModalVisible}
                onRequestClose={() => setCooldownModalVisible(false)}
              >
                <View style={styles.modalContainer}>
                  <View style={[styles.modalContent, { width: '80%', maxWidth: 400 }]}>
                    <Text style={[styles.modalTitle, {color: '#FF6B6B'}]}>Request Limit Reached</Text>
                    <MaterialIcons name="timer" size={50} color="#FF6B6B" style={{alignSelf: 'center', marginVertical: 15}} />
                    <Text style={{ textAlign: 'center', marginBottom: 10 }}>
                      You've recently submitted a request. Please wait before making another request.
                    </Text>
                    <Text style={{ textAlign: 'center', fontSize: 20, fontWeight: 'bold', color: '#FF6B6B', marginVertical: 10 }}>
                      {formatTime(cooldownRemaining)}
                    </Text>
                    <Text style={{ textAlign: 'center', marginBottom: 20, fontSize: 12, color: '#666' }}>
                      This helps ensure fair access for all students.
                    </Text>
                    <TouchableOpacity
                      style={{
                        backgroundColor: colors.accentColor,
                        paddingVertical: 10,
                        paddingHorizontal: 20,
                        borderRadius: 5,
                        alignSelf: 'center',
                      }}
                      onPress={() => setCooldownModalVisible(false)}
                    >
                      <Text style={{ color: 'white', fontWeight: 'bold' }}>I Understand</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Modal>
              {/* Confirmation Modal */}

              <Modal
                animationType="fade"
                transparent={true}
                visible={confirmModalVisible}
                onRequestClose={() => setConfirmModalVisible(false)}
              >
                <View style={styles.modalContainer}>
                  <View style={[styles.modalContent, { width: '80%', maxWidth: 400 }]}>
                    <Text style={styles.modalTitle}>Confirm Request</Text>
                    <Text style={{
                      color: 'red',
                      fontWeight: 'bold',
                      textAlign: 'center',
                      marginBottom: 15,
                      fontSize: 14
                    }}>
                      ⚠️ You must be in the waiting area on or before your turn. And if you cancel this ticket, you need to wait 5minutes before you can request again.
                    </Text>
                    <Text style={{ textAlign: 'center', marginVertical: 15 }}>
                      Are you sure you want to submit this request?
                    </Text>
                    
                    
                    <View style={{ flexDirection: 'row', justifyContent: 'space-around', width: '100%' }}>
                      <TouchableOpacity
                        style={{
                          backgroundColor: '#f0f0f0',
                          paddingVertical: 10,
                          paddingHorizontal: 20,
                          borderRadius: 5,
                          minWidth: 100,
                        }}
                        onPress={() => setConfirmModalVisible(false)}
                      >
                        <Text style={{ textAlign: 'center' }}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={{
                          backgroundColor: colors.accentColor,
                          paddingVertical: 10,
                          paddingHorizontal: 20,
                          borderRadius: 5,
                          minWidth: 100,
                        }}
                        onPress={handleConfirmRequest}
                      >
                        <Text style={{ textAlign: 'center', color: 'white', fontWeight: 'bold' }}>Submit</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </Modal>

              <Modal
                animationType="fade"
                transparent={true}
                visible={facultyModalVisible}
                onRequestClose={() => setFacultyModalVisible(false)}
              >
                <View style={styles.modalContainer}>
                  <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Select Faculty</Text>
                    <TouchableOpacity 
                      style={styles.closeButton} 
                      onPress={() => setFacultyModalVisible(false)}
                    >
                      <MaterialIcons name="close" size={24} color="#333" />
                    </TouchableOpacity>
                    {/* Add search input */}
                    <View style={{
                      flexDirection: 'row',
                      borderWidth: 1,
                      borderColor: '#ddd',
                      borderRadius: 5,
                      marginBottom: 10,
                      padding: 8,
                      backgroundColor: '#f9f9f9'
                    }}>
                      <Text style={{marginRight: 8, alignSelf: 'center'}}>🔍</Text>
                      <TextInput
                        placeholder="Search faculty..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        style={{flex: 1}}
                        clearButtonMode="while-editing"
                        autoCapitalize="none"
                      />
                      {searchQuery !== "" && (
                        <TouchableOpacity onPress={() => setSearchQuery("")}>
                          <Text style={{padding: 4, color: '#666'}}>✕</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    
                    {/* Program filter dropdown */}
                    <View style={{marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 10}}>
                      <Text style={{fontSize: 14, fontWeight: 'bold', marginBottom: 5}}>Filter by Program:</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {availablePrograms.map((program) => (
                          <TouchableOpacity
                            key={program}
                            style={{
                              backgroundColor: selectedProgramFilter === program ? '#004000' : '#f0f0f0',
                              paddingHorizontal: 12,
                              paddingVertical: 8,
                              borderRadius: 20,
                              marginRight: 8
                            }}
                            onPress={() => setSelectedProgramFilter(program || "Unspecified")}
                          >
                            <Text style={{
                              color: selectedProgramFilter === program ? 'white' : 'black',
                              fontWeight: selectedProgramFilter === program ? 'bold' : 'normal'
                            }}>
                              {program}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                    
                    {/* Filtered and searched faculty list */}
                    <ScrollView style={{height:400}}>
                      {filteredFacultyList
                        .filter(faculty => 
                          faculty.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (faculty.program && faculty.program.toLowerCase().includes(searchQuery.toLowerCase()))
                        )
                        .sort((a, b) => a.fullName.localeCompare(b.fullName))
                        .map((faculty) => (
                          <Pressable
                            key={faculty.id}
                            style={[
                              styles.modalItem,
                              { backgroundColor: faculty.status === 'AVAILABLE' ? 'rgba(76, 175, 80, 0.1)' : 'transparent' }
                            ]}
                            onPress={() => {
                              setSelectedFaculty(faculty.fullName);
                              setFacultyModalVisible(false);
                            }}
                          >
                            <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
                              <View style={{flex: 1}}>
                                <Text style={[
                                  styles.modalItemText,
                                  { color: faculty.status === 'AVAILABLE' ? '#4CAF50' : '#757575' }
                                ]}>
                                  {faculty.fullName}
                                </Text>
                                <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                                  <Text style={{fontSize: 12, color: '#666'}}>
                                    {faculty.program || "Unspecified"}
                                  </Text>
                                  
                                  {/* Display waiting count if available */}
                                  {faculty.numOnQueue !== undefined && (
                                    <Text style={{
                                      fontSize: 12, 
                                      fontWeight: 'bold',
                                      color: (faculty.numOnQueue && faculty.numOnQueue > 5) ? '#FF6B6B' : '#666'
                                    }}>
                                      {faculty.numOnQueue === 0 
                                        ? 'No waiting' 
                                        : `${faculty.numOnQueue}  waiting`}
                                    </Text>
                                  )}
                                </View>
                              </View>
                              
                              {faculty.status === 'AVAILABLE' && (
                                <View style={{
                                  width: 10,
                                  height: 10,
                                  borderRadius: 5,
                                  backgroundColor: '#4CAF50',
                                  marginLeft: 8
                                }} />
                              )}
                            </View>
                          </Pressable>
                      ))}
                      
                      {filteredFacultyList.filter(faculty => 
                        faculty.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (faculty.program && faculty.program.toLowerCase().includes(searchQuery.toLowerCase()))
                      ).length === 0 && (
                        <Text style={{textAlign: 'center', marginVertical: 20, color: '#666'}}>
                          {searchQuery 
                            ? `No faculty matching "${searchQuery}"` 
                            : "No faculty found for the selected program."}
                        </Text>
                      )}
                    </ScrollView>
                    
                    <View style={{flexDirection: 'row', marginTop: 15, justifyContent: 'flex-end'}}>
                      <Button 
                        title="Reset Filters" 
                        onPress={() => {
                          setSelectedProgramFilter("All Programs");
                          setSearchQuery("");
                        }} 
                        color="#757575" 
                      />
                    </View>
                  </View>
                </View>
              </Modal>

              <Modal
                animationType="fade"
                transparent={true}
                visible={concernModalVisible}
                onRequestClose={() => setConcernModalVisible(false)}
              >
                <View style={styles.modalContainer}>
                  <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Select Concern</Text>
                    <TouchableOpacity 
                      style={styles.closeButton} 
                      onPress={() => setConcernModalVisible(false)}
                    >
                      <MaterialIcons name="close" size={24} color="#333" />
                    </TouchableOpacity>
                    {concernsList.map((concern) => (
                      <Pressable
                        key={concern}
                        style={styles.modalItem}
                        onPress={() => {
                          setSelectedConcern(concern);
                          setConcernModalVisible(false);
                        }}
                      >
                        <Text style={styles.modalItemText}>{concern}</Text>
                      </Pressable>
                    ))}
                    {/* <Button title="Close" onPress={() => setConcernModalVisible(false)} color="#004000" /> */}
                  </View>
                </View>
              </Modal>
            </View>
            </ScrollView>
          )
        )}
      </View>
  );
};