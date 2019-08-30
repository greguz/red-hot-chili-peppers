import makePlugin from 'fastify-plugin'
import MongoQS from 'mongo-querystring'

function buildQueryStringHook() {
  const qs = new MongoQS({
    blacklist: {
      page: 1,
      size: 1,
      fields: 1
    }
  })

  return (request, _reply, callback) => {
    request.generateMongoQuery = query => {
      return qs.parse(query || request.query)
    }
    callback()
  }
}

function plugin(fastify, _options, callback) {
  const { db } = fastify.mongo
  if (!db) {
    throw new Error('Database instance is missing')
  }

  db.on('error', err => fastify.log.error(err))

  fastify.decorate('db', {
    devices: db.collection('devices'),
    users: db.collection('users')
  })

  fastify.decorateRequest('generateMongoQuery', null)
  fastify.addHook('preHandler', buildQueryStringHook())

  callback()
}

export default makePlugin(plugin, {
  fastify: '^2.0.0',
  name: 'db',
  decorators: {
    fastify: ['mongo']
  }
})
