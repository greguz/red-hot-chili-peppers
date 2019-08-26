import ServerError from '../libs/errors'

export default function errorHandler(error, request, reply) {
  const statusCode = error.statusCode || 500

  if (statusCode >= 400 && statusCode < 500) {
    request.log.info(error)
  } else {
    request.log.error(error)
  }

  let body
  if (error instanceof ServerError) {
    body = { message: error.message, ...error.details }
  } else if (error.validation) {
    body = { message: error.message }
  } else {
    body = { message: 'An error occurred' }
  }

  reply.status(statusCode).send(body)
}
