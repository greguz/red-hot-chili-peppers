import makePlugin from 'fastify-plugin'
import { Server } from 'ws'

function hook(fastify, callback) {
  fastify.ws.close(callback)
}

function plugin(fastify, options, callback) {
  const wss = new Server({
    server: fastify.server
  })

  // Handle socket server errors
  wss.on('error', err => fastify.log.error(err))

  // Decorate fastify instance
  fastify.decorate('ws', wss)

  // Unload socket server on process exit
  fastify.addHook('onClose', hook)

  callback()
}

export default makePlugin(plugin, {
  fastify: '^2.0.0',
  name: 'ws'
})
