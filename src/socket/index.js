import makePlugin from 'fastify-plugin'
import isNil from 'lodash/isNil'
import get from 'lodash/get'

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

async function messageHandler(client, message) {
  const packet = parsePacket(message)
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
  if (command.authenticated === true && !client.deviceId) {
    throw new UnauthorizedError()
  }
  await command.handler.call(this, client, packet)
}

async function sendTelegramNotification(socket) {
  const { ObjectId } = this.mongo

  const device = await this.db.devices.findOne(
    { _id: new ObjectId(socket.deviceId) },
    {
      projection: {
        readings: 1,
        'telegram.chatId': 1
      }
    }
  )

  const chatId = get(device, 'telegram.chatId')
  if (chatId) {
    const rows = []
    if (device) {
      const readings = device.readings || {}

      if (!isNil(readings.battery)) {
        rows.push(`Battery: ${readings.battery}%`)
      }
      if (!isNil(readings.light)) {
        rows.push(`Light: ${readings.light}lx`)
      }
      if (!isNil(readings.airHumidity)) {
        rows.push(`Air humidity: ${readings.airHumidity}%`)
      }
      if (!isNil(readings.airTemperature)) {
        rows.push(`Air temperature: ${readings.airTemperature}°C`)
      }
      if (!isNil(readings.soilMoisture)) {
        rows.push(`Soil moisture: ${readings.soilMoisture}%`)
      }
      if (!isNil(readings.soilTemperature)) {
        rows.push(`Soil temperature: ${readings.soilTemperature}°C`)
      }
    }
    if (rows.length > 0) {
      await this.telegram.sendMessage(chatId, rows.join('\n'))
    }
  }
}

async function connectionHandler(client) {
  client.on('message', message => {
    messageHandler
      .call(this, client, message)
      .catch(err => client.log.error(err))
  })

  if (this.hasDecorator('telegram')) {
    client.on('close', () => {
      sendTelegramNotification
        .call(this, client)
        .catch(err => client.log.error(err))
    })
  }
}

function plugin(fastify, _options, callback) {
  fastify.wsRoute({
    url: '/device',
    handler: connectionHandler
  })

  callback()
}

export default makePlugin(plugin, {
  fastify: '^2.0.0',
  name: 'socket',
  decorators: {
    fastify: ['wsRoute']
  }
})
