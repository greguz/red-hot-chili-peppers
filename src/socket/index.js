import makePlugin from 'fastify-plugin'

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

async function handler(socket, data) {
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

function plugin(fastify, options, callback) {
  fastify.wsRoute({
    method: 'GET',
    url: '/',
    handler
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
