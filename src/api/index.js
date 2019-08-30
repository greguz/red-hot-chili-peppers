import devices from './devices/index.js'

export default function plugin(fastify, _options, callback) {
  fastify.register(devices, { prefix: '/devices' })

  callback()
}
