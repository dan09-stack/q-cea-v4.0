import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TextInput, Modal, ScrollView, TouchableOpacity, Image, Alert, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { auth, db } from '@/firebaseConfig';
import { signOut } from '@/services/auth';
import { PageContainer } from '@/components/layout/PageContainer';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { CustomButton } from '@/components/ui/CustomButton';
import { EditProfileModal } from '../components/profile/EditProfileModal';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemeSettings } from '@/components/theme/ThemeSettings';
import { shadeColor } from '@/utils/themeUtils';
import { GradientBackgroundContainer } from '@/components/ui/GradientBackgroundContainer';
import { Picker } from '@react-native-picker/picker';
import TimePickerModal from '../components/TImePickerModal';

interface UserData {
  fullName: string;
  email: string;
  idNumber: string;
  program: string;
  phoneNumber: string;
  profilePicture?: string;
  status?: string;
  userType?: string;
}

// Update the schedule data structure to include AM and PM time frames
interface ScheduleData {
  monday: { 
    am: { start: string; end: string }; 
    pm: { start: string; end: string }; 
  };
  tuesday: { 
    am: { start: string; end: string }; 
    pm: { start: string; end: string }; 
  };
  wednesday: { 
    am: { start: string; end: string }; 
    pm: { start: string; end: string }; 
  };
  thursday: { 
    am: { start: string; end: string }; 
    pm: { start: string; end: string }; 
  };
  friday: { 
    am: { start: string; end: string }; 
    pm: { start: string; end: string }; 
  };
  saturday: { 
    am: { start: string; end: string }; 
    pm: { start: string; end: string }; 
  };
}


interface ScheduleModalProps {
  modalVisible: boolean;
  setModalVisible: (visible: boolean) => void;
  scheduleData: ScheduleData; // Update to use the new interface
  setScheduleData: (data: ScheduleData) => void; // Update to use the new interface
  handleSaveSchedule: () => void;
}

