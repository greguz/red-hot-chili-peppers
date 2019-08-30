import makePlugin from 'fastify-plugin'
import { Server } from 'ws'

function compileSignature(request) {
  return request.method + '_' + request.url
}

function startTimer() {
  const start = new Date()
  return function endTimer() {
    const end = new Date()
    return end.getTime() - start.getTime()
  }
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

  async function dispatch(request, client, message) {
    const route = routes[compileSignature(request)]
    if (route) {
      await route.handler.call(fastify, client, message)
    }
  }

  fastify.ready(err => {
    if (err) {
      return
    }

    keepAliveInterval = setInterval(() => {
      for (const client of wss.clients) {
        if (!client.isAlive) {
          client.log.info('websocket disconnected')
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

      client.isAlive = true
      client.on('pong', () => (client.isAlive = true))

      client.on('message', message => {
        const timer = startTimer()

        dispatch(request, client, message)
          .catch(err => client.log.error(err))
          .then(() =>
            client.log.info({
              handleTime: timer(),
              msg: 'message handled'
            })
          )
      })
    })
  })

  callback()
}

export default makePlugin(plugin, {
  fastify: '^2.0.0',
  name: 'socket'
})
