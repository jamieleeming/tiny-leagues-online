import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Your Firebase configuration (you'll get this from Firebase Console)
const firebaseConfig = {
    apiKey: "AIzaSyDnx42LC7G76r4Ht9hCV0jUOuBMzj67KiI",
    authDomain: "tiny-leagues.firebaseapp.com",
    projectId: "tiny-leagues",
    storageBucket: "tiny-leagues.firebasestorage.app",
    messagingSenderId: "274468686318",
    appId: "1:274468686318:web:5b5e5266daaac9a5d3e6ff",
    measurementId: "G-Q51EB4C0MY"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db }; 