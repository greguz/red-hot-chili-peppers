import { sendMessage } from '../telegram'

async function handler(socket, packet) {
  const value = packet.body.readInt8(0)

  socket.device = await this.db.devices.map(socket.device, device => ({
    ...device,
    heartbeat: new Date(),
    readings: {
      ...device.readings,
      airTemperature: value
    }
  }))

  await sendMessage(`Air temperature: ${value}°C`)
}

export default {
  authenticated: true,
  command: 0x74,
  length: 1,
  handler
}
