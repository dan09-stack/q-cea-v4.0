import { db } from '@/firebaseConfig';
import { collection, query, where, getDocs, QuerySnapshot, DocumentData } from 'firebase/firestore';

export const getPhoneNumberForTicket = async (ticketNumber: string) => {
  try {
    const studentQuery = query(
      collection(db, 'student'),
      where('userTicketNumber', '==', parseInt(ticketNumber))
    );
    
    const querySnapshot = await getDocs(studentQuery);
    if (!querySnapshot.empty) {
      const studentData = querySnapshot.docs[0].data();
      return studentData.phoneNumber;
    }
    return null;
  } catch (error) {
    console.error('Error fetching phone number:', error);
    return null;
  }
};

export const sendSMS = async (phoneNumber: string, message: string) => {
  try {
    const formattedPhone = phoneNumber
      .replace(/\D/g, '')
      .replace(/^0+/, '+63');
    
    const response = await fetch('https://app.philsms.com/api/v3/sms/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': 'Bearer 1308|QzHqnNuiO7xjeEzknr6f1lBKEkbhDBF08Wsrx90l'
      },
      body: JSON.stringify({
        recipient: formattedPhone,
        sender_id: 'PhilSMS',
        type: 'plain',
        message,
      })
    });

    const data = await response.json();
    console.log('SMS Response:', data);
    return data;
  } catch (error) {
    console.error('SMS Error:', error);
    throw error;
  }
};

export const sendNotificationToStudent = async (phoneNumber: string) => {
  return sendSMS(
    phoneNumber, 
    'Get READY! Your turn is up next. Please stand by at the waiting area. Thank you!'
  );
};

export const sendNotificationToFaculty = async (phoneNumber: string) => {
  return sendSMS(
    phoneNumber, 
    'A student is waiting for you! Please open the QCEA Web App to accept and see their concern. Thank you!'
  );
};

export const sendEmailNotification = async (
  templateId: string, 
  email: string, 
  fullName: string
) => {
  const templateParams = {
    to_email: email,
    to_name: fullName,
    user_email: email
  };

  const url = 'https://api.emailjs.com/api/v1.0/email/send';
  const data = {
    service_id: 'service_asuvj8v',
    template_id: templateId, 
    user_id: 'pZqYyUnGW_4TJ0uuN',
    template_params: templateParams
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    return response.ok;
  } catch (error) {
    console.error('Email notification error:', error);
    throw error;
  }
};

export const getNextStudentDetails = async (allTickets: string[], currentTicketIndex: number) => {
  try {
    const nextTicketNumber = allTickets[currentTicketIndex + 1];
    if (!nextTicketNumber) return null;

    const studentQuery = query(
      collection(db, 'student'),
      where('userTicketNumber', '==', parseInt(nextTicketNumber))
    );

    const querySnapshot = await getDocs(studentQuery);
    if (!querySnapshot.empty) {
      const studentData = querySnapshot.docs[0].data();
      return {
        fullName: studentData.fullName,
        phoneNumber: studentData.phoneNumber
      };
    }
    return null;
  } catch (error) {
    console.log('Error fetching next student details:', error);
    return null;
  }
};
