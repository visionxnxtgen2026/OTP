import { Router } from 'express'
import { authController } from '../controllers/auth.controller.js'
import { authenticateUserSession } from '../middleware/userAuthMiddleware.js'

export const authRouter = Router()

// Firebase Authentication & Synchronization Endpoints (Requirement #2, #6, #8, #9, #13, #14)
authRouter.post('/firebase/session', authController.firebaseSession)
authRouter.post('/firebase/verify-phone', authController.firebaseVerifyPhone)
authRouter.post('/firebase/delete-account', authenticateUserSession, authController.deleteAccount)
authRouter.post('/firebase/reconcile', authController.reconcile)

// Public Auth Endpoints
authRouter.post('/google', authController.googleSignIn)
authRouter.post('/mobile/request-otp', authController.requestRegistrationOtp)
authRouter.post('/mobile/verify-otp', authController.verifyRegistrationOtp)

// Server-to-Server Client Credential Validation Endpoint
authRouter.post('/validate-client', authController.validateClient)

// Protected User Session Endpoints
authRouter.get('/me', authenticateUserSession, authController.getMe)
authRouter.post('/logout', authController.logout)
authRouter.delete('/delete-account', authenticateUserSession, authController.deleteAccount)
authRouter.get('/activity', authenticateUserSession, authController.getMyActivity)
authRouter.get('/security', authenticateUserSession, authController.getMySecurity)

// Backward compatible endpoint for user activity
authRouter.get('/user/:mobileId/activity', authenticateUserSession, authController.getMyActivity)
authRouter.get('/user/:mobileId', authController.getUser)
