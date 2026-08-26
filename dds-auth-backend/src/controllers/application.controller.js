import { VerificationService } from '../services/verification.service.js'

export const getApplications = (req, res) => {
  try {
    const apps = VerificationService.getApplications()
    res.status(200).json({ success: true, data: apps })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}

export const getApplicationById = (req, res) => {
  try {
    const app = VerificationService.getApplicationById(req.params.id)
    if (!app) {
      return res.status(404).json({ success: false, error: 'Application not found' })
    }
    res.status(200).json({ success: true, data: app })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}

export const createApplication = (req, res) => {
  try {
    const { name, websiteUrl, redirectUrl, description } = req.body
    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, error: 'Application name is required' })
    }

    const app = VerificationService.createApplication({
      name,
      websiteUrl,
      redirectUrl,
      description
    })

    res.status(201).json({
      success: true,
      message: 'Application Created Successfully',
      data: app
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}

export const updateApplication = (req, res) => {
  try {
    const updated = VerificationService.updateApplication(req.params.id, req.body)
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Application not found' })
    }
    res.status(200).json({ success: true, message: 'Application updated', data: updated })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}

export const deleteApplication = (req, res) => {
  try {
    const deleted = VerificationService.deleteApplication(req.params.id)
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Application not found' })
    }
    res.status(200).json({ success: true, message: 'Application deleted successfully' })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}

export const regenerateApiKey = (req, res) => {
  try {
    const app = VerificationService.regenerateKeys(req.params.id)
    if (!app) {
      return res.status(404).json({ success: false, error: 'Application not found' })
    }
    res.status(200).json({
      success: true,
      message: 'API Key and Secret regenerated successfully',
      data: app
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}
