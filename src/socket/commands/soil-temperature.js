import { sendMessage } from '../telegram'

async function handler(socket, packet) {
  const value = packet.body.readInt8(0)

  socket.device = await this.db.devices.map(socket.device, device => ({
    ...device,
    heartbeat: new Date(),
    readings: {
      ...device.readings,
      soilTemperature: value
    }
  }))

  await sendMessage(`Soil temperature: ${value}°C`)
}

export default {
  authenticated: true,
  command: 0x76,
  length: 1,
  handler
}
