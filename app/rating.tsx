import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ImageBackground } from 'react-native';
import React, { useState } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { auth, db } from '@/firebaseConfig';
import { doc, getDoc, updateDoc, setDoc, increment, collection, query, where, getDocs } from 'firebase/firestore';
import { CustomButton } from '@/components/ui/CustomButton';
import { router } from 'expo-router';

type SurveyAnswerKeys = 
| 'userExperience'
| 'navigation'
| 'performance'
| 'reliability'
| 'features'
| 'missingFeatures'
| 'design'
| 'stability'
| 'recommendation'
| 'additionalFeedback';

type SurveyAnswers = Record<Exclude<SurveyAnswerKeys, 'additionalFeedback'>, number> & {
  additionalFeedback: string;
};
type SurveyQuestion = {
  key: SurveyAnswerKeys;
  text: string;
};

export default function RatingPage() {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [surveyAnswers, setSurveyAnswers] = useState<SurveyAnswers>({
    userExperience: 0,
    navigation: 0,
    performance: 0,
    reliability: 0,
    features: 0,
    missingFeatures: 0,
    design: 0,
    stability: 0,
    recommendation: 0,
    additionalFeedback: ''
  });

  const surveyQuestions: SurveyQuestion[] = [
    { 
      key: 'userExperience', 
      text: 'How would you rate the overall user experience of the app?' 
    },
    { 
      key: 'navigation', 
      text: 'How easy is it to navigate the app?' 
    },
    { 
      key: 'performance', 
      text: 'How would you rate the app\'s speed and performance?' 
    },
    { 
      key: 'reliability', 
      text: 'Have you experienced any crashes or bugs?' 
    },
    { 
      key: 'features', 
      text: 'How satisfied are you with the app\'s features?' 
    },
    
    { 
      key: 'design', 
      text: 'How would you rate the app\'s design and visual appeal?' 
    },
    { 
      key: 'stability', 
      text: 'How would you rate the app\'s reliability?' 
    },
    { 
      key: 'recommendation', 
      text: 'How likely are you to recommend this app to others?' 
    },
    { 
      key: 'missingFeatures', 
      text: 'Are there any features you think are missing or need improvement?' 
    },
    { 
      key: 'additionalFeedback', 
      text: 'Do you have any suggestions?' 
    }
  ];
  const YesNoButtons = ({ value, onChange }: { value: number, onChange: (val: number) => void }) => (
    <View style={styles.ratingContainer}>
      <TouchableOpacity
        onPress={() => onChange(5)}
        style={[styles.yesNoButton, value === 5 && styles.selectedButton]}
      >
        <Text style={value === 5 ? styles.selectedButtonText : styles.buttonText}>Yes</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => onChange(1)}
        style={[styles.yesNoButton, value === 1 && styles.selectedButton]}
      >
        <Text style={value === 1 ? styles.selectedButtonText : styles.buttonText}>No</Text>
      </TouchableOpacity>
    </View>
  );
  const handleSurveyRating = (question: SurveyAnswerKeys, value: number | string) => {
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
        const concern = userDoc.data()?.concern;

        await setDoc(doc(db, 'ratings', `${currentUser.uid}_${Date.now()}`), {
          userId: currentUser.uid,
          faculty: facultyName,
          concern: concern,
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
    {question.key === 'additionalFeedback' ? (
      <TextInput
        style={styles.feedbackInput}
        placeholder="Type your feedback here..."
        value={surveyAnswers[question.key].toString()}
        onChangeText={(text) => handleSurveyRating(question.key, text)}
        multiline
      />
    ) : (question.key === 'reliability' || question.key === 'missingFeatures') ? (
      <YesNoButtons 
        value={surveyAnswers[question.key]} 
        onChange={(value) => handleSurveyRating(question.key, value)} 
      />
    ) : (
      <RatingStars 
        value={surveyAnswers[question.key]} 
        onChange={(value) => handleSurveyRating(question.key, value)} 
      />
    )}
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
  yesNoButton: {
    padding: 10,
    marginHorizontal: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#d9ab0e',
    width: 80,
    alignItems: 'center',
  },
  selectedButton: {
    backgroundColor: '#d9ab0e',
  },
  buttonText: {
    color: '#d9ab0e',
    fontSize: 16,
  },
  selectedButtonText: {
    color: 'white',
    fontSize: 16,
  },
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
