import React from 'react';
import { View, Text, TextInput, Alert } from 'react-native';
import { homeStyles as styles } from '@/constants/home.styles';
import { CustomButton } from '@/components/ui/CustomButton';

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
}: CommentSectionProps) => (
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
      <CustomButton 
        title={isSaving ? "SAVING..." : "SAVE COMMENT"} 
        onPress={handleAddComment}
        disabled={isSaving || allTickets.length === 0 || !comment.trim()}
        color="#07643d"
      />
    </View>
    
    {/* Display Previous Comments */}
    <View>
      <Text style={[styles.boldText, {fontSize: 18, marginBottom: 5}]}>Previous Comments:</Text>
      
      {isLoading ? (
        <Text style={{textAlign: 'center', padding: 10}}>Loading comments...</Text>
      ) : comments.length > 0 ? (
        comments.map((item) => (
          <View 
            key={item.id} 
            style={{
              borderWidth: 1,
              borderColor: '#ddd',
              borderRadius: 5,
              padding: 10,
              marginBottom: 10,
              backgroundColor: '#f9f9f9'
            }}
          >
            <Text style={{fontSize: 16}}>{item.comment}</Text>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 5}}>
              <Text style={{color: '#666', fontSize: 12}}>By: {item.faculty}</Text>
              <Text style={{color: '#666', fontSize: 12}}>{formatDate(item.timestamp)}</Text>
            </View>
          </View>
        ))
      ) : (
        <Text style={{textAlign: 'center', padding: 10, color: '#666'}}>
          No previous comments for this ticket
        </Text>
      )}
    </View>
  </View>
);
