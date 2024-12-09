//
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore'; 
import 'firebase/compat/functions';

const firebaseConfig = {
  apiKey: "AIzaSyBPrqDFvjpeA27TX5torMOdo8P3hHFtZek",
  authDomain: "thesis-ad543.firebaseapp.com",
  projectId: "thesis-ad543",
  storageBucket: "thesis-ad543.firebasestorage.app",
  messagingSenderId: "885904173811",
  appId: "1:885904173811:web:dd9d0c9787558da754a586",
  measurementId: "G-4KMCGFD3XN"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export const auth = firebase.auth();
export const db = firebase.firestore();
export default firebase;
