import makePlugin from 'fastify-plugin'
import _ from 'lodash'

import {
  NotFoundError,
  BadRequestError,
  UnauthorizedError
} from '../libs/errors'

import commands from './commands'

function parsePacket(data) {
  // Ensure buffer type
  if (!Buffer.isBuffer(data)) {
    throw new BadRequestError('Invalid message type')
  }

  // Min packet size
  if (data.byteLength < 5) {
    throw new BadRequestError('Invalid packet size')
  }

  // Validate header consts
  if (data.readUInt8(0) !== 0x5a || data.readUInt8(1) !== 0xa5) {
    throw new BadRequestError('Unexpected header')
  }

  // Ensure protocol version
  if (data.readUInt8(2) !== 1) {
    throw new BadRequestError('Unsupported protocol version')
  }

  // Validate body length
  if (data.byteLength !== data.readUInt8(4) + 5) {
    throw new BadRequestError('Malformed packet')
  }

  return {
    payload: data,
    header: data.subarray(0, 4),
    body: data.subarray(5),
    command: data.readUInt8(3)
  }
}

async function messageHandler(socket, data) {
  const packet = parsePacket(data)
  const command = commands.find(item => item.command === packet.command)
  if (!command) {
    throw new NotFoundError('Unknown command')
  }
  if (
    typeof command.length === 'number' &&
    command.length !== packet.body.length
  ) {
    throw new BadRequestError('Invalid command length')
  }
  if (command.authenticated === true && !socket.deviceId) {
    throw new UnauthorizedError()
  }
  await command.handler.call(this, socket, packet)
}

function startTimer() {
  const start = new Date()
  return function endTimer() {
    const end = new Date()
    return end.getTime() - start.getTime()
  }
}

function plugin(fastify, options, callback) {
  let connectionsCounter = 1
  let interval

  fastify.route({
    method: 'GET',
    url: '/api/v1/test',
    handler(request, reply) {
      reply.status(204).send()
    }
  })

  // Clean up procedure
  fastify.addHook('onClose', (f, done) => {
    clearInterval(interval)
    done()
  })

  fastify.ready(err => {
    if (err) {
      return
    }

    // WebSocket server instance (from another plugin)
    const server = fastify.ws

    // Detect disconnected sockets
    interval = setInterval(() => {
      for (const client of server.clients) {
        if (!client.isAlive) {
          client.log.info('websocket disconnected')
          client.terminate()
        } else {
          client.isAlive = false
          client.ping(_.noop)
        }
      }
    }, 5000)

    server.on('connection', (client, request) => {
      let messagesCounter = 1

      // Setup custom logger
      client.log = fastify.log.child({ socketId: connectionsCounter++ })

      // Notify connection
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

      // Handle client errors
      client.on('error', err => client.log.error(err))

      // Start keep alive communication
      client.isAlive = true
      client.on('pong', () => (client.isAlive = true))

      // Handle messages
      client.on('message', data => {
        const timer = startTimer()
        const logger = client.log.child({ messageId: messagesCounter++ })

        messageHandler
          .call(fastify, client, data)
          .catch(err => logger.error(err))
          .then(() =>
            logger.info({
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
  name: 'socket',
  decorators: {
    fastify: ['ws']
  }
})
