import crypto from 'crypto'

import { AuthorizationLevel } from '../../libs/enums'

import deviceSchema from './schema'

function createPacket(mac, greetCode, token) {
  const buffer = Buffer.alloc(45)

  buffer.writeUInt8(0x5a, 0) // preamble
  buffer.writeUInt8(0xa5, 1) // preamble
  buffer.writeUInt8(0x01, 2) // protocol version
  buffer.writeUInt8(0xaa, 3) // command
  buffer.writeUInt8(40, 4) // payload length

  const m = mac.split(':')
  for (let i = 0; i < 6; i++) {
    buffer.writeUInt8(parseInt(m[i], 16), i + 5)
  }

  buffer.writeUInt16BE(parseInt(greetCode, 16), 11)

  for (let i = 0; i < 32; i++) {
    buffer.writeUInt8(token.readUInt8(i), i + 13)
  }

  return buffer
}

function findClient(server, greetCode) {
  let result = null
  server.clients.forEach(client => {
    if (!client.deviceId && client.greetCode === greetCode) {
      result = client
    }
  })
  return result
}

async function handler(request, reply) {
  const greetCode = request.body.code

  const client = findClient(this.ws, greetCode)
  if (!client) {
    throw new Error('Device not found')
  }

  // Generate random 256bit auth token
  const token = crypto.randomBytes(32)

  // Send bind command
  client.send(createPacket(client.mac, greetCode, token))

  // Create device inside DB
  const { insertedId } = await this.db.devices.insertOne({
    userId: request.userId,
    mac: client.mac,
    token: token.toString('hex'),
    name: request.body.name || client.mac.toUpperCase(),
    heartbeat: new Date()
  })

  // Authenticate socket as device
  client.deviceId = insertedId

  reply.send({ _id: insertedId })
}

export default {
  method: 'POST',
  url: '/',
  handler,
  config: {
    authorizationLevel: AuthorizationLevel.USER
  },
  schema: {
    body: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          pattern: '^[a-f0-9]{4}$'
        },
        name: {
          type: 'string',
          maxLength: 50
        }
      },
      required: ['code']
    },
    response: {
      200: deviceSchema
    }
  }
}
