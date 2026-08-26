import { Router } from 'express'
import { verificationController } from '../controllers/verification.controller.js'
import { validateClientCredentials } from '../middleware/authMiddleware.js'

export const verificationRouter = Router()

// 1. User App: Polling for pending requests for the registered mobileId (Must be before /:requestId)
verificationRouter.get('/pending', verificationController.getPendingRequests)
verificationRouter.get('/pending/list', verificationController.getPendingRequests)

// 2. Third-Party SDK: Initiate Verification Request (Protected by Client Credentials)
verificationRouter.post('/', validateClientCredentials, verificationController.createVerification)

// 3. Third-Party SDK: Check Verification Status
verificationRouter.get('/:requestId', verificationController.getStatus)

// 4. User App: Approve Verification Request with 6-digit Code
verificationRouter.post('/:requestId/approve', verificationController.approveVerification)

// 5. User App: Reject Verification Request
verificationRouter.post('/:requestId/reject', verificationController.rejectVerification)
