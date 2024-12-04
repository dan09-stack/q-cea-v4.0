import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore'; 
import 'firebase/compat/functions';


const firebaseConfig = {
  apiKey: "AIzaSyDcKfJFItkmdiQciOrXWvTyakr9y0ZAiWA",
  authDomain: "queueingsystem64.firebaseapp.com",
  projectId: "queueingsystem64",
  storageBucket: "queueingsystem64.firebasestorage.app",
  messagingSenderId: "121289375714",
  appId: "1:121289375714:web:d8ee348254d4a4f7dac3bb",
  measurementId: "G-4MJYD1Z409"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

export const auth = firebase.auth();
export const db = firebase.firestore(); 
export default firebase;
