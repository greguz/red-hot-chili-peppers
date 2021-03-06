async function handler(client, packet) {
  const { ObjectId } = this.mongo

  const now = new Date()
  const value = packet.body.readInt8(0)

  client.log.trace(`Soil temperature: ${value}°C`)

  await Promise.all([
    this.db.devices.updateOne(
      { _id: new ObjectId(client.deviceId) },
      {
        $set: {
          heartbeat: now,
          'readings.soilTemperature': value
        }
      }
    ),
    this.db.readings.insertOne({
      userId: client.userId,
      deviceId: client.deviceId,
      type: 'SOIL_TEMPERATURE',
      value: value,
      _created: now
    })
  ])
}

export default {
  authenticated: true,
  version: 1,
  command: 0x76,
  length: 1,
  handler
}
