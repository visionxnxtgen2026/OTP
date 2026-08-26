export class DDSAuthError extends Error {
  public readonly code: string
  public readonly statusCode: number
  public readonly details?: any

  constructor(message: string, code: string = 'DDS_AUTH_ERROR', statusCode: number = 500, details?: any) {
    super(message)
    this.name = 'DDSAuthError'
    this.code = code
    this.statusCode = statusCode
    this.details = details
    Object.setPrototypeOf(this, DDSAuthError.prototype)
  }
}

export class DDSAuthenticationError extends DDSAuthError {
  constructor(message: string = 'Invalid Client ID or Client Secret credentials', details?: any) {
    super(message, 'AUTHENTICATION_FAILED', 401, details)
    this.name = 'DDSAuthenticationError'
    Object.setPrototypeOf(this, DDSAuthenticationError.prototype)
  }
}

export class DDSOriginError extends DDSAuthError {
  constructor(origin: string, details?: any) {
    super(`Origin '${origin}' is not in the list of allowed origins for this application`, 'ORIGIN_MISMATCH', 403, details)
    this.name = 'DDSOriginError'
    Object.setPrototypeOf(this, DDSOriginError.prototype)
  }
}

export class DDSApplicationInactiveError extends DDSAuthError {
  constructor(message: string = 'This DDS application is currently disabled or revoked', details?: any) {
    super(message, 'APPLICATION_INACTIVE', 403, details)
    this.name = 'DDSApplicationInactiveError'
    Object.setPrototypeOf(this, DDSApplicationInactiveError.prototype)
  }
}

export class DDSValidationError extends DDSAuthError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', 400, details)
    this.name = 'DDSValidationError'
    Object.setPrototypeOf(this, DDSValidationError.prototype)
  }
}

export class DDSNotFoundError extends DDSAuthError {
  constructor(resource: string = 'Resource', details?: any) {
    super(`${resource} not found`, 'NOT_FOUND', 404, details)
    this.name = 'DDSNotFoundError'
    Object.setPrototypeOf(this, DDSNotFoundError.prototype)
  }
}

export class DDSNetworkError extends DDSAuthError {
  constructor(message: string = 'Failed to communicate with DDS Auth server', details?: any) {
    super(message, 'NETWORK_ERROR', 503, details)
    this.name = 'DDSNetworkError'
    Object.setPrototypeOf(this, DDSNetworkError.prototype)
  }
}
