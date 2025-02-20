import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ImageBackground } from 'react-native';
import React, { useState } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { auth, db } from '@/firebaseConfig';
import { doc, getDoc, updateDoc, setDoc, increment, collection, query, where, getDocs } from 'firebase/firestore';
import { CustomButton } from '@/components/ui/CustomButton';
import { router } from 'expo-router';

type SurveyAnswerKeys = 
  | 'easyAccess'
  | 'preventsCutting'
  | 'preventsDistractions'
  | 'notifications'
  | 'adviserAvailability'
  | 'reducesStress'
  | 'secureSpot'
  | 'specifyConcern'
  | 'timeManagement'
  | 'internetRequirement';

type SurveyAnswers = Record<SurveyAnswerKeys, number>;

type SurveyQuestion = {
  key: SurveyAnswerKeys;
  text: string;
};

export default function RatingPage() {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [surveyAnswers, setSurveyAnswers] = useState<SurveyAnswers>({
    easyAccess: 0,
    preventsCutting: 0,
    preventsDistractions: 0,
    notifications: 0,
    adviserAvailability: 0,
    reducesStress: 0,
    secureSpot: 0,
    specifyConcern: 0,
    timeManagement: 0,
    internetRequirement: 0
  });

  const surveyQuestions: SurveyQuestion[] = [
    { key: 'easyAccess', text: 'Q-CEA app is easy to access' },
    { key: 'preventsCutting', text: 'Q-CEA avoids cutting in line' },
    { key: 'preventsDistractions', text: 'Q-CEA helps to avoid distractions to the faculty inside the office' },
    { key: 'notifications', text: 'Q-CEA notifies the user for his/her turn' },
    { key: 'adviserAvailability', text: 'Q-CEA helps you to know if the adviser is available' },
    { key: 'reducesStress', text: 'Q-CEA Helps reduce stress among faculty by providing organized queuing management' },
    { key: 'secureSpot', text: "Q-CEA ensures to secure the user's spot in the queue with a real time monitoring" },
    { key: 'specifyConcern', text: 'Q-CEA helps to specify the department concern of the user' },
    { key: 'timeManagement', text: 'Q-CEA can be beneficial for time management' },
    { key: 'internetRequirement', text: 'Q-CEA requires a stable internet connection to function effectively' }
  ];

  const handleSurveyRating = (question: SurveyAnswerKeys, value: number) => {
    setSurveyAnswers(prev => ({
      ...prev,
      [question]: value
    }));
  };

  const handleSubmitRating = async () => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const userRef = doc(db, 'student', currentUser.uid);
        const userDoc = await getDoc(userRef);
        const facultyName = userDoc.data()?.faculty;

        await setDoc(doc(db, 'ratings', `${currentUser.uid}_${Date.now()}`), {
          userId: currentUser.uid,
          faculty: facultyName,
          overallRating: rating,
          feedback: feedback,
          surveyAnswers: surveyAnswers,
          timestamp: new Date()
        });

        await updateDoc(userRef, {
          status: 'completed',
          userTicketNumber: null,
          faculty: null,
        });

       
        router.replace('/(tabs)/home');
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
    }
  };

  const RatingStars = ({ value, onChange }: { value: number, onChange: (val: number) => void }) => (
    <View style={styles.ratingContainer}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => onChange(star)}
        >
          <MaterialIcons
            name={value >= star ? "star" : "star-border"}
            size={30}
            color="#d9ab0e"
          />
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <View style={styles.background}>

      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.modalTitle}>Overall Experience</Text>
          <RatingStars value={rating} onChange={setRating} />
          
          <Text style={styles.sectionTitle}>Please rate the following aspects:</Text>
          {surveyQuestions.map((question) => (
            <View key={question.key} style={styles.questionContainer}>
              <Text style={styles.questionText}>{question.text}</Text>
              <RatingStars 
                value={surveyAnswers[question.key]} 
                onChange={(value) => handleSurveyRating(question.key, value)} 
              />
            </View>
          ))}

          <TextInput
            style={styles.feedbackInput}
            placeholder="Additional feedback (optional)"
            value={feedback}
            onChangeText={setFeedback}
            multiline
          />
          
          <View style={styles.buttonContainer}>
            <CustomButton 
              title="Submit Feedback" 
              onPress={handleSubmitRating} 
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
    background: {
        flex: 1,
        width: '100%',
        backgroundColor: '#ffffff',
      },
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#004000',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 15,
    textAlign: 'center',
    color: '#004000',
  },
  questionContainer: {
    marginVertical: 10,
    padding: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  questionText: {
    fontSize: 16,
    marginBottom: 10,
    color: '#333',
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
  feedbackInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    padding: 15,
    height: 100,
    textAlignVertical: 'top',
    marginVertical: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonContainer: {
    marginVertical: 20,
    alignItems: 'center',
  }
});
