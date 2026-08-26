import { Router } from 'express'
import { authController } from '../controllers/auth.controller.js'
import { authenticateUserSession } from '../middleware/userAuthMiddleware.js'

export const userRouter = Router()

// All /users/me routes are protected by authenticated session
userRouter.get('/me', authenticateUserSession, authController.getMe)
userRouter.get('/me/activity', authenticateUserSession, authController.getMyActivity)
userRouter.get('/me/security', authenticateUserSession, authController.getMySecurity)
userRouter.get('/me/applications', authenticateUserSession, authController.getMyActivity)
userRouter.delete('/me', authenticateUserSession, authController.deleteAccount)
userRouter.post('/me/delete', authenticateUserSession, authController.deleteAccount)
