import crypto from 'crypto'

import { AuthorizationLevel } from '../../libs/enums'
import { ConflictError } from '../../libs/errors'

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

async function createDevice(collection, userId, mac, token, name) {
  const heartbeat = new Date()
  const updateResult = await collection.findOneAndUpdate(
    {
      mac,
      userId,
      _deleted: {
        $exists: true
      }
    },
    {
      $set: {
        token,
        name,
        heartbeat
      },
      $unset: {
        _deleted: ''
      }
    },
    { returnOriginal: false }
  )
  if (updateResult.value) {
    return updateResult.value
  }
  const insertResult = await collection.insertOne({
    userId,
    mac,
    token,
    name,
    heartbeat
  })
  return insertResult.ops[0]
}

async function handler(request, reply) {
  const greetCode = request.body.code

  const socketClient = this.ws.findClient(
    item => !item.deviceId && item.greetCode === greetCode
  )
  if (!socketClient) {
    throw new ConflictError('Device not found')
  }

  const token = crypto.randomBytes(32)

  const device = await createDevice(
    this.db.devices,
    request.userId,
    socketClient.mac,
    token.toString('hex'),
    request.body.name || socketClient.mac.toUpperCase()
  )

  socketClient.send(createPacket(socketClient.mac, greetCode, token))

  socketClient.deviceId = device._id.toHexString()

  reply.status(201).send(device)
}

export default {
  method: 'POST',
  url: '/',
  handler,
  config: {
    authorizationLevel: AuthorizationLevel.USER
  },
  schema: {
    description: 'Pair new device',
    tags: ['device'],
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
