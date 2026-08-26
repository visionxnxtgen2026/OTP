import { initializeApp, getApps, getApp } from 'firebase/app'
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signOut,
  type ConfirmationResult,
  type User as FirebaseUser
} from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDzBC4GLKXN3_lyh91B0NY4FcHH6x_hIEw',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'otp-site-80c03.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'otp-site-80c03',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'otp-site-80c03.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '419034737047',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:419034737047:web:136ccc97ec4d1275c8bcd2',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-Y944D6CF9C'
}

// Initialize Firebase App singleton
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)
export const auth = getAuth(app)

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })

/**
 * Sign in with Google Popup
 */
export async function signInWithGoogle(): Promise<{ user: FirebaseUser; idToken: string }> {
  const result = await signInWithPopup(auth, googleProvider)
  const idToken = await result.user.getIdToken(true)
  return {
    user: result.user,
    idToken
  }
}

/**
 * Setup RecaptchaVerifier for Firebase Phone Auth
 */
export function setupRecaptcha(containerId: string): RecaptchaVerifier {
  // Clear any existing instance on the window if needed
  if ((window as any).recaptchaVerifier) {
    try {
      (window as any).recaptchaVerifier.clear()
    } catch {
      // Ignore
    }
  }

  const verifier = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {
      // reCAPTCHA solved - allow signInWithPhoneNumber
    },
    'expired-callback': () => {
      console.warn('[Firebase Auth] reCAPTCHA expired, please solve again.')
    }
  })

  ;(window as any).recaptchaVerifier = verifier
  return verifier
}

/**
 * Send SMS OTP via Firebase Phone Auth
 */
export async function sendPhoneOtp(
  phoneNumber: string,
  appVerifier: RecaptchaVerifier
): Promise<ConfirmationResult> {
  const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier)
  return confirmationResult
}

/**
 * Confirm 6-digit SMS OTP and return fresh ID Token
 */
export async function confirmPhoneOtp(
  confirmationResult: ConfirmationResult,
  code: string
): Promise<{ user: FirebaseUser; idToken: string }> {
  const result = await confirmationResult.confirm(code)
  const idToken = await result.user.getIdToken(true)
  return {
    user: result.user,
    idToken
  }
}

/**
 * Sign out of Firebase Auth
 */
export async function signOutFirebase(): Promise<void> {
  await signOut(auth)
}

export default app
