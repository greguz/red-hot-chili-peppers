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

function setHeartbeat(device) {
  return {
    ...device,
    heartbeat: new Date()
  }
}

async function handler(socket, packet) {
  const mac = readMAC(packet.body, 0)
  const greetCode = readGreetCode(packet.body, 6)
  const token = readToken(packet.body, 8)

  socket.mac = mac
  socket.greetCode = greetCode
  socket.device = await this.db.devices.update({ mac, token }, setHeartbeat, {
    relax: true
  })

  console.log(mac)
  console.log(greetCode)
  console.log(socket.device)

  if (socket.device) {
    socket.send(Buffer.from([0x5a, 0xa5, 0x01, 0xa1, 0x00]))
  }
}

export default {
  authenticated: false,
  command: 0xa0,
  length: 40,
  handler
}
