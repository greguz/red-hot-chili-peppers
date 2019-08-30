import 'make-promises-safe'

import fastify from 'fastify'
import helmet from 'fastify-helmet'
import mongodb from 'fastify-mongodb'
import noAdditionalProperties from 'fastify-no-additional-properties'
import cookies from 'fastify-cookie'
import swagger from 'fastify-swagger'

import db from './plugins/db'
import errors from './plugins/errors'
import session from './plugins/session'
import telegram from './plugins/telegram'
import ws from './plugins/ws'

import api from './api'
import socket from './socket'

const app = fastify({
  ignoreTrailingSlash: true,
  logger: {
    level: process.env.LOG_LEVEL || 'info'
  }
})

app.register(swagger, {
  swagger: {
    info: {
      title: 'Red Hot Chili Peppers',
      description: 'An overcomplicated method to grow some chili peppers',
      version: '0.1.0'
    },
    host: 'localhost',
    schemes: ['http'],
    consumes: ['application/json'],
    produces: ['application/json']
  },
  exposeRoute: true
})

app.register(telegram)

app.register(errors)

app.register(noAdditionalProperties)

app.register(helmet, {
  // https://github.com/fastify/fastify-helmet#how-it-works
})

app.register(mongodb, {
  forceClose: true,
  url: process.env.MONGO_URI,
  database: process.env.MONGO_DATABASE
})

app.register(db)

app.register(cookies)

app.register(session)

app.register(api, {
  prefix: '/api/v1'
})

app.register(ws)

app.register(socket)

app.listen(
  process.env.SERVER_PORT || '8008',
  process.env.SERVER_ADDR || '0.0.0.0',
  (err, address) => {
    if (err) {
      app.log.error(err)
      process.exit(1)
    } else {
      app.log.info(`Server is listening on ${address}`)
    }
  }
)
