import makePlugin from 'fastify-plugin'
import _ from 'lodash'

import cmdAitHumidity from './commands/air-humidity'
import cmdAirTemperature from './commands/air-temperature'
import cmdAuth from './commands/auth'
import cmdBattery from './commands/battery'
import cmdLight from './commands/light'
import cmdSoilMoisture from './commands/soil-moisture'
import cmdSoilTemperature from './commands/soil-temperature'

// 0x71 battery %
// 0x72 light lx
// 0x73 airHumidity %
// 0x74 airTemperature °C
// 0x75 soilMoisture %
// 0x76 soilTemperature °C
const COMMANDS = [
  cmdAitHumidity,
  cmdAirTemperature,
  cmdAuth,
  cmdBattery,
  cmdLight,
  cmdSoilMoisture,
  cmdSoilTemperature
]

function parsePacket(data) {
  // Ensure buffer type
  if (!Buffer.isBuffer(data)) {
    throw new Error('Invalid message')
  }

  // Min packet size
  if (data.byteLength < 5) {
    throw new Error('Invalid packet size')
  }

  // Validate header consts
  if (data.readUInt8(0) !== 0x5a || data.readUInt8(1) !== 0xa5) {
    throw new Error('Unexpected header')
  }

  // Ensure protocol version
  if (data.readUInt8(2) !== 1) {
    throw new Error('Unsupported protocol version')
  }

  // Validate body length
  if (data.byteLength !== data.readUInt8(4) + 5) {
    throw new Error('Malformed packet')
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
  const command = COMMANDS.find(item => item.command === packet.command)
  if (!command) {
    throw new Error('Unknown command')
  }
  if (
    typeof command.length === 'number' &&
    command.length !== packet.body.length
  ) {
    throw new Error('Invalid command length')
  }
  if (command.authenticated === false && !!socket.device) {
    throw new Error('Authenticated')
  }
  if (command.authenticated === true && !socket.device) {
    throw new Error('Not authenticated')
  }
  await command.handler.call(this, socket, packet)
}

function plugin(fastify, options, callback) {
  let interval

  fastify.addHook('onClose', (f, done) => {
    clearInterval(interval)
    done()
  })

  fastify.ready(err => {
    if (!err) {
      const server = fastify.ws

      interval = setInterval(() => {
        for (const client of server.clients) {
          if (!client.isAlive) {
            console.log('Offline')
            client.terminate()
          } else {
            client.isAlive = false
            client.ping(_.noop)
          }
        }
      }, 5000) // TODO from options

      server.on('connection', client => {
        client.on('error', err => fastify.log.error(err))

        client.isAlive = true
        client.on('pong', () => (client.isAlive = true))

        client.on('message', data => {
          messageHandler
            .call(fastify, client, data)
            .catch(err => fastify.log.error(err))
        })
      })
    }
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
