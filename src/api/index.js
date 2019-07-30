import devices from './devices/index.js'

export default function plugin(fastify, options, callback) {
  fastify.register(devices, { prefix: `/devices` })

  callback()
}
