import routeCreate from './create'
import routeDelete from './delete'
import routeRead from './read'
import routeReadings from './readings'
import routeSearch from './search'

export default function plugin(fastify, _options, callback) {
  fastify.route(routeCreate)
  fastify.route(routeDelete)
  fastify.route(routeRead)
  fastify.route(routeReadings)
  fastify.route(routeSearch)

  callback()
}
