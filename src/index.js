import 'make-promises-safe'

import fastify from 'fastify'
import helmet from 'fastify-helmet'
import mongodb from 'fastify-mongodb'
import noAdditionalProperties from 'fastify-no-additional-properties'
import noFavicon from 'fastify-no-icon'

import db from './plugins/db'
import session from './plugins/session'
import ws from './plugins/ws'

import api from './api'
import socket from './socket'

const app = fastify({
  logger: true
})

app.register(noAdditionalProperties)

app.register(helmet, {
  // https://github.com/fastify/fastify-helmet#how-it-works
})

app.register(noFavicon)

app.register(mongodb, {
  forceClose: true,
  url: process.env.MONGO_URI,
  database: process.env.MONGO_DB
})

app.register(db)

app.register(session)

app.register(api, {
  prefix: `/api/v1`
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
