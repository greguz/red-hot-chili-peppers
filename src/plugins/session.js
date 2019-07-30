import makePlugin from 'fastify-plugin'

async function hook(request) {
  // TODO: authentication
  request.user = await this.db.users.findOne()
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
