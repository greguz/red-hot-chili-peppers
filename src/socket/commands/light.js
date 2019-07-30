import { sendMessage } from '../telegram'

async function handler(socket, packet) {
  const value = packet.body.readInt32BE(0)

  socket.device = await this.db.devices.map(socket.device, device => ({
    ...device,
    heartbeat: new Date(),
    readings: {
      ...device.readings,
      light: value
    }
  }))

  await sendMessage(`Light: ${value}lx`)
}

export default {
  authenticated: true,
  command: 0x72,
  length: 4,
  handler
}
