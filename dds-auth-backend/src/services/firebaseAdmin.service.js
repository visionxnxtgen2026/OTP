import admin from 'firebase-admin'

let isInitialized = false

export function initFirebaseAdmin() {
  if (isInitialized || admin.apps.length > 0) {
    isInitialized = true
    return admin.app()
  }

  try {
    const projectId = process.env.FIREBASE_PROJECT_ID || 'otp-site-80c03'
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
    let privateKey = process.env.FIREBASE_PRIVATE_KEY

    if (privateKey) {
      privateKey = privateKey.replace(/\\n/g, '\n')
    }

    if (clientEmail && privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey
        })
      })
      console.log(`[Firebase Admin] Initialized with service account cert for project: ${projectId}`)
    } else {
      // Initialize with default application credentials or projectId
      admin.initializeApp({
        projectId
      })
      console.log(`[Firebase Admin] Initialized with project ID: ${projectId}`)
    }

    isInitialized = true
    return admin.app()
  } catch (err) {
    console.warn('[Firebase Admin] Initialization warning:', err.message)
    if (admin.apps.length > 0) {
      isInitialized = true
      return admin.app()
    }
  }
}

/**
 * Verifies a Firebase ID Token sent by the frontend
 */
export async function verifyFirebaseIdToken(idToken) {
  initFirebaseAdmin()

  if (!idToken || typeof idToken !== 'string') {
    throw new Error('Missing or invalid Firebase ID Token')
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken)
    return decodedToken
  } catch (err) {
    // If running in development and verification fails due to missing service account cert,
    // we safely decode JWT payload for development continuity
    if (process.env.NODE_ENV !== 'production' && (!process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY)) {
      try {
        const parts = idToken.split('.')
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'))
          if (payload && (payload.uid || payload.user_id || payload.sub)) {
            console.warn('[Firebase Admin] Dev token decoded without private key validation')
            return {
              uid: payload.uid || payload.user_id || payload.sub,
              email: payload.email,
              name: payload.name,
              picture: payload.picture,
              phone_number: payload.phone_number,
              firebase: payload.firebase,
              ...payload
            }
          }
        }
      } catch {
        // Fall through to throw original error
      }
    }
    throw new Error(`Firebase token verification failed: ${err.message}`)
  }
}

/**
 * Deletes a Firebase user by UID
 */
export async function deleteFirebaseUser(firebaseUid) {
  initFirebaseAdmin()

  if (!firebaseUid) {
    throw new Error('firebaseUid is required for user deletion')
  }

  try {
    await admin.auth().deleteUser(firebaseUid)
    console.log(`[Firebase Admin] Deleted Firebase user: ${firebaseUid}`)
    return true
  } catch (err) {
    // If user not found on Firebase, consider it deleted
    if (err.code === 'auth/user-not-found') {
      console.warn(`[Firebase Admin] User ${firebaseUid} not found in Firebase (already deleted).`)
      return true
    }
    // In local dev without private key credentials, warn and allow MongoDB deletion to proceed
    if (process.env.NODE_ENV !== 'production' && (!process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY)) {
      console.warn(`[Firebase Admin] Dev warning: Could not call Firebase deleteUser API without service account cert: ${err.message}`)
      return true
    }
    console.error(`[Firebase Admin] Failed to delete Firebase user ${firebaseUid}:`, err.message)
    throw err
  }
}

/**
 * Fetches Firebase user profile by UID
 */
export async function getFirebaseUser(firebaseUid) {
  initFirebaseAdmin()

  try {
    const userRecord = await admin.auth().getUser(firebaseUid)
    return userRecord
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      return null
    }
    if (process.env.NODE_ENV !== 'production' && (!process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY)) {
      // In dev without cert, report user presence based on UID pattern
      return { uid: firebaseUid }
    }
    throw err
  }
}

export default admin
