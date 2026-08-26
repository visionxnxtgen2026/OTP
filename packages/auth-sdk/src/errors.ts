/**
 * Base error class for all DDS Auth SDK errors.
 */
export class DDSAuthError extends Error {
  public code: string
  public status?: number
  public details?: any

  constructor(message: string, code: string = 'DDS_AUTH_ERROR', status?: number, details?: any) {
    super(message)
    this.name = 'DDSAuthError'
    this.code = code
    this.status = status
    this.details = details
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export class InvalidCredentialsError extends DDSAuthError {
  constructor(message: string = 'Invalid Client ID or Client Secret', details?: any) {
    super(message, 'INVALID_CREDENTIALS', 401, details)
    this.name = 'InvalidCredentialsError'
  }
}

export class ApplicationRevokedError extends DDSAuthError {
  constructor(message: string = 'This application has been revoked by the developer', details?: any) {
    super(message, 'APPLICATION_REVOKED', 401, details)
    this.name = 'ApplicationRevokedError'
  }
}

export class ApplicationDisabledError extends DDSAuthError {
  constructor(message: string = 'This application is currently disabled', details?: any) {
    super(message, 'APPLICATION_DISABLED', 403, details)
    this.name = 'ApplicationDisabledError'
  }
}

export class OriginNotAllowedError extends DDSAuthError {
  constructor(message: string = 'Calling origin is not in the application whitelist', details?: any) {
    super(message, 'ORIGIN_NOT_ALLOWED', 403, details)
    this.name = 'OriginNotAllowedError'
  }
}

export class MobileNotRegisteredError extends DDSAuthError {
  constructor(message: string = 'Mobile number is not registered in the DDS Auth ecosystem', details?: any) {
    super(message, 'MOBILE_NOT_REGISTERED', 404, details)
    this.name = 'MobileNotRegisteredError'
  }
}

export class VerificationExpiredError extends DDSAuthError {
  constructor(message: string = 'The verification request has expired', details?: any) {
    super(message, 'VERIFICATION_EXPIRED', 410, details)
    this.name = 'VerificationExpiredError'
  }
}

export class VerificationAlreadyCompletedError extends DDSAuthError {
  constructor(message: string = 'The verification request has already been finalized', details?: any) {
    super(message, 'VERIFICATION_ALREADY_COMPLETED', 409, details)
    this.name = 'VerificationAlreadyCompletedError'
  }
}

export class RateLimitError extends DDSAuthError {
  constructor(message: string = 'Too many verification attempts. Please try again later.', details?: any) {
    super(message, 'RATE_LIMIT_EXCEEDED', 429, details)
    this.name = 'RateLimitError'
  }
}

export class DDSNetworkError extends DDSAuthError {
  constructor(message: string = 'Could not connect to DDS Auth server', details?: any) {
    super(message, 'NETWORK_ERROR', 503, details)
    this.name = 'DDSNetworkError'
  }
}
