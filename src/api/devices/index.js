import routeCreate from './create'
import routeRead from './read'

export default function plugin(fastify, options, callback) {
  fastify.route(routeCreate)
  fastify.route(routeRead)

  callback()
}
