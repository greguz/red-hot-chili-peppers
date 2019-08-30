import makePlugin from 'fastify-plugin'

import ServerError from '../libs/errors'

function errorHandler(error, request, reply) {
  const statusCode = error.statusCode || 500
  const isClientError = statusCode >= 400 && statusCode < 500

  if (isClientError) {
    request.log.info(error)
  } else {
    request.log.error(error)
  }

  let body
  if (error instanceof ServerError && isClientError) {
    body = { message: error.message, ...error.details }
  } else if (error.validation) {
    body = { message: error.message }
  } else {
    body = { message: 'An error occurred' }
  }

  reply.status(statusCode).send(body)
}

function plugin(fastify, _options, callback) {
  fastify.setErrorHandler(errorHandler)
  callback()
}

export default makePlugin(plugin, {
  fastify: '^2.0.0',
  name: 'errors'
})
