import makePlugin from 'fastify-plugin'

async function hook(request) {
  const users = await this.db.users
    .find(
      {
        // TODO: authentication
      },
      {
        limit: 1,
        projection: {
          _id: 1
        }
      }
    )
    .toArray()

  if (users.length > 0) {
    request.userId = users[0]._id.toHexString()
  }
}

function plugin(fastify, options, callback) {
  fastify.addHook('onRequest', hook)
  callback()
}

export default makePlugin(plugin, {
  fastify: '^2.0.0',
  name: 'session',
  decorators: {
    fastify: ['db']
  }
})
