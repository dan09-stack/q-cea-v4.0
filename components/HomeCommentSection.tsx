import React from 'react';
import { View, Text, TextInput, Alert } from 'react-native';
import { homeStyles as styles } from '@/constants/home.styles';
import { CustomButton } from '@/components/ui/CustomButton';
import { useTheme } from '@/contexts/ThemeContext';

interface CommentSectionProps {
  isSmallScreen: boolean;
  comment: string;
  setComment: (text: string) => void;
  isSaving: boolean;
  handleAddComment: () => void;
  allTickets: string[];
  isLoading: boolean;
  comments: {
    id: string;
    comment: string;
    timestamp: any;
    faculty: string;
  }[];  
  formatDate: (timestamp: any) => string;
}

export const CommentSection = ({
  isSmallScreen,
  comment,
  setComment,
  isSaving,
  handleAddComment,
  allTickets,
  isLoading,
  comments,
  formatDate
}: CommentSectionProps) => {
  // Move the hook inside the component function
  const { colors } = useTheme();
  
  return (
    <View style={{
      flex: isSmallScreen ? undefined : 1, 
      marginLeft: isSmallScreen ? 0 : 10, 
      padding: 10, 
      borderWidth: 1, 
      borderColor: '#eee', 
      borderRadius: 5
    }}>
      <Text style={[styles.boldText, {fontSize: 20, marginBottom: 15, textAlign: 'center'}]}>Comments</Text>
      
      {/* Add Comment Section */}
      <View style={{marginBottom: 15}}>
        <Text style={[styles.boldText, {fontSize: 18, marginBottom: 5}]}>Add Comment:</Text>
        <TextInput
          style={{
            borderWidth: 1,
            borderColor: '#ddd',
            borderRadius: 5,
            padding: 10,
            height: 100,
            textAlignVertical: 'top',
            backgroundColor: '#f9f9f9'
          }}
          placeholder="Enter your comment here..."
          multiline={true}
          value={comment}
          onChangeText={setComment}
        />
        {/* <CustomButton 
          title={isSaving ? "SAVING..." : "SAVE COMMENT"} 
          onPress={handleAddComment}
          disabled={isSaving || allTickets.length === 0 || !comment.trim()}
          color={colors.accentColor}
        /> */}
      </View>

      </View>
  );
};
