import { sendMessage } from '../telegram'

async function handler(socket, packet) {
  const value = packet.body.readUInt8(0)

  socket.device = await this.db.devices.map(socket.device, device => ({
    ...device,
    heartbeat: new Date(),
    readings: {
      ...device.readings,
      airHumidity: value
    }
  }))

  await sendMessage(`Air humidity: ${value}%`)
}

export default {
  authenticated: true,
  command: 0x73,
  length: 1,
  handler
}
