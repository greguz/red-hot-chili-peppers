import routeCreate from './create'
import routeRead from './read'
import routeSearch from './search'

export default function plugin(fastify, _options, callback) {
  fastify.route(routeCreate)
  fastify.route(routeRead)
  fastify.route(routeSearch)

  callback()
}
