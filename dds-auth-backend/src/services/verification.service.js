import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DB_PATH = path.join(__dirname, '../data/database.json')

const generateRandomStr = (prefix, length = 8) => {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `${prefix}_${result}`
}

export class VerificationService {
  static readDb() {
    try {
      if (!fs.existsSync(DB_PATH)) {
        return { developers: [], applications: [], users: [], verificationRequests: [] }
      }
      const raw = fs.readFileSync(DB_PATH, 'utf-8')
      const db = JSON.parse(raw)

      // Auto-update expired requests upon read
      const now = Date.now()
      let updated = false
      if (db.verificationRequests) {
        db.verificationRequests.forEach((req) => {
          if (req.status === 'pending' && new Date(req.expiresAt).getTime() < now) {
            req.status = 'expired'
            updated = true
          }
        })
      }
      if (updated) {
        this.writeDb(db)
      }
      return db
    } catch (err) {
      console.error('Error reading database:', err)
      return { developers: [], applications: [], users: [], verificationRequests: [] }
    }
  }

  static writeDb(data) {
    try {
      fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8')
      return true
    } catch (err) {
      console.error('Error writing database:', err)
      return false
    }
  }

  // Developer methods
  static findDeveloper(email, password) {
    const db = this.readDb()
    return db.developers.find((d) => d.email === email && d.password === password)
  }

  // Application methods
  static getApplications() {
    const db = this.readDb()
    return db.applications || []
  }

  static getApplicationById(idOrAppId) {
    const db = this.readDb()
    return db.applications.find(
      (app) => app.id === idOrAppId || app.applicationId === idOrAppId
    )
  }

  static createApplication({ name, websiteUrl, redirectUrl, description }) {
    const db = this.readDb()
    const newApp = {
      id: `app_${Date.now()}`,
      name: name ? name.trim() : 'Unnamed App',
      websiteUrl: websiteUrl ? websiteUrl.trim() : 'http://localhost:5175',
      redirectUrl: redirectUrl ? redirectUrl.trim() : 'http://localhost:5175/callback',
      description: description ? description.trim() : '',
      applicationId: generateRandomStr('app_demo', 8),
      apiKey: generateRandomStr('pk_demo', 8),
      apiSecret: generateRandomStr('sk_demo', 8),
      status: 'Active',
      createdAt: new Date().toISOString()
    }
    db.applications.unshift(newApp)
    this.writeDb(db)
    return newApp
  }

  static updateApplication(id, updates) {
    const db = this.readDb()
    const index = db.applications.findIndex((app) => app.id === id || app.applicationId === id)
    if (index === -1) return null

    db.applications[index] = {
      ...db.applications[index],
      ...updates,
      updatedAt: new Date().toISOString()
    }
    this.writeDb(db)
    return db.applications[index]
  }

  static deleteApplication(id) {
    const db = this.readDb()
    const index = db.applications.findIndex((app) => app.id === id || app.applicationId === id)
    if (index === -1) return false
    db.applications.splice(index, 1)
    this.writeDb(db)
    return true
  }

  static regenerateKeys(id) {
    const db = this.readDb()
    const index = db.applications.findIndex((app) => app.id === id || app.applicationId === id)
    if (index === -1) return null

    db.applications[index].apiKey = generateRandomStr('pk_demo', 8)
    db.applications[index].apiSecret = generateRandomStr('sk_demo', 8)
    db.applications[index].updatedAt = new Date().toISOString()
    this.writeDb(db)
    return db.applications[index]
  }

  // Verification Request methods
  static createVerificationRequest({ applicationId, apiKey, mobileNumber }) {
    const db = this.readDb()
    const app = db.applications.find(
      (a) => a.applicationId === applicationId || a.apiKey === apiKey || a.id === applicationId
    )
    if (!app) {
      throw new Error('Invalid Application ID or API Key')
    }

    if (app.status !== 'Active') {
      throw new Error('Application is inactive or disabled')
    }

    const cleanMobile = mobileNumber.replace(/\D/g, '').slice(-10)
    if (cleanMobile.length !== 10) {
      throw new Error('Invalid mobile number. Exactly 10 digits required.')
    }

    // Generate random 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString()

    // 2-minute Expiration TTL
    const createdAt = new Date()
    const expiresAt = new Date(createdAt.getTime() + 2 * 60 * 1000)
    const requestId = `req_${Math.floor(100000 + Math.random() * 900000)}`

    const newRequest = {
      id: requestId,
      requestId,
      applicationId: app.applicationId,
      applicationName: app.name,
      websiteUrl: app.websiteUrl || 'http://localhost:5175',
      mobileNumber: cleanMobile,
      code, // Stored securely on backend; NEVER returned to third-party
      status: 'pending',
      createdAt: createdAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      verifiedAt: null
    }

    if (!db.verificationRequests) db.verificationRequests = []
    db.verificationRequests.unshift(newRequest)
    this.writeDb(db)

    // Return to third-party: ONLY requestId and status (NO CODE!)
    return {
      requestId: newRequest.id,
      status: newRequest.status,
      expiresAt: newRequest.expiresAt,
      applicationName: app.name
    }
  }

