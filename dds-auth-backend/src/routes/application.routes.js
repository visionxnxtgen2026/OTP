import express from 'express'
import {
  getApplications,
  getApplicationById,
  createApplication,
  updateApplication,
  deleteApplication,
  regenerateApiKey
} from '../controllers/application.controller.js'

const router = express.Router()

router.get('/', getApplications)
router.get('/:id', getApplicationById)
router.post('/', createApplication)
router.patch('/:id', updateApplication)
router.delete('/:id', deleteApplication)
router.post('/:id/regenerate-key', regenerateApiKey)

export default router
