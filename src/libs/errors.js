export class ServerError extends Error {
  constructor(message, statusCode, details) {
    super(message || 'An error occurred')
    Error.captureStackTrace(this, ServerError)
    this.statusCode = statusCode || 500
    this.details = details || {}
  }
}

export default ServerError

export class BadRequestError extends ServerError {
  constructor(message, details) {
    super(message || 'Bad Request', 400, details)
  }
}

export class UnauthorizedError extends ServerError {
  constructor(message, details) {
    super(message || 'Unauthorized', 401, details)
  }
}

export class ForbiddenError extends ServerError {
  constructor(message, details) {
    super(message || 'Forbidden', 403, details)
  }
}

export class NotFoundError extends ServerError {
  constructor(message, details) {
    super(message || 'Not Found', 404, details)
  }
}