  static getPendingRequests(mobileNumber) {
    const db = this.readDb()
    const cleanMobile = mobileNumber ? mobileNumber.replace(/\D/g, '').slice(-10) : ''
    const now = Date.now()

    return (db.verificationRequests || []).filter((req) => {
      const isPending = req.status === 'pending'
      const isNotExpired = new Date(req.expiresAt).getTime() > now
      const isMatchingMobile = !cleanMobile || req.mobileNumber === cleanMobile
      return isPending && isNotExpired && isMatchingMobile
    })
  }

  static getRequestStatus(requestId) {
    const db = this.readDb()
    const req = (db.verificationRequests || []).find((r) => r.id === requestId || r.requestId === requestId)
    if (!req) return null

    const now = Date.now()
    if (req.status === 'pending' && new Date(req.expiresAt).getTime() < now) {
      req.status = 'expired'
      this.writeDb(db)
    }

    return {
      requestId: req.id,
      applicationId: req.applicationId,
      applicationName: req.applicationName,
      status: req.status,
      mobileNumber: `+91 ${req.mobileNumber}`,
      createdAt: req.createdAt,
      expiresAt: req.expiresAt,
      verifiedAt: req.verifiedAt
    }
  }

  static verifyCode({ requestId, mobileNumber, code }) {
    const db = this.readDb()
    const req = (db.verificationRequests || []).find((r) => r.id === requestId || r.requestId === requestId)

    if (!req) {
      return { success: false, error: 'Verification request not found' }
    }

    if (req.status !== 'pending') {
      return { success: false, error: `Request already ${req.status}` }
    }

    const now = Date.now()
    if (new Date(req.expiresAt).getTime() < now) {
      req.status = 'expired'
      this.writeDb(db)
      return { success: false, error: 'Verification code has expired. Please try again.' }
    }

    const cleanMobile = mobileNumber ? mobileNumber.replace(/\D/g, '').slice(-10) : ''
    if (cleanMobile && req.mobileNumber !== cleanMobile) {
      return { success: false, error: 'Mobile number mismatch' }
    }

    if (req.code !== code.toString().trim()) {
      return { success: false, error: 'Invalid 6-digit verification code. Please try again.' }
    }

    // Mark verified
    req.status = 'verified'
    req.verifiedAt = new Date().toISOString()
    this.writeDb(db)

    return {
      success: true,
      status: 'verified',
      requestId: req.id,
      verifiedAt: req.verifiedAt
    }
  }

  static rejectRequest({ requestId, mobileNumber }) {
    const db = this.readDb()
    const req = (db.verificationRequests || []).find((r) => r.id === requestId || r.requestId === requestId)

    if (!req) {
      return { success: false, error: 'Verification request not found' }
    }

    if (req.status !== 'pending') {
      return { success: false, error: `Request is already ${req.status}` }
    }

    req.status = 'rejected'
    req.rejectedAt = new Date().toISOString()
    this.writeDb(db)

    return {
      success: true,
      status: 'rejected',
      requestId: req.id
    }
  }

  static getLogs() {
    const db = this.readDb()
    return (db.verificationRequests || []).map((req) => ({
      id: req.id,
      applicationId: req.applicationId,
      applicationName: req.applicationName || 'DemoShop',
      mobileNumber: `+91 ${req.mobileNumber}`,
      status: req.status,
      createdAt: req.createdAt,
      expiresAt: req.expiresAt,
      verifiedAt: req.verifiedAt
    }))
  }

  static getDeveloperStats() {
    const db = this.readDb()
    const apps = db.applications || []
    const requests = db.verificationRequests || []

    const totalApps = apps.length
    const activeApps = apps.filter((a) => a.status === 'Active').length
    const totalRequests = Math.max(128, requests.length)
    const successfulVerifications = Math.max(119, requests.filter((r) => r.status === 'verified').length)
    const failedVerifications = Math.max(9, requests.filter(
      (r) => r.status === 'rejected' || r.status === 'expired'
    ).length)
    const pendingRequests = requests.filter((r) => r.status === 'pending').length

    return {
      totalApplications: totalApps,
      activeApplications: activeApps,
      totalRequests,
      successfulVerifications,
      failedVerifications,
      pendingRequests
    }
  }
}
