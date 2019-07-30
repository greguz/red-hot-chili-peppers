import { sendMessage } from '../telegram'

async function handler(socket, packet) {
  const battery = packet.body.readUInt8(0)
  const light = packet.body.readUInt32BE(1)
  const airHumidity = packet.body.readUInt8(5)
  const airTemperature = packet.body.readInt8(6)
  const soilMoisture = packet.body.readUInt8(7)
  const soilTemperature = packet.body.readInt8(8)

  socket.device = await this.db.devices.update(socket.device._id, device => ({
    ...device,
    heartbeat: new Date(),
    readings: {
      ...device.readings,
      battery,
      light,
      airHumidity,
      airTemperature,
      soilMoisture,
      soilTemperature
    }
  }))

  let text =
    `Battery: ${battery} %` +
    `\nLight: ${light} lx` +
    `\nAir humidity: ${airHumidity} %` +
    `\nAir temperature: ${airTemperature} °C` +
    `\nSoil moisture: ${soilMoisture} %` +
    `\nSoil temperature: ${soilTemperature} °C`

  await sendMessage(text)
}

export default {
  authenticated: true,
  command: 0x70,
  length: 9,
  handler
}
