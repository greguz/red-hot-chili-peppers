async function handler(client, packet) {
  const { ObjectId } = this.mongo

  const now = new Date()
  const value = packet.body.readUInt8(0)

  client.log.trace(`Soil moisture: ${value}%`)

  await Promise.all([
    this.db.devices.updateOne(
      { _id: new ObjectId(client.deviceId) },
      {
        $set: {
          heartbeat: now,
          'readings.soilMoisture': value
        }
      }
    ),
    this.db.readings.insertOne({
      userId: client.userId,
      deviceId: client.deviceId,
      type: 'SOIL_MOISTURE',
      value: value,
      _created: now
    })
  ])
}

export default {
  authenticated: true,
  version: 1,
  command: 0x75,
  length: 1,
  handler
}
