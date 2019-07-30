import { sendMessage } from '../telegram'

async function handler(socket, packet) {
  const value = packet.body.readUInt8(0)

  socket.device = await this.db.devices.map(socket.device, device => ({
    ...device,
    heartbeat: new Date(),
    readings: {
      ...device.readings,
      soilMoisture: value
    }
  }))

  await sendMessage(`Soil moisture: ${value}%`)
}

export default {
  authenticated: true,
  command: 0x75,
  length: 1,
  handler
}