const ScheduleModal: React.FC<ScheduleModalProps> = ({
  modalVisible,
  setModalVisible,
  scheduleData,
  setScheduleData,
  handleSaveSchedule,
}) => {
  const { colors } = useTheme();
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedTimeFrame, setSelectedTimeFrame] = useState<'am' | 'pm' | null>(null);

  const updateTimeForSelectedDay = (
    startHour: number,
    startMinute: number,
    startPeriod: string,
    endHour: number,
    endMinute: number,
    endPeriod: string
  ) => {
    if (selectedDay && selectedTimeFrame) {
      const startTime = `${startHour}:${String(startMinute).padStart(2, '0')} ${startPeriod}`;
      const endTime = `${endHour}:${String(endMinute).padStart(2, '0')} ${endPeriod}`;

      setScheduleData({
        ...scheduleData,
        [selectedDay]: {
          ...scheduleData[selectedDay as keyof typeof scheduleData],
          [selectedTimeFrame]: { start: startTime, end: endTime },
        },
      });
    }
  };

  const handleTimeFrameSelect = (day: string, timeFrame: 'am' | 'pm') => {
    setSelectedDay(day);
    setSelectedTimeFrame(timeFrame);
  };

  // Helper function to format time display
  const formatTimeDisplay = (timeFrame: { start: string; end: string }) => {
    if (timeFrame.start && timeFrame.end) {
      return `${timeFrame.start} - ${timeFrame.end}`;
    }
    return "Unavailable";
  };

  useEffect(() => {
    const fetchSchedule = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await db.collection('student').doc(user.uid).get();
        if (userDoc.exists && userDoc.data()?.schedule) {
          setScheduleData(userDoc.data()?.schedule);
        }
      }
    };
  
    fetchSchedule();
  }, [modalVisible]);
  
  return (
    <Modal
      visible={modalVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalView, { backgroundColor: colors.backgroundColor, width: 380, maxWidth: '95%' }]}>
          <Text style={[styles.modalTitle, { color: colors.textColor }]}>Set Availability</Text>
          
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <View style={styles.dayColumn}>
              <Text style={styles.tableHeaderText}>Day</Text>
            </View>
            <View style={styles.timeColumn}>
              <Text style={styles.tableHeaderText}>AM</Text>
            </View>
            <View style={styles.timeColumn}>
              <Text style={styles.tableHeaderText}>PM</Text>
            </View>
          </View>
          
          <ScrollView style={[styles.modalScroll, { width: '100%' }]}>
            {Object.keys(scheduleData)
              .sort((dayA, dayB) => {
                const daysOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                return daysOrder.indexOf(dayA) - daysOrder.indexOf(dayB);
              })
              .map((day) => (
                <View key={day} style={styles.tableRow}>
                  <View style={styles.dayColumn}>
                    <Text style={styles.dayText}>
                      {day.charAt(0).toUpperCase() + day.slice(1)}
                    </Text>
                  </View>
                  
                  {/* AM Time Slot */}
                  <View style={styles.timeColumn}>
                    <TouchableOpacity
                      style={[
                        styles.timeSlotButton,
                        {
                          backgroundColor: scheduleData[day as keyof typeof scheduleData].am.start ? '#e6f7ff' : '#f5f5f5'
                        }
                      ]}
                      onPress={() => handleTimeFrameSelect(day, 'am')}
                    >
                      <Text style={[
                        styles.timeSlotText,
                        {
                          color: scheduleData[day as keyof typeof scheduleData].am.start ? 'black' : '#888'
                        }
                      ]}>
                        {scheduleData[day as keyof typeof scheduleData].am.start
                          ? formatTimeDisplay(scheduleData[day as keyof typeof scheduleData].am)
                          : "Tap to set"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  
                  {/* PM Time Slot */}
                  <View style={styles.timeColumn}>
                    <TouchableOpacity
                      style={[
                        styles.timeSlotButton,
                        {
                          backgroundColor: scheduleData[day as keyof typeof scheduleData].pm.start ? '#e6f7ff' : '#f5f5f5'
                        }
                      ]}
                      onPress={() => handleTimeFrameSelect(day, 'pm')}
                    >
                      <Text style={[
                        styles.timeSlotText,
                        {
                          color: scheduleData[day as keyof typeof scheduleData].pm.start ? 'black' : '#888'
                        }
                      ]}>
                        {scheduleData[day as keyof typeof scheduleData].pm.start
                          ? formatTimeDisplay(scheduleData[day as keyof typeof scheduleData].pm)
                          : "Tap to set"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
          </ScrollView>

          <View style={styles.buttonContainer}>
            <CustomButton title="Save" onPress={handleSaveSchedule} color={colors.accentColor} />
            <CustomButton title="Close" onPress={() => setModalVisible(false)} color="#045657" />
          </View>
        </View>
      </View>

      {/* Time Picker Modal */}
      {selectedDay && selectedTimeFrame && (
        <TimePickerModal
          selectedDay={`${selectedDay}-${selectedTimeFrame}`}
          scheduleData={scheduleData}
          updateTimeForSelectedDay={updateTimeForSelectedDay}
          closeModal={() => {
            setSelectedDay(null);
            setSelectedTimeFrame(null);
          }}
        />
      )}
    </Modal>
  );
};

  
export default function Profile(): JSX.Element {
  const { colors } = useTheme();
  const [userType, setUserType] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [isActive, setIsActive] = useState(false);
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
  const [scheduleModalVisible, setScheduleModalVisible] = useState(false);
  const [scheduleData, setScheduleData] = useState({
    monday: { 
      am: { start: "", end: "" }, 
      pm: { start: "", end: "" } 
    },
    tuesday: { 
      am: { start: "", end: "" }, 
      pm: { start: "", end: "" } 
    },
    wednesday: { 
      am: { start: "", end: "" }, 
      pm: { start: "", end: "" } 
    },
    thursday: { 
      am: { start: "", end: "" }, 
      pm: { start: "", end: "" } 
    },
    friday: { 
      am: { start: "", end: "" }, 
      pm: { start: "", end: "" } 
    },
    saturday: { 
      am: { start: "", end: "" }, 
      pm: { start: "", end: "" } 
    },
  });
  
  const handleSettingsPress = () => {
    setSettingsModalVisible(true);
  };

  const toggleStatus = async (value: boolean) => {
    setIsActive(value);
    try {
      const user = auth.currentUser;
      if (user) {
        await db.collection('student').doc(user.uid).update({
          status: value ? 'AVAILABLE' : 'UNAVAILABLE'
        });
        setUserData(prev => ({...prev, status: value ? 'AVAILABLE' : 'UNAVAILABLE'}));
      }
    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert('Error', 'Failed to update status. Please try again.');
      setIsActive(!value);
    }
  };

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
      try {
        const user = auth.currentUser;
        if (user) {
          if (!user.emailVerified) {
            setIsVerified(false);
            setTimeout(() => {
              router.replace('/student/login');
            }, 0);
          } else {
            setIsVerified(true);
            // Set up a real-time listener instead of a one-time fetch
            const unsubscribe = db.collection('student').doc(user.uid)
              .onSnapshot((doc) => {
                if (doc.exists) {
                  const data = doc.data() as UserData;
                  setUserData(data);
                  setEditableData(data);
                  setIsActive(data.status === 'AVAILABLE');
                  setUserType(data.userType || '');
                }
              });
              
            // Return the unsubscribe function for cleanup
            return () => unsubscribe();
          }
        } else {
          setTimeout(() => {
            router.replace('/student/login');
          }, 0);
        }
      } finally {
        setLoading(false);
      }
    };
  
    fetchUserData();
  }, []);
  
  
  const handleUpdateProfile = async (): Promise<boolean> => {
    try {
      const user = auth.currentUser;
      if (user) {
        await db.collection('student').doc(user.uid).update({
          fullName: editableData.fullName,
          email: editableData.email,
          idNumber: editableData.idNumber,
          program: editableData.program,
          phoneNumber: editableData.phoneNumber,
        });
  
        if (editableData.email !== userData.email) {
          await user.updateEmail(editableData.email);
        }
  
        if (newPassword) {
          await user.updatePassword(newPassword);
        }
  
        setUserData(editableData);
        setModalVisible(false);
        setNewPassword('');
        
        return true;
      }
      return false;
    } catch (error: unknown) {
      if (error instanceof Error) {
        alert('Error updating profile: ' + error.message);
      } else {
        alert('An unexpected error occurred while updating profile');
      }
      return false;
    }
  };

  const handleSaveSchedule = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        await db.collection('student').doc(user.uid).update({
          schedule: scheduleData,
        });
        Alert.alert('Success', 'Schedule updated successfully.');
        setScheduleModalVisible(false);
      }
    } catch (error) {
      console.error('Error updating schedule:', error);
      Alert.alert('Error', 'Failed to update schedule. Please try again.');
    }
  };

  if (!isVerified) {
    return (
      <View style={{ flex: 1, backgroundColor: '#008000' }}></View>
    );
  }
  
  return (
      <GradientBackgroundContainer style={styles.background}>
      
        <TouchableOpacity 
          style={[styles.settingsIconContainer, { backgroundColor: colors.accentColor }]} 
          onPress={handleSettingsPress}
        >
          <MaterialIcons name="settings" size={28} color="white" />
        </TouchableOpacity>

        <View style={styles.container}>
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
                        style={[styles.profileImage]}
                      />
                    ) : (
                      <MaterialIcons name="account-circle" size={120} color="white" />
                    )}
                    <View style={[styles.editIconContainer, { backgroundColor: colors.accentColor }]}>
                      <MaterialIcons name="edit" size={24} color={'white'} />
                    </View>
                  </TouchableOpacity>
                </View>
                <Text style={styles.title}>{userData.fullName}</Text>
                <View style={styles.infoContainer}>
                  <View style={styles.infoText}>
                  <Image 
                   source={require('../../assets/email.png')} 
                   style={styles.icon} 
                  />
                    <Text style={styles.infoLabel}>Email:</Text>
                    <Text style={styles.infoValue}>{userData.email}</Text>
                  </View>
                  <View style={styles.infoText}>
                  <Image 
                   source={require('../../assets/phone.png')} 
                   style={styles.icon} 
                  />
                    <Text style={styles.infoLabel}>Phone #:</Text>
                    <Text style={styles.infoValue}>{userData.phoneNumber}</Text>
                  </View>
                  <View style={styles.infoText}>
                  <Image 
                   source={require('../../assets/id.png')} 
                   style={styles.icon} 
                  />
                    <Text style={styles.infoLabel}>ID Number:</Text>
                    <Text style={styles.infoValue}>{userData.idNumber}</Text>
                  </View>
                  <View style={styles.infoText}>
                  <Image 
                   source={require('../../assets/course.png')} 
                   style={styles.icon} 
                  />
                    <Text style={styles.infoLabel}>Program:</Text>
                    <Text style={styles.infoValue}>{userData.program}</Text>
                  </View>
                </View>
                <View style={styles.buttonSpacing} />
                <CustomButton 
                  title="Logout" 
                  onPress={() => signOut(router)} 
                  color={colors.accentColor} 
                />
                <EditProfileModal
                  modalVisible={modalVisible}
                  setModalVisible={setModalVisible}
                  editableData={editableData}
                  setEditableData={setEditableData}
                  oldPassword={oldPassword}
                  setOldPassword={setOldPassword}
                  newPassword={newPassword}
                  setNewPassword={setNewPassword}
                  handleUpdateProfile={handleUpdateProfile}
                  userType={userType}
                />
                <ScheduleModal
                  modalVisible={scheduleModalVisible}
                  setModalVisible={setScheduleModalVisible}
                  scheduleData={scheduleData}
                  setScheduleData={setScheduleData}
                  handleSaveSchedule={handleSaveSchedule}
                />
                <Modal
                  visible={settingsModalVisible}
                  transparent={true}
                  animationType="fade"
                  onRequestClose={() => setSettingsModalVisible(false)}
                >
                  <View style={styles.modalOverlay}>
                    <View style={styles.settingsModalView}>
                      <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Settings</Text>
                        <TouchableOpacity 
                          style={styles.closeButton} 
                          onPress={() => setSettingsModalVisible(false)}
                        >
                          <MaterialIcons name="close" size={24} color="#333" />
                        </TouchableOpacity>
                      </View>
                      <ScrollView 
                        style={styles.modalScroll} 
                        contentContainerStyle={{alignItems: 'center', width: '100%'}}
                        showsVerticalScrollIndicator={true}
                      >
                        {userType !== 'STUDENT' && (
                          <>
                            <View style={styles.settingItem}>
                              <Text style={styles.settingLabel}>
                                Status (Active/Inactive)
                              </Text>
                              <Switch
                                trackColor={{ false: "#767577", true: "#81b0ff" }}
                                thumbColor={isActive ? "#008000" : "#f4f3f4"}
                                ios_backgroundColor="#3e3e3e"
                                onValueChange={toggleStatus}
                                value={isActive}
                              />
                            </View>
                            <Text style={styles.statusText}>
                              You are currently <Text style={{fontWeight: 'bold', color: isActive ? '#008000' : '#FF0000'}}>
                                {isActive ? 'AVAILABLE' : 'UNAVAILABLE'}
                              </Text>
                            </Text>
                            
                          </>
                        )}
                        <ThemeSettings containerStyle={{ marginTop: 10 }} />
                        <View style={{ width: '90%', alignSelf: 'center', marginBottom:10 }}>
                          <CustomButton title="Edit Profile" onPress={() => {setModalVisible(true),setSettingsModalVisible(false)}} />
                        </View>
                        {userType !== 'STUDENT' && (
                          <>
                        <View style={{ width: '90%', alignSelf: 'center', marginBottom:10 }}>
                          <CustomButton title="Set Schedule" onPress={() => { setScheduleModalVisible(true); setSettingsModalVisible(false); }} />
                        </View>
                        </>
                        )}
                        {/* Remove the Close button from here as we now have the X button */}
                      </ScrollView>
                    </View>
                  </View>
                </Modal>

              </View>
            )}
          </View>
        </View>
      </GradientBackgroundContainer>
  );
}

