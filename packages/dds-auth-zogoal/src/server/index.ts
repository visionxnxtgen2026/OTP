import type {
  DDSAuthConfig,
  VerificationRequestParams,
  VerificationRequestResult,
  VerificationStatusResult,
  TestConnectionResult
} from './types.js'
import {
  DDSAuthError,
  DDSAuthenticationError,
  DDSOriginError,
  DDSApplicationInactiveError,
  DDSValidationError,
  DDSNotFoundError,
  DDSNetworkError
} from './errors.js'

export * from './types.js'
export * from './errors.js'

export class DDSAuth {
  private readonly clientId: string
  private readonly clientSecret: string
  private readonly baseURL: string
  private readonly timeoutMs: number

  public readonly verification: {
    request: (params: VerificationRequestParams) => Promise<VerificationRequestResult>
    getStatus: (requestId: string) => Promise<VerificationStatusResult>
  }

  constructor(config: DDSAuthConfig) {
    this.clientId = (config?.clientId || '').trim()
    this.clientSecret = (config?.clientSecret || '').trim()
    this.baseURL = (config?.baseURL || 'http://localhost:5000').replace(/\/+$/, '')
    this.timeoutMs = config?.timeoutMs || 10000

    this.verification = {
      request: this.requestVerification.bind(this),
      getStatus: this.getVerificationStatus.bind(this)
    }
  }

  private get authHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'X-Client-ID': this.clientId,
      'X-Client-Secret': this.clientSecret
    }
  }

  private handleErrorResponse(status: number, data: any): never {
    const errorMsg = data?.message || data?.error || 'DDS API request failed'
    const details = data?.details || data

    switch (status) {
      case 401:
        throw new DDSAuthenticationError(errorMsg, details)
      case 403:
        if (data?.code === 'ORIGIN_MISMATCH' || errorMsg.includes('origin')) {
          throw new DDSOriginError(data?.origin || 'unknown', details)
        }
        throw new DDSApplicationInactiveError(errorMsg, details)
      case 404:
        throw new DDSNotFoundError(errorMsg, details)
      case 400:
        throw new DDSValidationError(errorMsg, details)
      default:
        throw new DDSAuthError(errorMsg, data?.code || 'SERVER_ERROR', status, details)
    }
  }

  public async requestVerification(
    params: VerificationRequestParams
  ): Promise<VerificationRequestResult> {
    if (!this.clientId || !this.clientSecret) {
      throw new DDSValidationError('DDS_CLIENT_ID and DDS_CLIENT_SECRET are missing. Please configure them in backend/.env')
    }
    if (!params.mobileId) {
      throw new DDSValidationError('mobileId is required to initiate verification')
    }
    if (!params.origin) {
      throw new DDSValidationError('origin is required to validate application domain')
    }

    const url = `${this.baseURL}/api/v1/verifications`
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs)

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: this.authHeaders,
        body: JSON.stringify({
          mobileId: params.mobileId,
          origin: params.origin,
          callbackUrl: params.callbackUrl,
          metadata: params.metadata || {}
        }),
        signal: controller.signal
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        this.handleErrorResponse(response.status, data)
      }

      return {
        requestId: data.requestId || data.id,
        expiresAt: data.expiresAt,
        status: data.status || 'PENDING',
        deepLink: data.deepLink
      }
    } catch (err: any) {
      if (err instanceof DDSAuthError) throw err
      if (err.name === 'AbortError') {
        throw new DDSNetworkError(`Verification request timed out after ${this.timeoutMs}ms`)
      }
      throw new DDSNetworkError(`Failed to reach DDS Auth server at ${this.baseURL}: ${err.message}`)
    } finally {
      clearTimeout(timeout)
    }
  }

  public async getVerificationStatus(requestId: string): Promise<VerificationStatusResult> {
    if (!requestId || typeof requestId !== 'string') {
      throw new DDSValidationError('A valid requestId string is required')
    }

    const url = `${this.baseURL}/api/v1/verifications/${encodeURIComponent(requestId)}`
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs)

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: this.authHeaders,
        signal: controller.signal
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        this.handleErrorResponse(response.status, data)
      }

      return {
        requestId: data.requestId || requestId,
        status: data.status,
        mobileId: data.mobileId,
        verifiedAt: data.verifiedAt,
        rejectedAt: data.rejectedAt,
        expiredAt: data.expiredAt
      }
    } catch (err: any) {
      if (err instanceof DDSAuthError) throw err
      if (err.name === 'AbortError') {
        throw new DDSNetworkError(`Get verification status timed out after ${this.timeoutMs}ms`)
      }
      throw new DDSNetworkError(`Failed to reach DDS Auth server at ${this.baseURL}: ${err.message}`)
    } finally {
      clearTimeout(timeout)
    }
  }

  public async testConnection(): Promise<TestConnectionResult> {
    const url = `${this.baseURL}/api/v1/applications/health`
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs)

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: this.authHeaders,
        signal: controller.signal
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        this.handleErrorResponse(response.status, data)
      }

      return {
        success: true,
        applicationId: data.applicationId,
        appName: data.appName,
        status: data.status,
        allowedOrigins: data.allowedOrigins || [],
        callbackUrls: data.callbackUrls || [],
        credentialStatus: 'valid',
        message: data.message || 'DDS credentials are valid and connection is active'
      }
    } catch (err: any) {
      if (err instanceof DDSAuthError) throw err
      throw new DDSNetworkError(`Test connection failed: ${err.message}`)
    } finally {
      clearTimeout(timeout)
    }
  }
}

export default DDSAuth
