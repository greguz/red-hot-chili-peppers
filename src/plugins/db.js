import makePlugin from 'fastify-plugin'

function plugin(fastify, options, callback) {
  const { db } = fastify.mongo
  if (!db) {
    throw new Error('Database instance is missing')
  }

  db.on('error', err => fastify.log.error(err))

  fastify.decorate('db', {
    devices: db.collection('devices'),
    users: db.collection('users')
  })

  callback()
}

export default makePlugin(plugin, {
  fastify: '^2.0.0',
  name: 'db',
  decorators: {
    fastify: ['mongo']
  }
})