const styles = StyleSheet.create({

  background: {
    flex: 1,
    backgroundColor: '#034041', 
  },
  settingsIconContainer: {
    position: 'absolute',
    top: 15,
    left: 15,
    zIndex: 10,
    padding: 8,
    borderRadius: 20,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 10,
  },
  closeButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    padding: 5,
  },
  settingsModalView: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '95%',
    maxWidth: 500,
  },
  editIconContainer: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    borderRadius: 15,
    padding: 5,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginVertical: 15,
    paddingHorizontal: 10,
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
  },
  statusText: {
    marginTop: 10,
    fontSize: 14,
    color: '#333',
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
  },
  container: {
    width: '100%',
    flex: 1,
    alignItems: 'center',
    padding: 5,
  },
  contentContainer: {
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    marginBottom: 10,
    color: 'white',
  },
  infoContainer: {
    backgroundColor: 'white',
    width: '100%',
    marginBottom: 20,
    padding: 15,
    borderRadius: 10,
    maxWidth: 1000,
  },
  infoText: {
    fontSize: 16,
    color: 'black',
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoLabel: {
    fontWeight: 'bold',
    width: 120, 
    color: 'black',
    fontSize: 15,
  },
  icon: {
    width: 30,   
    height: 30, 
    marginRight: 8, 
  },
  infoValue: {
    flex: 1,
    color: 'black'
  },
  buttonSpacing: {
    height: 10,
  },
  modalView: {
    backgroundColor: 'white',
    marginTop: 50,
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
     boxShadow: '0px 2px 3.84px rgba(0, 0, 0, 0.25)',
    elevation: 5,
    maxHeight: '60%',
    width: 300
},
  modalScroll: {
    width: '100%',
    paddingRight: 30,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
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
    marginBottom: 10,
  },
  scheduleInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
  },
  scheduleLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  dayContainer: {
    marginBottom: 20,
    backgroundColor: "white"
  },
  dayLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 10,
  },
  timePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timePickerGroup: {
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 14,
    marginBottom: 5,
  },
  timePicker: {
    width: 50,
    height: 40,
  },
  periodPicker: {
    width: 50,
    height: 40,
  },
  separator: {
    fontSize: 20,
    marginHorizontal: 5,
  },
  setTimeButton: {
    marginTop: 10,
  },
  selectedTime: {
    marginTop: 10,
    marginBottom: 10,
    fontSize: 14,
  },
  timeFrameContainer: {
    marginVertical: 10,
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    padding: 10,
  },
  
  timeFrameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  
  timeFrameLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: "#333",
  },
  
  resetButton: {
    backgroundColor: 'red',
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  
  resetButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  
  timeSlot: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  tableHeaderCell: {
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  tableCell: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 5,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    width: '100%',
  },
  tableHeaderText: {
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    width: '100%',
  },
  dayColumn: {
    width: 100, // Fixed width for day column
    paddingHorizontal: 5,
    justifyContent: 'center',
  },
  timeColumn: {
    flex: 1, // Each time column takes equal remaining space
    paddingHorizontal: 5,
    justifyContent: 'center',
  },
  dayText: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'left',
  },
  timeSlotButton: {
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40, // Fixed height for all buttons
  },
  timeSlotText: {
    fontSize: 12,
    textAlign: 'center',
  },

});