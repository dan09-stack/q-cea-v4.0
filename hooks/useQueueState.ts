import { useState, useEffect } from 'react';
import { auth, db } from '@/firebaseConfig';
import { collection, doc, getDoc, getDocs, onSnapshot, query, where, orderBy, limit } from 'firebase/firestore';

export const useQueueState = () => {
  // Rating state
  const [isRatingModalVisible, setIsRatingModalVisible] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  
  // Alert state
  const [isAlertModalVisible, setIsAlertModalVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertTitle, setAlertTitle] = useState('');
  
  // Lists state
  const [concernsList, setConcernsList] = useState<string[]>([]);

  // Queue display state
  const [nextDisplayedTicket, setNextDisplayedTicket] = useState('');
  const [nextDisplayedProgram, setNextDisplayedProgram] = useState('');
  
  // User related states
  const [userType, setUserType] = useState('');
  const [currentStudent, setCurrentStudent] = useState<{ 
    name: string; 
    concern: string; 
    faculty: string | null; 
  }>({ 
    name: '', 
    concern: '', 
    faculty: null 
  });
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Queue and ticket states
  const [ticketNumber, setTicketNumber] = useState('');
  const [userTicketNumber, setUserTicketNumber] = useState('');
  const [userProgram, setUserProgram] = useState('');
  const [allTickets, setAllTickets] = useState<string[]>([]);
  const [currentTicketIndex, setCurrentTicketIndex] = useState(0);
  const [currentQueue, setCurrentQueue] = useState(0);
  const [servingTickets, setServingTickets] = useState<string[]>([]);
  const [currentDisplayedTicket, setCurrentDisplayedTicket] = useState('');
  const [currentDisplayedProgram, setCurrentDisplayedProgram] = useState('');
  const [peopleAhead, setPeopleAhead] = useState(0);
  
  // Form states
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [selectedConcern, setSelectedConcern] = useState('');
  const [otherConcern, setOtherConcern] = useState('');

  // UI states
  const [isRequested, setIsRequested] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingRequest, setIsCheckingRequest] = useState(true);
  const [isTicketLoading, setIsTicketLoading] = useState(true);
  const [facultyModalVisible, setFacultyModalVisible] = useState(false);
  const [concernModalVisible, setConcernModalVisible] = useState(false);

  // Data states
  const [facultyList, setFacultyList] = useState<Array<{id: string, fullName: string, status: string}>>([]);
  const [ticketStudentData, setTicketStudentData] = useState({ name: '', concern: '', program:'' });
  const [userData, setUserData] = useState({ phoneNumber: '' });
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Error handling
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [nextStudentDetails, setNextStudentDetails] = useState<{fullName: string, phoneNumber: string} | null>(null);

  return {
    // Rating
    isRatingModalVisible, setIsRatingModalVisible, rating, setRating, feedback, setFeedback,
    
    // Alert
    isAlertModalVisible, setIsAlertModalVisible, alertMessage, setAlertMessage, alertTitle, setAlertTitle,
    
    // Lists
    concernsList, setConcernsList,
    
    // Queue display
    nextDisplayedTicket, setNextDisplayedTicket, nextDisplayedProgram, setNextDisplayedProgram,
    
    // User
    userType, setUserType, currentStudent, setCurrentStudent, isInitialized, setIsInitialized,
    
    // Queue and tickets
    ticketNumber, setTicketNumber, userTicketNumber, setUserTicketNumber, userProgram, setUserProgram,
    allTickets, setAllTickets, currentTicketIndex, setCurrentTicketIndex, currentQueue, setCurrentQueue,
    servingTickets, setServingTickets, currentDisplayedTicket, setCurrentDisplayedTicket,
    currentDisplayedProgram, setCurrentDisplayedProgram, peopleAhead, setPeopleAhead,
    
    // Form
    selectedFaculty, setSelectedFaculty, selectedConcern, setSelectedConcern, otherConcern, setOtherConcern,
    
    // UI
    isRequested, setIsRequested, isLoading, setIsLoading, isCheckingRequest, setIsCheckingRequest,
    isTicketLoading, setIsTicketLoading, facultyModalVisible, setFacultyModalVisible,
    concernModalVisible, setConcernModalVisible,
    
    // Data
    facultyList, setFacultyList, ticketStudentData, setTicketStudentData, userData, setUserData,
    isInitialLoad, setIsInitialLoad,
    
    // Error
    errorModalVisible, setErrorModalVisible, errorMessage, setErrorMessage,
    nextStudentDetails, setNextStudentDetails
  };
};
