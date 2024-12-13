import { Alert } from 'react-native';
import { auth, db } from '../firebaseConfig';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';

// handleUserLogin function
export const handleUserLogin = async (email, password, router, saveCredentials) => {
  try {
    if (!email || !password) {
      Alert.alert('Validation Error', 'Please fill in both email and password.');
      return;
    }

    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    const user = userCredential.user;

    if (!user) {
      Alert.alert('Login Error', 'User authentication failed.');
      return;
    }

    await saveCredentials();

    // Check student collection
    const studentDoc = await db.collection('student').doc(user.uid).get();

    if (studentDoc.exists) {
      const userData = studentDoc.data();

      // Check the userType field to differentiate between student and faculty
      if (!userData.userType) {
        Alert.alert('Login Error', 'User type is missing or incorrect.');
        await auth.signOut();
        return;
      }

      // Handle student login
      if (userData.userType === 'student') {
        if (!user.emailVerified) {
          Alert.alert('Email Verification Required', 'Please verify your email address to continue.');
          return;
        }

        // Redirect student to student-specific home page
        router.push({
          pathname: '/(tabs)/home',
          params: {
            fullName: userData?.fullName,
            email: userData?.email,
            idNumber: userData?.idNumber,
            course: userData?.course,
            phoneNumber: userData?.phoneNumber,
          },
        });
      } 
      // Handle faculty login
      else if (userData.userType === 'faculty') {
        if (!user.emailVerified) {
          Alert.alert('Email Verification Required', 'Please verify your email address to continue.');
          return;
        }

        // Redirect faculty to faculty-specific home page
        router.push({
          pathname: '/(tab)/home', // Correct route for faculty
          params: {
            fullName: userData?.fullName,
            email: userData?.email,
            facultyId: userData?.facultyId,
            department: userData?.department,
          },
        });
      } else {
        Alert.alert('Invalid User Type', 'User type is neither student nor faculty.');
        await auth.signOut(); // Sign out the user
        return;
      }
    } else {
      Alert.alert('Login Error', 'User data not found.');
      await auth.signOut(); // Sign out the user
    }
  } catch (error) {
    if (error instanceof Error) {
      let errorMessage = 'An error occurred while logging in.';
      switch (error.message) {
        case 'Firebase: Error (auth/invalid-email).':
          errorMessage = 'The email address is not valid.';
          break;
        case 'Firebase: Error (auth/user-not-found).':
          errorMessage = 'No user found with this email.';
          break;
        case 'Firebase: Error (auth/wrong-password).':
          errorMessage = 'Incorrect password.';
          break;
        default:
          errorMessage = error.message;
      }
      Alert.alert('Login Error', errorMessage);
    }
  }
};


//handleSignup function
export const handleSignup = async ({
  fullName,
  idNumber,
  phoneNumber,
  selectedCourse,
  email,
  password,
  userType,
  router
}) => {
  if (!fullName || !idNumber || !phoneNumber || !selectedCourse || !email || !password) {
    Alert.alert('Validation Error', 'Please fill in all fields.');
    return;
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await db.collection('student').doc(user.uid).set({
      fullName,
      idNumber,
      phoneNumber,
      course: selectedCourse,
      email,
      userType,
    });

    await sendEmailVerification(user);
    // Alert.alert('Verification Email Sent', 'Please check your email to verify your account.');

    // router.push({
    //   pathname: '/verify',
    //   params: {
    //     fullName,
    //     email,
    //     idNumber,
    //     course: selectedCourse,
    //      userType: 'student'
    //   },
    // });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    Alert.alert('Signup Error', errorMessage);
  }
};
//signOut function
export const signOut = async (router) => {
  try {
    await auth.signOut();
    router.push('/student/login');
  } catch (error) {
    alert('Logout Failed');
  }
};