import { sendMessage } from '../telegram'

async function handler(socket, packet) {
  const value = packet.body.readUInt8(0)

  socket.device = await this.db.devices.map(socket.device, device => ({
    ...device,
    heartbeat: new Date(),
    readings: {
      ...device.readings,
      battery: value
    }
  }))

  await sendMessage(`Battery: ${value}%`)
}

export default {
  authenticated: true,
  command: 0x71,
  length: 1,
  handler
}
