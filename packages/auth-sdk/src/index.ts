declare const process: any

import {
  DDSAuthConfig,
  VerificationRequestOptions,
  VerificationRequestResponse,
  VerificationStatusResponse,
  DDSApplicationStatus
} from './types.js'
import {
  DDSAuthError,
  InvalidCredentialsError,
  ApplicationRevokedError,
  ApplicationDisabledError,
  OriginNotAllowedError,
  MobileNotRegisteredError,
  VerificationExpiredError,
  VerificationAlreadyCompletedError,
  RateLimitError,
  DDSNetworkError
} from './errors.js'

export * from './types.js'
export * from './errors.js'

export class DDSAuth {
  private clientId: string
  private clientSecret: string
  private baseURL: string
  private timeoutMs: number

  public verification: {
    request: (options: VerificationRequestOptions) => Promise<VerificationRequestResponse>
    status: (requestId: string) => Promise<VerificationStatusResponse>
    cancel: (requestId: string) => Promise<{ success: boolean; message: string }>
  }

  public application: {
    status: (origin?: string) => Promise<DDSApplicationStatus>
  }

  public health: {
    check: (origin?: string) => Promise<DDSApplicationStatus>
  }

  constructor(options: DDSAuthConfig = {}) {
    this.clientId =
      options.clientId || (typeof process !== 'undefined' ? process.env.DDS_CLIENT_ID || '' : '')
    this.clientSecret =
      options.clientSecret ||
      (typeof process !== 'undefined' ? process.env.DDS_CLIENT_SECRET || '' : '')
    this.baseURL = (
      options.baseURL ||
      (typeof process !== 'undefined' ? process.env.DDS_AUTH_URL : undefined) ||
      'http://localhost:5000'
    ).replace(/\/$/, '')
    this.timeoutMs = options.timeoutMs || 10000

    this.verification = {
      request: this._requestVerification.bind(this),
      status: this._getVerificationStatus.bind(this),
      cancel: this._cancelVerification.bind(this)
    }

    this.application = {
      status: this._validateApplication.bind(this)
    }

    this.health = {
      check: this._validateApplication.bind(this)
    }
  }

  private _mapError(errData: any, status: number): DDSAuthError {
    const code = errData?.error || 'UNKNOWN_ERROR'
    const message = errData?.message || errData?.error || 'DDS verification error'

    if (code === 'INVALID_CLIENT_ID' || code === 'INVALID_CLIENT_SECRET' || code === 'INVALID_CREDENTIALS') {
      return new InvalidCredentialsError(message, errData)
    }
    if (code === 'APPLICATION_REVOKED') {
      return new ApplicationRevokedError(message, errData)
    }
    if (code === 'APPLICATION_DISABLED') {
      return new ApplicationDisabledError(message, errData)
    }
    if (code === 'ORIGIN_NOT_ALLOWED') {
      return new OriginNotAllowedError(message, errData)
    }
    if (code === 'MOBILE_NOT_REGISTERED') {
      return new MobileNotRegisteredError(message, errData)
    }
    if (code === 'VERIFICATION_EXPIRED') {
      return new VerificationExpiredError(message, errData)
    }
    if (code === 'ALREADY_VERIFIED' || code === 'VERIFICATION_ALREADY_COMPLETED') {
      return new VerificationAlreadyCompletedError(message, errData)
    }
    if (code === 'RATE_LIMIT_EXCEEDED') {
      return new RateLimitError(message, errData)
    }
    return new DDSAuthError(message, code, status, errData)
  }

  private async _requestVerification(
    options: VerificationRequestOptions
  ): Promise<VerificationRequestResponse> {
    if (!options.mobileId) {
      throw new DDSAuthError('mobileId is required to request verification', 'INVALID_ARGUMENT', 400)
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-client-id': this.clientId,
      'x-client-secret': this.clientSecret
    }

    if (options.origin) {
      headers['origin'] = options.origin
    }

    try {
      const res = await fetch(`${this.baseURL}/api/v1/verifications`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ mobileId: options.mobileId }),
        signal: AbortSignal.timeout(this.timeoutMs)
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw this._mapError(data, res.status)
      }

      return data
    } catch (err: any) {
      if (err instanceof DDSAuthError) throw err
      throw new DDSNetworkError(`Connection to DDS Auth Server (${this.baseURL}) failed: ${err.message}`, err)
    }
  }

  private async _getVerificationStatus(requestId: string): Promise<VerificationStatusResponse> {
    if (!requestId) {
      throw new DDSAuthError('requestId is required to check status', 'INVALID_ARGUMENT', 400)
    }

    try {
      const res = await fetch(`${this.baseURL}/api/v1/verifications/${encodeURIComponent(requestId)}`, {
        method: 'GET',
        headers: {
          'x-client-id': this.clientId,
          'x-client-secret': this.clientSecret
        },
        signal: AbortSignal.timeout(this.timeoutMs)
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw this._mapError(data, res.status)
      }

      return data
    } catch (err: any) {
      if (err instanceof DDSAuthError) throw err
      throw new DDSNetworkError(`Connection to DDS Auth Server failed: ${err.message}`, err)
    }
  }

  private async _cancelVerification(
    requestId: string
  ): Promise<{ success: boolean; message: string }> {
    if (!requestId) {
      throw new DDSAuthError('requestId is required to cancel verification', 'INVALID_ARGUMENT', 400)
    }

    try {
      const res = await fetch(`${this.baseURL}/api/v1/verifications/${encodeURIComponent(requestId)}/cancel`, {
        method: 'POST',
        headers: {
          'x-client-id': this.clientId,
          'x-client-secret': this.clientSecret
        },
        signal: AbortSignal.timeout(this.timeoutMs)
      })

      const data = await res.json()
      return data
    } catch (err: any) {
      if (err instanceof DDSAuthError) throw err
      throw new DDSNetworkError(`Connection to DDS Auth Server failed: ${err.message}`, err)
    }
  }

  private async _validateApplication(origin?: string): Promise<DDSApplicationStatus> {
    try {
      const res = await fetch(`${this.baseURL}/api/v1/auth/validate-client`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: this.clientId,
          clientSecret: this.clientSecret,
          origin
        }),
        signal: AbortSignal.timeout(this.timeoutMs)
      })

      const data = await res.json()
      return data
    } catch (err: any) {
      return {
        success: false,
        status: 'INVALID_CLIENT_ID',
        message: `DDS Auth backend unreachable at ${this.baseURL}: ${err.message}`
      }
    }
  }
}

export default DDSAuth
