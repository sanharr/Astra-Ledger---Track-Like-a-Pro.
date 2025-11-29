
/**
 * FIREBASE CONFIGURATION
 * 
 * To make this app fully functional with cloud persistence:
 * 1. Create a Firebase project at console.firebase.google.com
 * 2. Enable Authentication (Anonymous)
 * 3. Enable Firestore Database
 * 4. Paste your config object below.
 * 
 * IF YOU DO NOT PROVIDE KEYS: The app will fall back to LocalStorage (browser only).
 */
export const FIREBASE_CONFIG = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID"
};

export const APP_ID = 'astra-ledger-v1';

// Check if Firebase is configured by looking for the placeholder
export const IS_FIREBASE_CONFIGURED = FIREBASE_CONFIG.apiKey !== "YOUR_FIREBASE_API_KEY";

export const CURRENCY_SYMBOL = "₹";
