import { Router } from 'express'
import dds from '../integrations/dds.js'

export const ddsVerificationRouter = Router()

// POST /api/dds/verification/request
ddsVerificationRouter.post('/request', async (req, res) => {
  try {
    const { mobileNumber, origin } = req.body
    if (!mobileNumber) return res.status(400).json({ success: false, error: 'mobileNumber is required' })
    const result = await dds.verification.request({
      mobileId: mobileNumber,
      origin: origin || req.headers.origin || 'http://localhost:5175'
    })
    return res.json({ success: true, requestId: result.requestId, verificationCode: result.verificationCode, status: result.status })
  } catch (err) {
    return res.status(err.statusCode || 500).json({ success: false, error: err.message })
  }
})

// GET /api/dds/verification/status/:requestId
ddsVerificationRouter.get('/status/:requestId', async (req, res) => {
  try {
    const result = await dds.verification.getStatus(req.params.requestId)
    return res.json({ success: true, requestId: result.requestId, status: result.status?.toLowerCase(), verifiedAt: result.verifiedAt })
  } catch (err) {
    return res.status(err.statusCode || 500).json({ success: false, error: err.message })
  }
})

export default ddsVerificationRouter
