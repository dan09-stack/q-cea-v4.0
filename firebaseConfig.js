import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore'; 
import 'firebase/compat/functions';


const firebaseConfig = {
  apiKey: 'AIzaSyCsv3CsVJL4ri6Gz6I3UiCfxatoYVWoxbw',
  authDomain: 'thesis-ad543.firebaseapp.com',
  projectId: 'thesis-ad543',
  storageBucket: 'thesis-ad543.appspot.com', 
  messagingSenderId: '1836074086378738059',
  appId: '1:885904173811:android:ef336df3417631e854a586',
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

export const auth = firebase.auth();
export const db = firebase.firestore(); 
export default firebase;
