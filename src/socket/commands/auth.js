function readMAC(buffer, offset) {
  const mac = []
  for (let i = 0; i < 6; i++) {
    mac.push(
      buffer
        .readUInt8(i + offset)
        .toString(16)
        .padStart(2, '0')
    )
  }
  return mac.join(':')
}

function readGreetCode(buffer, offset) {
  return buffer
    .subarray(offset, offset + 2)
    .toString('hex')
    .padStart(4, '0')
}

function readToken(buffer, offset) {
  return buffer.subarray(offset, offset + 32).toString('hex')
}

async function readDevice(db, mac, token) {
  const { value } = await db.devices.findOneAndUpdate(
    {
      mac,
      token
    },
    {
      $set: {
        heartbeat: new Date()
      }
    },
    {
      projection: {
        _id: 1,
        userId: 1
      }
    }
  )
  return value
}

async function handler(socket, packet) {
  const mac = readMAC(packet.body, 0)
  const greetCode = readGreetCode(packet.body, 6)
  const token = readToken(packet.body, 8)
  const device = await readDevice(this.db, mac, token)

  socket.mac = mac
  socket.greetCode = greetCode
  socket.deviceId = device ? device._id.toHexString() : null
  socket.userId = device ? device.userId : null

  socket.log.info({
    device: {
      mac,
      greetCode
    },
    msg: socket.deviceId ? 'device authenticated' : 'device ready'
  })

  if (socket.deviceId) {
    socket.send(Buffer.from([0x5a, 0xa5, 0x01, 0xa1, 0x00]))
  }
}

export default {
  authenticated: false,
  version: 1,
  command: 0xa0,
  length: 40,
  handler
}
