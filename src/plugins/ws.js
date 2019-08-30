import makePlugin from 'fastify-plugin'
import { Server } from 'ws'

function compileSignature(request) {
  return request.method + '_' + request.url
}

function plugin(fastify, _options, callback) {
  let connectionsCounter = 1
  let keepAliveInterval
  const routes = {}

  const wss = new Server({
    server: fastify.server
  })

  wss.on('error', err => fastify.log.error(err))

  fastify.decorate('ws', wss)

  fastify.addHook('onClose', (_fastify, done) => {
    clearInterval(keepAliveInterval)
    wss.close(done)
    done()
  })

  fastify.decorate(
    'wsRoute',
    // TODO: validate route options
    route => (routes[compileSignature(route)] = route)
  )

  function dispatch(client, request) {
    const route = routes[compileSignature(request)]
    if (route) {
      route.handler.call(fastify, client, request)
    }
  }

  fastify.ready(err => {
    if (err) {
      return
    }

    keepAliveInterval = setInterval(() => {
      for (const client of wss.clients) {
        if (!client.isAlive) {
          client.terminate()
        } else {
          client.isAlive = false
          client.ping(() => {})
        }
      }
    }, 5000)

    wss.on('connection', (client, request) => {
      client.log = fastify.log.child({
        socketId: connectionsCounter++
      })

      client.log.info({
        request: {
          method: request.method,
          url: request.url
          // TODO: hostname
          // TODO: remoteAddress
          // TODO: remotePort
        },
        msg: 'websocket connected'
      })

      client.on('error', err => client.log.error(err))

      client.on('close', (code, reason) =>
        client.log.info({
          close: {
            code,
            reason
          },
          msg: 'connection closed'
        })
      )

      client.isAlive = true
      client.on('pong', () => (client.isAlive = true))

      dispatch(client, request)
    })
  })

  callback()
}

export default makePlugin(plugin, {
  fastify: '^2.0.0',
  name: 'socket'
})
