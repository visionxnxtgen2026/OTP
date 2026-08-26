import { Router } from 'express'
import { developerController } from '../controllers/developer.controller.js'
import { authenticateDeveloper } from '../middleware/developerAuthMiddleware.js'

export const developerRouter = Router()

// Developer Authentication & Session (Requirement #11, #13)
developerRouter.post('/auth/session', developerController.authSession)
developerRouter.get('/me', authenticateDeveloper, developerController.getMe)

// Statistics & Logs
developerRouter.get('/stats', developerController.getStats)
developerRouter.get('/logs', developerController.getLogs)

// Applications CRUD & Config (Protected by Developer Auth)
developerRouter.get('/apps', developerController.getApplications)
developerRouter.post('/apps', authenticateDeveloper, developerController.createApplication)
developerRouter.get('/apps/:applicationId', developerController.getApplication)

// Origins Management
developerRouter.post('/apps/:applicationId/origins', authenticateDeveloper, developerController.addOrigin)
developerRouter.delete('/apps/:applicationId/origins', authenticateDeveloper, developerController.removeOrigin)

// Callback URLs Management
developerRouter.post('/apps/:applicationId/callbacks', authenticateDeveloper, developerController.addCallbackUrl)
developerRouter.delete('/apps/:applicationId/callbacks', authenticateDeveloper, developerController.removeCallbackUrl)

// Status & Secret Management
developerRouter.post('/apps/:applicationId/toggle-status', authenticateDeveloper, developerController.toggleStatus)
developerRouter.post('/apps/:applicationId/regenerate-secret', authenticateDeveloper, developerController.regenerateSecret)

// Server-side Test Connection
developerRouter.post('/apps/:applicationId/test-connection', developerController.testConnection)

// Delete Application (Type-to-Confirm)
developerRouter.delete('/apps/:applicationId', authenticateDeveloper, developerController.deleteApplication)
